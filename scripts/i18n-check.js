#!/usr/bin/env node
/* global __dirname */
/**
 * Translation check — `npm run i18n:check`.
 *
 * Collects every user-facing English key the app uses and reports, per language file in
 * src/i18n/locales/, which keys are missing, unused, or have different {{placeholders}}.
 * Exits with code 1 when any language is missing a key, so it can gate a commit/CI.
 *
 * Keys come from:
 *  - `t('…')` / `i18n.t('…')` calls with a literal first argument (plus `{ context: 'x' }` → `key_x`);
 *  - English strings in the constants listed in EXTRA_CONSTANTS, which are translated where they
 *    render (`t(row.label)`) — add a constant here when you add such a list;
 *  - return values of the label helpers in RETURN_HELPERS.
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..', 'src');
const LOCALES = path.join(ROOT, 'i18n', 'locales');

const EXTRA_CONSTANTS = {
  'data/account-menu.ts': ['ACCOUNT_SECTIONS'],
  'data/menu-items.ts': ['*'],
  'data/challenges.ts': ['CHALLENGES'],
  'data/social-tasks.ts': ['SOCIAL_ACTION_HINTS', 'FOLLOW_TIERS', 'FOLLOWER_TIERS'],
  'data/collections-mock.ts': ['COLLECTIONS_CATEGORY_TABS'],
  'app/(tabs)/collectibles.tsx': ['TABS', 'WIN_STATUS_LABEL'],
  'app/(tabs)/auctions.tsx': ['TABS'],
  'app/(tabs)/(drawer)/(home-tabs)/feed.tsx': ['SEGMENTS'],
  'components/collections/auctions-tab-page.tsx': ['STATUS_FILTERS'],
  'services/catalog-filters.ts': ['BLOCKCHAIN_OPTIONS', 'DESTINATION_OPTIONS', 'EDITION_OPTIONS'],
  'services/feed-api.ts': ['REPORT_REASONS'],
  'components/home/rarity-badge.tsx': ['RARITY_LABEL'],
  'components/rewards/rank-info-sheet.tsx': ['TITLES'],
  'app/(tabs)/doodles-physicals.tsx': ['INFO_TEXT'],
  'components/chat/block-user-sheet.tsx': ['CONSEQUENCES'],
  'app/(tabs)/personal-info.tsx': ['GENDERS'],
  'i18n/index.ts': ['LANGUAGES'],
};
const RETURN_HELPERS = {
  'app/(tabs)/notifications.tsx': ['dayBucket'],
  'app/(tabs)/profile/[id].tsx': ['followButtonLabel'],
  'components/feed/post-options-sheet.tsx': ['followLabel'],
  'services/wallet-api.ts': ['transactionDirection'],
  'components/drop-detail/blind-box-items.tsx': ['rarityStyle'],
  'app/(tabs)/blindbox-item/[dropId]/[itemId].tsx': ['rarityStyle'],
  'components/collections/card-image-badges.tsx': ['editionTag'],
};
// Rendered through t(variable) but never written as a literal in the app.
const EXTRA_KEYS = [
  'Requested_button', 'Following_button', 'Request_button', 'Follow_button', // followButtonLabel(…, { context: 'button' })
  'Regular', 'Rare', 'Legendary', 'Secret Rare', 'Common', 'Ultra Rare', // backend rarity names
];
// Read the same in every language (brand names, units, numbers) — may be left out of a locale file.
const SAME_IN_ALL = new Set(['0x...', '+10 XP', '+100 XP', '+15 XP', '+50 XP', '+500 XP', '+{{points}} XP', 'ElmonX',
  'ElmonX 101', 'GIF', 'GIPHY', 'NFT', 'X', 'XP', 'xp', 'Polygon', 'Ethereum', 'i', '1 X-Coin = £1.00', 'Multi-Viewer', 'English']);
const SKIP_PROPS = new Set(['key', 'icon', 'code', 'tier', 'type', 'route', 'url', 'href', 'nativeName', 'locale']);

function sourceFiles(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

function literals(node, out) {
  (function visit(n) {
    if (ts.isPropertyAssignment(n) && SKIP_PROPS.has(n.name.getText())) return;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) out.push(n.text);
    ts.forEachChild(n, visit);
  })(node);
}

const keys = new Set(EXTRA_KEYS);
const add = (k) => k && /[A-Za-z]/.test(k) && keys.add(k);

for (const file of sourceFiles(ROOT)) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  (function visit(n) {
    if (ts.isCallExpression(n) && /^(i18n\.)?t$/.test(n.expression.getText()) && n.arguments[0] &&
        (ts.isStringLiteral(n.arguments[0]) || ts.isNoSubstitutionTemplateLiteral(n.arguments[0]))) {
      const key = n.arguments[0].text;
      add(key);
      const opts = n.arguments[1];
      const ctx = opts && ts.isObjectLiteralExpression(opts) && opts.properties.find((p) => p.name && p.name.getText() === 'context');
      if (ctx && ts.isStringLiteral(ctx.initializer)) add(`${key}_${ctx.initializer.text}`);
    }
    const consts = EXTRA_CONSTANTS[rel];
    if (consts && ts.isVariableDeclaration(n) && n.initializer && (consts.includes('*') || consts.includes(n.name.getText()))) {
      const found = [];
      literals(n.initializer, found);
      found.forEach(add);
    }
    const helpers = RETURN_HELPERS[rel];
    if (helpers && ts.isFunctionDeclaration(n) && helpers.includes(n.name && n.name.text)) {
      (function walk(m) {
        if (ts.isReturnStatement(m) && m.expression) {
          const found = [];
          literals(m.expression, found);
          found.filter((s) => /^[A-Z]/.test(s)).forEach(add);
        }
        ts.forEachChild(m, walk);
      })(n);
    }
    ts.forEachChild(n, visit);
  })(sf);
}

const placeholders = (s) => [...new Set(s.match(/\{\{\w+\}\}/g) || [])].sort().join(',');
let failed = false;
for (const file of fs.readdirSync(LOCALES).filter((f) => f.endsWith('.json')).sort()) {
  const code = file.replace(/\.json$/, '');
  const dict = JSON.parse(fs.readFileSync(path.join(LOCALES, file), 'utf8'));
  const missing = [...keys].filter((k) => !(k in dict) && !SAME_IN_ALL.has(k));
  const unused = Object.keys(dict).filter((k) => !keys.has(k));
  const mismatch = [...keys].filter((k) => k in dict && placeholders(k) !== placeholders(dict[k]));
  const ok = missing.length === 0 && mismatch.length === 0;
  if (!ok) failed = true;
  console.log(`${ok ? '✓' : '✗'} ${code}: ${missing.length} missing, ${mismatch.length} placeholder mismatch, ${unused.length} unused`);
  missing.forEach((k) => console.log(`    missing: ${JSON.stringify(k)}`));
  mismatch.forEach((k) => console.log(`    placeholders differ: ${JSON.stringify(k)}`));
  if (process.argv.includes('--unused')) unused.forEach((k) => console.log(`    unused: ${JSON.stringify(k)}`));
}
console.log(`${keys.size} keys in the app`);
process.exit(failed ? 1 : 0);
