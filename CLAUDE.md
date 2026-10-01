@AGENTS.md

# ElmonX Mobile App: project memory

Read this first in every new chat. It records what has been built, how we work, and what is still open.
Update the "Work log" and "Open items" sections whenever a task is finished.

## What this is

React Native (Expo SDK 57, RN 0.86, React 19, TypeScript, Expo Router, React Compiler enabled) rebuild of
the ElmonX app (digital collectibles, drops, rewards, social). New designs come as Figma screenshots from
the user; functionality and APIs must match the live website.

The user writes in Roman Urdu/English mix. Reply in that same simple style, short and direct.

## Related repos on this machine (read-only references)

| Path | What it is |
|---|---|
| `/Users/yasirsaleem/Workspace/ElmonX/lmnx-st_ng` | Angular website (elmonx.com). **Ground truth for features, API calls, field names.** `src/services/api.ts` has most endpoints. |
| `/Users/yasirsaleem/Workspace/ElmonX/lmnx-st_node` | Node/Express backend. `server/routes/*.routes.js`, `server/controllers/*`, `server/validators/*.schema.json` (AJV, usually `additionalProperties: false`), `server/database/db_orm/schema.js` (Mongoose). **Use validators/schema as ground truth for request fields** — the website sometimes calls endpoints that don't exist or sends fields the backend drops. |
| `/Users/yasirsaleem/Workspace/ElmonX/lmnx-adm_ng` | Admin panel (not used so far). |
| `/Users/yasirsaleem/Workspace/ElmonX-Mobile/ElmonX_Unity` | Existing Unity project (3D/AR viewer). Read-only. |

## Standing rules (do not break)

- **Never push anything to GitHub** (no `git push`, no PRs) unless the user explicitly asks. Don't commit unless asked. Remote is `NexzoraLabs/elmonx-app`.
- **Never touch production identifiers.** iOS testing uses bundle ID `com.elmonx.app.dev`, never `com.elmonx.app`. (Careful: `app.json` android `package` is still `com.elmonx.app` — don't ship/sign Android with it without asking.)
- **Never run `expo prebuild` / `--clean`.** `ios/` is hand-maintained with the Unity integration and would be wiped. For new native deps run `cd ios && pod install`, then rebuild in Xcode.
- **Use the same APIs as the website.** Before building a screen, read the website component + `api.ts`, then confirm fields against the backend validator/controller.
- **No fake functionality.** If the backend doesn't support something the design shows, tell the user and ask (AskUserQuestion) rather than faking it or storing it locally.
- Design screenshots are mockups: they sometimes contain copy-paste errors (wrong labels like "Price" for phone, "Delete Post", placeholder text from other screens, typos like "Cacel"). Fix those silently-obvious ones and mention them.
- Testing is on a **real iPhone via cable** (Unity doesn't build for the simulator — IL2CPP baselib gap). The user builds/installs from Xcode.

## Architecture and conventions

- Routes: `src/app/(auth)/*` (login flow), `src/app/(tabs)/_layout.tsx` is a Stack holding the drawer + home tabs and all pushed screens. Register every new pushed screen there with `animation: 'slide_from_right'`.
- API clients live in `src/services/*-api.ts`, base URL `https://api.elmonx.com/api`, auth via `Authorization: Bearer <token>`.
  - **The backend returns HTTP 200 even for logical failures.** Every client has an `assertSuccess` that checks `success === false` or body `status >= 400`. Keep this pattern.
- Auth: `src/context/auth-context.tsx` — `useAuth()` gives `user`, `token`, `signIn`, `confirmSignInOtp`, `signOut`, `updateUser(partial)` etc. Token/user persisted in `expo-secure-store`.
- Colors only from `src/constants/app-colors.ts` (`AppColors`). Dark UI; no light theme exists.
- Screen template: `SafeAreaView` + header row (36px round back button, centered title, right spacer/action) — copy from an existing screen like `settings.tsx`.
- Reusable bits: `components/ui/bottom-sheet.tsx` (sheet with grabber, used for forms/confirms), `components/auth/auth-button.tsx` (big 56px pill button — not for small inline buttons), `components/account/user-avatar.tsx` (real avatar via `profile_avatar_url || profile_avatar`, placeholder fallback), `components/rewards/reward-pill-button.tsx` (small status pill).
- Lint is strict (React Compiler rules, `npx eslint`): no `Date.now()` during render (use `useState(() => Date.now())`), no `setState` in effects. Fetch-on-mount effects use `// eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount`. To reset a form on open, remount it with a changing `key` instead of an effect.
- Verify every change with: `npx tsc --noEmit`, `npx eslint <files>`, and a Metro bundle check (`npx expo start --port 8099` then `curl "http://localhost:8099/node_modules/expo-router/entry.bundle?platform=ios&dev=true"` → expect HTTP 200). For native changes also `xcodebuild -workspace ios/elmonxapp.xcworkspace -scheme elmonxapp -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO build`.

## Work log (what's done)

### Unity 3D/AR viewer (done, works on device)
- Unity as a Library embedded in iOS. Files: `ios/elmonxapp/UnityBridge.swift` (window-swap pattern — saves host window, never uses `.present()`), `UnityBridgeModule.swift/.m` (RN module via `RCT_EXTERN_MODULE`), `ios/UnityLibrary/`, `ios/add_unity_embed_script.js` (adds "Embed UnityFramework" build phase; Data folder goes inside `UnityFramework.framework/Data`).
- JS: `src/services/unity-bridge.ts` → `presentUnityViewer` with a `NewModelAsset` JSON (`name, type, url, ar, isface, ismultiframe, iswide, isOwned, ...`). "View in 3D" on collection detail opens it; AR needs `ar: true` + camera permission.
- Known Unity-side bugs (Back button, rotate/zoom in 3D mode) are NOT ours — waiting on a fresh export from the Unity developer.

### Auth (done except Google)
- `src/services/auth-api.ts` + `(auth)` screens: email **or username** login → OTP verify, signup, forgot/reset password (`email_address` field per backend schema), logout. Apple button hidden (user request).
- Backend change made by us and deployed by the user: nonce check in `lmnx-st_node/server/controllers/social-auth.controller.js` made optional when absent.

### Navigation / drawer (done)
- Bottom-nav Profile tab → `/profile/:id`; header avatar → `/account`.
- Drawer (`components/menu/menu-drawer-content.tsx`): Explorer/Community/Blogs/News/FAQs/Privacy/Terms open elmonx.com in `expo-web-browser`; footer = avatar + username + email + round logout icon in one row.

### Account area (done) — `src/app/(tabs)/account.tsx`
- Header shows user avatar (→ Personal Info). Bottom has drawer-style user row with logout icon (no "SESSION" heading). Rows route via `ROW_ROUTES` map. Dark Mode moved to Settings.
- **App Rewards** `rewards.tsx`: level/rank card (`user/profile` → `profile/:username/stats`), earned/redeemed/net stats + transactions (`rewards/user-points`, load more).
- **Quests, Earn XP** `challenges.tsx`: website's Actions + Social tabs merged into one scroll (user wanted no tabs). `rewards/tasks?type=actions|social`, claim `rewards/claim?type=<key>&action=actions|social`, spin `POST rewards/spin` (result shown in a banner, no wheel animation). Follow/follower tiers read from the actions payload. Static defs in `src/data/challenges.ts`, `src/data/social-tasks.ts`.
- **Leaderboard** `leaderboard.tsx`: `rewards/leaderboard` (public), top-3 podium + ranked list, load more, no tabs.
- **Shipping Address** `shipping-address.tsx` + `components/address/*`: list `GET user/user_address`, add/edit `POST user/user_address` (edit = same call with `_id`; primary via `primary` flag). **No delete and no Home/Work/Other type** — backend has neither (user chose to omit).
- **Promo Code** `promo-code.tsx`: `POST promo-codes/apply_promo_code` `{ code, wallet_address }` (wallet address typed manually).
- **Personal Information** `personal-info.tsx`: load `GET user/profile`, save `POST user/profile_update`. Gender only Male/Female (backend 422s "Other"). DOB typed `YYYY-MM-DD` (no date picker lib). Updates auth user after save.
- **Settings** `settings.tsx`: Email preference (`GET/POST app-settings/email_preference` — GET returns `email_preferences`, POST takes `email_preference`), Private Profile (`PATCH profile/privacy` Public/Private), Dark Mode (saved locally in `services/preferences.ts`; no light theme yet), Connect Google row (shows "Connected" from `user.linked_accounts.google`, otherwise "available soon"). Apple row hidden.
- **My Collectibles** `collectibles.tsx` (`?tab=app|web`; Vault row → app, Wallet row → web): tabs "App (Vaulted)" = `GET marketplace/user_nfts` (`network_type=Eth, status=Private`, paged); "Web" = connected wallet → `GET elmonx_nft/account` (`wallet_address, network=eth`, cursor `page_key`). Search is client-side (website has none). Cards not tappable, **no Withdraw** (user choice).
- **Doodles Physicals** `doodles-physicals.tsx`: needs connected wallet → `GET doodles/user-transactions?wallet_address=`. One grid, no tabs; badge "Shipped" if courier/tracking exists else "In Production" (backend has no status field).

### Wallet connect — Reown AppKit (done in code, needs device test)
- `src/services/wallet/appkit.ts`: `@reown/appkit-react-native` 2.x + `@reown/appkit-wagmi-react-native`, **wagmi must stay v2** (adapter peer `<3`), viem 2, react-query 5, AsyncStorage-backed `Storage`. Network: **Ethereum mainnet** (website uses Sepolia; user chose mainnet). Project ID = website's `abbdaff37b3fab2c0dc3cd248cb47cf7`; metadata redirect `elmonxapp://`.
- `src/app/_layout.tsx` imports appkit config first, wraps `WagmiProvider > QueryClientProvider > AppKitProvider`, renders `<AppKit />` in an absolute `box-none` overlay.
- Screens use `useAccount()` / `useAppKit()` from `@reown/appkit-react-native`; shared UI in `components/collectibles/wallet-connect-panel.tsx`.
- `LSApplicationQueriesSchemes` (metamask, trust, rainbow, …) added to `ios/elmonxapp/Info.plist` and `app.json`. Pods installed; unsigned iOS build succeeded.

### Profile tab (done) — `src/app/(tabs)/(drawer)/(home-tabs)/profile.tsx`
- Real tab page now (bottom navbar stays visible). The old tab-press intercept that pushed `/profile/:id` was removed; `/profile/[id]` (other users, still mock) remains for leaderboard links.
- Header like website: `user/profile` → `profile/:username/stats` (posts/followers/following) + `profile/:username` (cover_image). Name = `user_name`, "Member since" = `created_at`. Defaults: `images/avatar/default.png` → `https://assets.elmonx.com/default.png`.
- Avatar/cover change via `expo-image-picker` → multipart `POST user/avatar_update` (field `profile_avatar`) / `POST user/cover_image_update` (field `cover_image`). Avatar also updates the auth user.
- Edit Profile → `/personal-info`; Share Profile → `https://elmonx.com/profile/<username>`; settings icon → `/settings`. Design's search icon omitted (no website equivalent).
- Tabs: Posts = `GET post/my-posts`; Reposts = `GET feed/user/:userId/reposts` (website merges both into one list; design has two tabs). Card (`components/profile/profile-post-card.tsx`): like (`post/:id/like` or `post/repost/:id/like`), repost toggle (`post/:id/repost`, no comment modal), share post URL, delete own post/repost (`DELETE post/:id` / `DELETE post/repost/:id`). Comments modal not built yet (count shown only).
- Service: `src/services/profile-api.ts`.

### Feed tab (done) — was "Social"; route file `(home-tabs)/feed.tsx`
- Tabs "For you" = `GET post/list` (OptionalAuth), "Following" = `GET feed/posts`; page size 10, infinite scroll, pull to refresh. Feed rows are flat posts; reposts have `is_repost` + `repost_id` (`_id` = root post) → `feedRowToItem`.
- Shared post UI in `src/components/feed/`: `post-card.tsx` (FeedItem type + converters + card), `post-list.tsx` (FlatList + every action: like, repost toggle, share, delete own, comments, "..." options, author → profile), `comments-sheet.tsx` (`post/:id/comments` or `post/repost/:id/comments`, add/delete own; records `post/:id/view`), `post-options-sheet.tsx` (follow/unfollow/withdraw, block, report reasons), `suggested-users-strip.tsx` (`user/suggested`).
- Used by Feed, my Profile tab and public profile — keep actions in `PostList`, don't duplicate.
- Create post: `(tabs)/create-post.tsx` (modal) — text ≤2000, ≤4 images → `POST post/upload-image` (multipart field `images`) → `POST post/create {content?, images?}`; then `emitFeedChanged()` (`services/feed-events.ts`) refreshes the feed. No Giphy/crop/edit (website has Giphy; edit UI doesn't exist on web).
- User search: `(tabs)/user-search.tsx` → `GET user/search?query=` (debounced).
- Public profile `(tabs)/profile/[id].tsx` — **param is the username** (like website `/profile/:username`): `profile/:username` + `/stats`, follow status `follow/status/:id`, block status; follow button Follow/Request/Following/Requested (`POST follow {user_id}`, `DELETE follow/:id`); private → "This account is private."; blocked → banner; Posts `feed/user/:id/posts`, Reposts `feed/user/:id/reposts`. Own username redirects to the Profile tab.
- My user id comes from `hooks/use-current-user-id.ts` (`user/profile` `_id`, cached per token).
- Avatars: `profile_avatar_url` may be a `.glb` 3D model — always go through `resolveAvatar`/`isImageUrl` (`services/profile-api.ts`) or `UserAvatar`.

### Collections tab → collection / drop detail (done)
- Website uses ONE component for `/collection/:name/:id` and `/drop/:name/:id`. App mirrors it: `components/drop-detail/drop-details-screen.tsx` with `mode`.
  - `(tabs)/collection/[id].tsx` → `GET drop/list_sell?access=open&collection_id=` → every drop stacked; thumbnail strip (if >1) scrolls to a drop. Collections-tab cards open this.
  - `(tabs)/drop/[id].tsx` → `GET drop/list_sell?access=open&drop_id=` → single drop. Collectibles + Partners cards open this.
- Per-drop block `drop-detail-section.tsx` copies website checks: PRIVATE SALE pill (`sale_title==='Private'`; tappable allowlist only for `Layer_2`), likes (`POST drop/:id/like`), comments (`drop/:id/comments` via shared `CommentsSheet` kind `drop`), share `https://elmonx.com/drop/<slugify(title)>/<id>`, country-block disclaimer, View in 3D (app-only, Unity).
- `drop-info-card.tsx`: date label Private/Release (`public_sale_date`), countdown to `release_date` only, price (Layer_2 = X-Coin + raw price; else GBP base × `common/exchange_rate` with fallbacks, GBP/USD/EUR/ETH pills). Button chain in website order: timer → "Sale opens …" + Google Calendar link; closed/sold → Sold Out; Layer_2 → Buy With X-Coins; `customize_drop` → Customize And Buy; else Buy with Card (Public/no sale_title) + Buy with ETH. **Purchasing not built (user request)** — buy buttons show a "coming soon" alert.
- `drop-accordion.tsx` (one open at a time): Description, Editions (+ blind box rows), Details (Drop Edition, Artist → `/artist/[id]`, Collection → `/collection/[id]`, dates, Secondary Fee, License(s), Contract copy via `expo-clipboard`, OpenSea, Drop Information), Physical Print, Allowlist (`marketplace/check_whitelist` with connected wallet, `allowlist-sheet.tsx`), Blind Box, Earn XP.
- `blind-box-items.tsx`: website odds formula, "X left", rarity gradients (regular/secret/legendary/rare), rarity hidden for `SPECIAL_DROP_IDS` (Doodles/Wagner) in `drops-api.ts`. Blind-box item detail page (`/blindbox-item/...` on web) not built.
- Home `featured-carousel` still links mock ids to `/collection/` → shows "No drop found" until Home is made dynamic.

### Collections tab search + filters (done)
- Header: search (toggles a search bar, 300ms debounce) + filters (sliders icon, badge = applied count). The old 3rd icon was removed. Filters hidden on Artists tab (website has none).
- `services/catalog-filters.ts` = website filter-modal mapping: search → `filter` (regex-escaped client-side; backend doesn't escape). Blockchain × "Where it goes" → `type` (intersection; Collectibles falls back to all 3 types), Edition → `drop_edition`, Artist → `brand_id[]`, Category → `category_id`, Date → `date_from`/`date_to` (YYYY-MM-DD), Price → `price_min`/`price_max`. Partners: Artist/Date/Price only. Options from `brands/list` + `categories/list` (`get_all_records=True`).
- Filters are per tab; chips under the tabs remove one filter. Changing search/filters remounts the page (`key`) → reload from page 1. Artists search → `brands/list?filter=`.
- Website sends `individual=True` for Collectibles/Partners (blind boxes split per item); the app does not (lists unchanged).

### Chat (done — website DMs, same REST + socket)
- `src/context/chat-context.tsx` (ChatProvider wraps the `(tabs)` stack): one socket.io connection to `https://api.elmonx.com` (default `/socket.io`), `auth: { token }`, **transports `['polling','websocket']`** (direct websocket handshake fails on production). Reconnect → REST re-sync.
- Socket events: emit `message:send` (ack; REST `POST message/send` fallback), `message:typing {receiver_id,is_typing}`, `message:read {conversation_id}`, `message:delete {message_id}`; listen `message:new`, `message:typing`, `message:read`, `message:deleted`, `presence:bulk`, `presence:update`, `conversation:deleted`. Thread screens get events via `subscribe()`.
- REST (`services/chat-api.ts`): `GET message/conversations`, `GET message/:conversation_id` (newest first → reversed; also marks read), `POST message/upload-media` (field `media`), `DELETE message/conversations/:id` (**plural** — website's singular URL is broken), `GET message/can-message/:user_id`.
- Screens: list `(home-tabs)/chat.tsx` (All/Unread, search → conversations + "People" from `user/search`), new `(tabs)/chat/new.tsx` (search + `user/suggested`), thread `(tabs)/chat/[id].tsx` with params `id` (conversation id or `new`), `userId`, `username`, `avatar`. First message to a new user creates the conversation.
- Thread: text + image (expo-image-picker → upload → send), typing (2s idle), online dot, ✓ / blue ✓✓ + "Seen <time>", unsend own message (long press), copy, View Profile, Block/Unblock (blocked footer), Delete Chat, can-message reasons. Public profile has a **Message** button.
- Not on backend → removed from the mock UI: message requests (Requests tab/footer), forward, reply, report. Giphy GIF picker not built (needs key). Chat tab badge = sum of `unread_count`.

### Bottom tab bar
- Height/padding derived from safe-area bottom inset (`(home-tabs)/_layout.tsx`) so labels clear the rounded corners/home indicator.

### Device build/install without Xcode UI
- Build: `cd ios && xcodebuild -workspace elmonxapp.xcworkspace -scheme elmonxapp -configuration Debug -destination 'id=00008130-000E40920A51001C' -derivedDataPath /tmp/elmonx-dd-device -allowProvisioningUpdates build`
- Install: `xcrun devicectl device install app --device 00008130-000E40920A51001C /tmp/elmonx-dd-device/Build/Products/Debug-iphoneos/elmonxapp.app`
- Needed after every new native package. JS-only changes just need the app reopened (Metro on the Mac serves JS). The `canOpenURL failed` log spam at launch is AppKit probing wallets — harmless.

### Earlier (before this history was written)
- Home, Collections tab (real APIs via `services/collections-api.ts`, `drops-api.ts`, `brands-api.ts`), collection detail, chat UI (mock), social/profile screens (profile screen `profile/[id].tsx` still uses `data/profile-mock.ts`).

## Open items / blocked

- **Google Sign-In + Connect Google**: blocked until the user creates an iOS OAuth client ID in Google Cloud Console for `com.elmonx.app.dev`. Library: `@react-native-google-signin/google-signin` (free tier can't embed a custom nonce — that's why backend nonce was made optional).
- **Reown dashboard**: user must add `com.elmonx.app.dev` under Mobile Application IDs for the project ID above, otherwise wallet connect is rejected. Then rebuild from Xcode and test Collectibles "Web" tab + Doodles.
- **Unity**: waiting for fresh Unity export (Back button + rotate/zoom fix).
- Not built yet: My Wallet (payments), Transactions, Update Password, Delete Account, Notifications, followers/following lists + follow requests + blocked list screens, single post page, Giphy in composer, repost-with-comment, light theme, phone country-code picker, date picker.
- Phone must be on the same Wi-Fi as the Mac (Metro at `172.26.92.104:8081`) and have Local Network permission for the app, otherwise "Could not connect to development server". Metro: `nohup npx expo start --dev-client --port 8081 > /tmp/metro.log 2>&1 &`.
- Account screen stat cards ("Total Rewards Earned", "Wallet Balance") are still hardcoded.

## Backend issues found (tell backend dev, don't work around silently)

- **Security:** `POST user/profile_update` trusts `user_id` from the request body (any user can edit another user's profile) and also accepts `password`, `status`, `kyc_status`. Should use the session user only.
- No delete route for shipping addresses (website's `delete_shipping_address` calls a non-existent `DELETE user/user_address/:id`).
- Gender "Other" offered on website but rejected by backend (only Male/Female).
- Duplicate username/email on profile update returns HTTP 200 with body `status: 400`.
