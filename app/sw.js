/* =========================================================================
   One service worker for the whole Helpset toolkit (scope: /app/).
   Replaces the six separate service workers you had per subdomain.

   Strategy: cache-first with runtime caching. Core shell is precached on
   install; anything else (lazy-loaded tools, card assets) is cached the
   first time it's fetched, so it works offline from then on.

   Updates: a new worker installs in the background and then WAITS. The page
   detects it and shows an "Update" banner; when the user taps it, the page
   posts SKIP_WAITING, the new worker activates, and the page reloads once.

   TO SHIP AN UPDATE: bump CACHE_VERSION. Old caches are cleared on activate.
   ========================================================================= */

const CACHE_VERSION = 'helpset-app-v2';

// The shell that must be available offline immediately.
const CORE = [
  '/app/',
  '/app/index.html',
  '/app/manifest.webmanifest',
  '/app/shared/ui.css',
  '/app/shared/router.js',
  '/app/tools/timer.js',
  '/app/tools/now-next.js',
  '/app/tools/now-next.app.html',
  '/app/tools/brain-battery.js',
  '/app/tools/brain-battery.app.html',
  '/app/tools/choice.js',
  '/app/tools/choice.app.html',
  '/app/tools/comm-cards.js',
  '/app/tools/comm-cards.app.html',
  '/app/tools/token-board.js',
  '/app/tools/token-board.app.html',
  // Self-hosted fonts — precached so first paint is on-brand even offline
  '/app/fonts/fonts.css',
  '/app/fonts/fraunces-latin-700-normal.woff2',
  '/app/fonts/fraunces-latin-800-normal.woff2',
  '/app/fonts/fraunces-latin-900-normal.woff2',
  '/app/fonts/plus-jakarta-sans-latin-400-normal.woff2',
  '/app/fonts/plus-jakarta-sans-latin-600-normal.woff2',
  '/app/fonts/plus-jakarta-sans-latin-700-normal.woff2',
  '/app/fonts/plus-jakarta-sans-latin-800-normal.woff2',
];

self.addEventListener('install', event => {
  // Note: no skipWaiting() here — the new worker waits until the user taps
  // "Update" (which posts SKIP_WAITING below), so we never swap versions
  // out from under someone mid-task.
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(CORE))
  );
});

// The page sends this when the user taps the "Update" banner.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;              // don't cache POSTs etc.

  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;                       // cache-first
      return fetch(req).then(res => {
        // Runtime-cache same-origin successful responses.
        if (res.ok && new URL(req.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit); // offline & not cached -> undefined; fine for now
    })
  );
});
