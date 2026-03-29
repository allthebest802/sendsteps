// ============================================================
// SendSteps Service Worker — v1.0
// Handles offline caching so the app works without internet
// ============================================================

const CACHE_VERSION = 'sendsteps-v1';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// ── Files to cache immediately on install ──
// These are the core pages and assets needed for basic offline use
const STATIC_ASSETS = [
  '/',
  '/routine/',
  '/printable-routines/',
  '/visual-timetable/',
  '/visual-timer/',
  '/comm-cards/',
  '/now-next-board/',
  '/socialstory/',
  '/feelings/',
  '/battery/',
  '/worry-box/',
  '/tracker/',
  '/decompression/',
  '/task-helper-netlify/',
  '/homework/',
  '/word-decoder/',
  '/dyslexia/',
  '/reading-ruler/',
  '/story-writer/',
  '/sensory/',
  '/safefood/',
  '/med-tracker/',
  '/sleep-logger/',
  '/brain-dump/',
  '/body-doubling-timer/',
  '/token-board/',
  '/privacy/',
  '/manifest.json',
];

// ── Fonts to cache so the app looks right offline ──
const FONT_URLS = [
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@400;600;700;800&display=swap',
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,800;0,900;1,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=Lora:ital,wght@0,400;0,600;1,400;1,500&display=swap',
];

// ── Install: cache all static assets ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('[SW] Caching static assets');
      // Cache each asset individually so one failure doesn't break the whole install
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(err =>
            console.warn(`[SW] Failed to cache ${url}:`, err)
          )
        )
      );
    }).then(() => {
      // Also pre-cache fonts
      return caches.open(DYNAMIC_CACHE).then(cache => {
        return Promise.allSettled(
          FONT_URLS.map(url =>
            fetch(url, { mode: 'cors' })
              .then(res => cache.put(url, res))
              .catch(err => console.warn(`[SW] Failed to cache font ${url}:`, err))
          )
        );
      });
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key.startsWith('sendsteps-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch: serve from cache, fall back to network ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // ── ARASAAC pictogram API — network only (always needs live data) ──
  if (url.hostname === 'api.arasaac.org') {
    event.respondWith(
      fetch(request).catch(() => new Response(
        JSON.stringify([]),
        { headers: { 'Content-Type': 'application/json' } }
      ))
    );
    return;
  }

  // ── ARASAAC static images — cache then network ──
  if (url.hostname === 'static.arasaac.org') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  // ── Google Fonts — cache first ──
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached || new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  // ── SendSteps pages and assets — cache first, network fallback ──
  if (url.hostname === 'sendsteps.uk' || url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    event.respondWith(
      caches.match(request).then(cached => {
        // Return cached version immediately
        if (cached) {
          // Refresh cache in background (stale-while-revalidate)
          fetch(request).then(response => {
            if (response.ok) {
              caches.open(STATIC_CACHE).then(cache => cache.put(request, response));
            }
          }).catch(() => {});
          return cached;
        }

        // Not cached — fetch from network and cache it
        return fetch(request).then(response => {
          if (!response.ok) return response;
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseClone));
          return response;
        }).catch(() => {
          // Full offline fallback — return homepage if we have it
          return caches.match('/').then(fallback =>
            fallback || new Response(
              '<h1>You are offline</h1><p>Please reconnect to use SendSteps.</p>',
              { headers: { 'Content-Type': 'text/html' } }
            )
          );
        });
      })
    );
    return;
  }

  // ── Everything else — network with cache fallback ──
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ── Message handler — allows pages to trigger cache refresh ──
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    );
  }
});
