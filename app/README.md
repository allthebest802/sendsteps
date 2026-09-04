# Helpset combined app — starter

Everything lives under one origin (`helpset.uk/app/`) so it becomes **one PWA
→ one TWA → one Amazon listing**, instead of six thin apps.

```
/app/
  index.html              the shell (loads once, hosts every tool)
  manifest.webmanifest    single manifest for the toolkit
  sw.js                   single service worker (scope /app/)
  shared/
    ui.css                design tokens — swap in your real Helpset hex values
    router.js             hash router + hub screen + tool registry
  tools/
    timer.js              WORKING example of the mount() contract
    _template.js          copy this to add each of your existing tools
  icons/                  replace the placeholders with your real icons
  screenshots/            drop your store/manifest screenshots here
```

## Run it

ES modules must be served over http(s) — **don't** open `index.html` by
double-clicking (the `file://` protocol blocks module loading). Two easy ways:

- **Netlify (fits your workflow):** drag the `app` folder into a Netlify
  deploy so it's live at `yoursite/app/`, then open it on your phone.
- Local, if you ever want it: `npx serve` in this folder, open the URL it prints.

The Visual Timer works out of the box. The other five show "Coming soon" until
you wire them in.

## Adding your five existing tools

1. Copy `tools/_template.js` to e.g. `tools/now-next.js`.
2. Paste your existing tool's markup + logic into `mount(el)`.
3. Scope every element lookup to the tool: `el.querySelector(...)`,
   **not** `document.querySelector(...)` — so tools never collide.
4. Put anything that needs stopping (intervals, window listeners) into
   `unmount()`.
5. In `shared/router.js`, flip that tool's `ready: false` → `true`.

Move your shared plumbing into `shared/` once (78-card library, child lock,
offline TTS) and `import` it from each tool, so all six use one copy.

## Storage note (read before launch)

localStorage / IndexedDB are per-origin, so saved boards, photos and tokens on
the old subdomains **won't** follow users to `/app/`. For now: fresh start + a
short in-app notice. Later (v1.1): an "Export" button on each old subdomain that
downloads JSON, and an "Import" here.

## Keep your SEO pages

Leave the 1,000–1,500-word tool landing pages on the main site as the indexed
marketing pages. Point each one's button at the matching route, e.g.
`/app/#/timer`. Search discovery stays split; the app stays unified.

---

## Refresher: PWABuilder → APK → Amazon

1. **Deploy** the `/app/` folder to Netlify so the manifest is live over HTTPS.
2. **Add real icons** (192, 512, maskable 512) in `icons/` and 2+ portrait
   screenshots in `screenshots/`, then confirm the manifest paths/sizes match
   the real files exactly (wrong `sizes` = PWABuilder keeps flagging them).
3. **PWABuilder:** paste `https://helpset.uk/app/`, let it read the manifest,
   generate the Android package. Set a Helpset package ID — `uk.helpset.toolkit`
   — not the old `uk.sendsteps.app`. **Save the keystore**; the identical one is
   required for every future update.
4. **assetlinks.json:** PWABuilder gives you a Digital Asset Links file. Put it
   at `https://helpset.uk/.well-known/assetlinks.json` (site root, not /app/) so
   the app runs full-screen without a browser bar.
5. **Test on a real Android device** — Amazon requires it. Sideload the APK,
   check it launches, runs offline, child lock works.
6. **Amazon Developer Console:** create the app, fill title/descriptions (reuse
   your SEO copy), upload icon + feature graphic (1024×500) + screenshots,
   complete the IARC content rating, upload the APK, submit.
   Amazon re-signs with its own certificate — that's normal. Review ~1–5 days.

One package ID + one keystore, reused across stores for this app. If you also
list on Samsung/Play later, it's the same APK.
