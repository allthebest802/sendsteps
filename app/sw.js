/* =========================================================================
   One service worker for the whole Helpset toolkit (scope: /app/).
   Replaces the six separate service workers you had per subdomain.

   Strategy: cache-first with runtime caching. Core shell is precached on
   install; anything else (lazy-loaded tools, card assets) is cached the
   first time it's fetched, so it works offline from then on.

   TO SHIP AN UPDATE: bump CACHE_VERSION. Old caches are cleared on activate.
   ========================================================================= */

const CACHE_VERSION = 'helpset-app-v1';

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
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
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
