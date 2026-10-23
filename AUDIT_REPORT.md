# ElmonX App — Audit Report + Fix Status

Audit: 2026-10-23 · Fixes: 2026-10-23 · Scope: `elmonx-app` (Expo 57 / RN 0.86), compared with the website `lmnx-st_ng` (`development`) and the backend validators.

Legend: ✅ fixed · ⏳ needs you / another person · ➖ deliberately not done (reason given)

Nothing is committed or pushed. Not yet tested on a phone (see section 8).

---

## 1. Checks after the fixes

| Check | Before | After |
|---|---|---|
| `npx tsc --noEmit` | 0 errors | 0 errors |
| `npx eslint src` | 0 errors, 1 warning | **0 errors, 0 warnings** |
| `npm run i18n:check --unused` | ✓ 6 languages | ✓ 6 languages, 920 keys, 0 missing / 0 unused |
| `npm test` (new) | no tests | **21 tests pass** (5 suites) |
| Metro bundle, iOS + Android (`expo export`) | builds | builds — Android 11.75 MB Hermes (+66 KB for the new screens) |
| Unsigned iOS build (`xcodebuild … CODE_SIGNING_ALLOWED=NO`) | — | ✅ BUILD SUCCEEDED (pods re-installed, Google Sign-In gone) |
| Android `./gradlew assembleRelease` | 277 MB APK (9 Oct), armv7 + arm64 | ✅ BUILD SUCCESSFUL — **234.5 MB**, arm64-v8a only, versionCode 2, no `READ_MEDIA_AUDIO` / `SYSTEM_ALERT_WINDOW` |

---

## 2. Release / APK (P0)

| # | Item | Status |
|---|---|---|
| R-1 | `src/config/env.ts` is still `ACTIVE_ENV = dev` | ⏳ **Your call** — dev (api-dev + ddrops basic-auth) or live for the client APK. Not touched (env toggles are yours). |
| R-2 | Sentry DSN empty → no crash reports from the client's phone | ⏳ Need the DSN from Sentry → Project Settings → Client Keys; paste into `SENTRY_DSN`. |
| R-3 | Android built armv7 + arm64, Unity export is arm64-only → 32-bit phones crash in the viewer | ✅ arm64-only (`gradle.properties` + `abiFilters`). Also ~150 MB smaller APK. |
| R-4 | `versionCode 1` | ✅ now `2` (with a comment). **Bump it for every APK you send.** |
| R-5 | Debug / extra things in release | ✅ `READ_MEDIA_AUDIO` removed, `SYSTEM_ALERT_WINDOW` only in the debug manifest, `allowBackup="false"`. `READ_MEDIA_VIDEO` kept on purpose (Unity's recorder saves videos through NativeGallery). ⏳ `IngameDebugConsole.aar` comes from the Unity export — ask the Unity dev to remove it (removing it ourselves could break their scripts). ⏳ Real upload keystore before the Play Store. |
| — | Google Sign-In native package unused | ✅ removed (npm, `app.json` plugin, pods). runtimeVersion → **1.0.6** in all 3 places. |

Note: `ios/` and `android/` are git-ignored in this repo, so the native edits above exist only on this Mac.

---

## 3. Bugs (P1)

| # | Bug | Status / what changed |
|---|---|---|
| B-1 | Logout kept the wallet connected → next account used the previous person's wallet (bids, AR ownership, Multi-Viewer) | ✅ Sign-out / session-expiry now disconnects AppKit and clears ownership, user-id, unread and query caches (`auth-context.tsx` `clearAccountState`). |
| B-2 | Previous account's chats/unread shown after switching | ✅ Chat state keyed per account (`ChatSession key={user_name}`). |
| B-3 | Paginated lists could show duplicate rows / duplicate keys | ✅ `appendUnique` in all 14 lists; ref guard in `usePaginatedList`, notifications, auctions. |
| B-4 | Auction poll used stale state (overwrote the typed bid, old wallet, viewer not refreshed) | ✅ Poller reads live refs; re-reads on login / wallet change. |
| B-5 | Auction kept polling in background / off-screen / during submit | ✅ `useFocusEffect` + `AppState`, skips while submitting. |
| B-6 | Home banners with `internal` / `external` links did nothing | ✅ Same rules as website `banner.ts` (in-app route when we have the screen, else the website). |
| B-7 | Dead "View All" buttons on Home | ✅ Collectibles → Collections tab; Upcoming has no "View All" (same as website). |
| B-8 | Auction Wins: errors swallowed, Pay stayed enabled after the deadline | ✅ Error + retry, server-synced clock, Pay hides at the deadline. |
| B-9 | Notifications: a failed "load more" wiped the list | ✅ Retry row in the footer; pull-to-refresh added. |
| B-10 | Notification badge fetched 6× and never updated | ✅ One shared store; refreshes on app foreground, counts up live on `notification:new` (website behaviour), clears when Notifications loads. |
| B-11 | Like / follow double-tap races | ✅ In-flight guards; feed likes now optimistic with rollback (website behaviour). |
| B-12 | No login guard on the app area (deep link while logged out → empty screens) | ✅ `Stack.Protected` in the root layout. |
| B-13 | Smaller ones | ✅ chat refresh on every message, stuck "typing…", countdown intervals running forever, DOB accepted `2026-99-99` (Personal Info + UK form), terms link left the app, no request timeouts, HTML error pages shown as "JSON Parse error". |

Extra bugs found while fixing (all ✅):
- Auction gallery pages were a fixed 380 pt wide (misaligned on most phones) and tapping a thumbnail didn't move the image.
- "Terms / Privacy Policy / Cookie Use" on Welcome and Create Account looked like links but did nothing — they open the website pages now.
- Home drop cards ignored blind-box items (would open "No drop found") — all cards use one `openGridItem`.
- Auctions list never refreshed when an auction started/ended (`next_change_at` was stored but unused).
- Auction "Ended / Cancelled" pill and the empty-tab text weren't translated.
- Connections avatars didn't go through `resolveAvatar` (3D `.glb` avatars showed as broken images).
- Feed post with the same image twice → duplicate key.

---

## 4. Website parity (P2)

| # | Website behaviour | Status |
|---|---|---|
| W-1 | Banner internal / external links | ✅ (B-6) |
| W-2 | Home sections | ✅ **ElmonX Partnerships** (auto-scrolling logo strip, same logos) and **Who We Are** card (same copy/artwork) added after Suggested Collectors, in the website's order. Suggested Collectors was already there. Categories skipped — hidden on the website too (your instruction). |
| W-3 | Auction socket room (`auction:extended` push) | ✅ `useChat().watchAuction`, re-joined on reconnect. |
| W-4 | Auction Wins: time left, "Top up your X-coins" hint, reload after failed claim, Etherscan link, tap → auction | ✅ |
| W-5 | UK verification | ✅ Native **UK Verification** screen (`user/uk_verification`, website fields/rules, read-only once saved). Checkout's "UK user verification required" opens it; Account shows the row + the compliance alert for UK users (`user/check_user_uk_status`), like the website. |
| W-6 | Single auction drop opens its auction page | ✅ (your decision: yes) |
| W-7 | Collaborator drops | ✅ App now follows the website button chain (they show Sold Out like the website — your decision). |
| W-8 | Post pages `/post/:id`, `/post/repost/:id` | ✅ New screens with all feed actions; deep links + share links open them. |
| W-9 | Special drop pages (Doodles Mondrian, Honus Wagner, VeVe Schoony) | ✅ Banner links to them open the website page. No native pages (not requested). |

Same on both platforms (not a gap): chat thread and comments load only the first page (50 / 20).

---

## 5. Performance & size (P3)

| # | Item | Status |
|---|---|---|
| P-1 / P-2 | Home and Auction page re-rendered every second | ✅ One shared clock (`useNow`); only the timer text re-renders. Live dot animates on the UI thread. Auctions grid/list too. |
| P-3 | Long lists in `ScrollView + map` | ✅ Rewards history, Leaderboard, Chat list → `FlatList`. |
| P-4 | Full-size images, default cache | ✅ `cachePolicy="memory-disk"` on card / post / avatar / gallery images. ⏳ Real thumbnails need the backend (resize URLs). |
| P-5 | No cross-screen caching (React Query) | ➖ Deferred — moving every screen to React Query is a large refactor; not worth the risk right before client testing. |
| P-6 | Session guard reads every response body twice | ⏳ Backend: send a 401 / header on expiry too. |
| P-7 | Chat presence re-rendered every chat consumer | ✅ Separate `useChatPresence()` context. |
| P-8 | Wallet stack (~2.8 MB JS) loaded at startup | ➖ Deferred — AppKit must exist before its modal/hooks; lazy init needs a device test. |
| P-10 | Unused native package | ✅ Google Sign-In removed. |
| P-11 | Unity is ~95% of app size (APK 277 MB; iOS Unity data 657 MB) | ⏳ Unity dev: Managed Stripping = High, Strip Engine Code, compress textures (ASTC) / move to Addressables, drop Vuforia + IngameDebugConsole, turn off Show Splash Screen. |
| P-12 | Universal APK with two ABIs | ✅ arm64-only. Use an **AAB** for the Play Store. |
| P-13 | R8 / minify off | ➖ Not enabled — needs keep rules for Unity/Firebase/WalletConnect and a device test. |

---

## 6. Code quality (P4)

| # | Item | Status |
|---|---|---|
| Q-1 | 10+ copy-pasted request helpers | ✅ `services/http.ts` (`apiFetch`, `readJson`, `getJson`, `assertSuccess`, `appendUnique`) used by every service. |
| Q-2 | `https://elmonx.com` hardcoded in 10 places | ✅ `SHARE_URL` in `config/env.ts`. |
| Q-3 | Dead code | ✅ Removed 3 mock data files, 8 unused components, Expo template images/tab icons, `reset-project` script. Real types moved to `data/collections.ts`. (`showroom.tsx` kept — hidden on purpose.) |
| Q-4 | Glued translations / "1 followers" | ✅ ~25 spots now one sentence per key (`rich()` helper for styled words); follower plural fixed. All new text translated in 6 languages. |
| Q-5 | Giant screens | ✅ Auction page → `components/auction/*` (1222 → ~970 lines incl. styles); Collectibles → Auction Wins component (704 → 431); Connections → lists component (634 → 91). ➖ Settings and Public Profile left as they are (one screen each, no behaviour gain). |
| Q-6 | Screens not registered in the stack | ✅ chat, post, UK verification registered. |
| Q-7 | `eslint-disable exhaustive-deps` hiding stale closures | ✅ The risky ones (auction polling, paginated list) rewritten. |
| Q-8 | No tests | ✅ jest-expo + 21 unit tests (deep-link mapping, http helpers, birth-date validation, `rich`, drop→card mapping). `npm test`. |
| Q-9 | Android `allowBackup` with SecureStore | ✅ off. |
| Q-10 | Icon-only buttons without labels | ✅ Labels added (back/close/clear/share/password eye/delete comment/tabs, banners, cards, account rows). |

---

## 7. For the backend dev

Already known (still open): `profile_update` trusts `user_id` from the body (**security**: any user can edit any profile), no delete route for shipping addresses, gender "Other" rejected, duplicate username returns HTTP 200.
New:
- Account deletion is a **GET** (`user/soft_delete`) — should be POST/DELETE.
- Session expiry is HTTP 200 + body `status: 440` — also send 401 or a header (P-6).
- `marketplace/user_nfts` should project `unity_assets` (Multi-Viewer makes N extra calls).
- Thumbnails / resize URLs for drop and collection images (P-4).

---

## 8. Before sending the APK — what still needs doing

1. Decide **dev or live** in `src/config/env.ts` (R-1) and add the **Sentry DSN** (R-2).
2. Build the APK: `cd android && JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./gradlew assembleRelease` → `android/app/build/outputs/apk/release/app-release.apk`. A verification build already exists there, but it was built with **ACTIVE_ENV = dev** — rebuild after deciding R-1. `versionCode` is 2 — bump again for every later APK.
   - Extra permissions in the APK come from the Unity export's plugins (Billing, Bluetooth, Biometric, Firebase messaging, Record Audio). Fine for a client APK; review with the Unity dev before the Play Store.
3. Test on a real phone (nothing above was tested on a device). Most important to check, because they changed behaviour:
   - Login → app opens; logout → back to Welcome; a deep link while logged out lands on Welcome.
   - Wallet: connect → logout → login as another account → wallet must be disconnected.
   - Auction page: typed bid survives other bids; timer; anti-snipe extension; leave the page and come back.
   - Home: banners, View All, Who We Are, Partners strip; pull to refresh.
   - UK user: Account alert + UK Verification form; X-Coin checkout "Go to Verification".
   - Shared post link opens the post screen.
   - 3D viewer + video recording on Android (arm64 phone) — save to gallery still works.
4. Unity dev: P-11 items + remove IngameDebugConsole.
