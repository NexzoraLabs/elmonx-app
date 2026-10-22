# Website files for app deep links

With these two files on the website, links like `https://elmonx.com/drop/<name>/<id>` open the
ElmonX app (when installed) instead of the browser. Only drop, collection, blind box item,
auction(s) and profile pages open the app. Every other page stays on the website.

## What to deploy

Copy both files from `.well-known/` so they are served at:

- `https://elmonx.com/.well-known/apple-app-site-association` (iOS)
- `https://elmonx.com/.well-known/assetlinks.json` (Android)

Also on `www.elmonx.com` if that domain serves the site.

## Requirements

- HTTPS, HTTP 200, **no redirects**, `Content-Type: application/json`.
  The Apple file has no `.json` extension, so set the content type explicitly.
- They must be public, so no login, cookie wall or Cloudflare bot challenge on these two paths.
- **Angular**: the `public/**/*` asset glob skips dot-folders. Put the files in `public/.well-known/` and
  add an explicit asset entry, for example
  `{ "glob": "**/*", "input": "public/.well-known", "output": ".well-known" }`.
- **SSR server (`src/server.ts`)**: `express.static` ignores dotfiles by default. Serve `/.well-known`
  explicitly (or use `dotfiles: 'allow'`) **before** the Angular SSR catch-all route.

Check after deploy:

```
curl -i https://elmonx.com/.well-known/apple-app-site-association
curl -i https://elmonx.com/.well-known/assetlinks.json
```

## Values to update before the store release

| File | Now (testing build) | Store release |
|---|---|---|
| apple-app-site-association `appIDs` | `SDV2RY2CPC.com.elmonx.app.dev` | add `<TEAM_ID>.com.elmonx.app` |
| assetlinks.json `package_name` | `com.elmonx.app.dev` | add an entry for `com.elmonx.app` |
| assetlinks.json fingerprint | React Native debug key (current APK signing) | the **Play App Signing** SHA-256 from Play Console → App integrity |

Both files take a list, so testing and store entries can live side by side.
