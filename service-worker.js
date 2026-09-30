// ============================================================
// Helpset Service Worker — v3
// Offline support for the PWA, WITHOUT serving stale pages.
// Pages = network-first (always latest online, cache offline).
// Assets/fonts = cache-first / stale-while-revalidate.
// ============================================================

// Bumped version → old caches are cleared on activate, so existing
// visitors self-heal on their next visit. Bump this on any deploy
// where you want to force a clean cache.
const CACHE_VERSION = 'helpset-v3';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// ── Files to pre-cache on install (used as the OFFLINE fallback) ──
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
  'https://cdn.jsdelivr.net/npm/opendyslexic@0.91.12/fonts/OpenDyslexic-Regular.otf',
  'https://cdn.jsdelivr.net/npm/opendyslexic@0.91.12/fonts/OpenDyslexic-Bold.otf',
];

// ── Install: pre-cache static assets + fonts ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('[SW] Caching static assets');
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn(`[SW] Failed to cache ${url}:`, err))
        )
      );
    }).then(() => caches.open(DYNAMIC_CACHE).then(cache =>
      Promise.allSettled(
        FONT_URLS.map(url =>
          fetch(url, { mode: 'cors' })
            .then(res => cache.put(url, res))
            .catch(err => console.warn(`[SW] Failed to cache font ${url}:`, err))
        )
      )
    )).then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches (self-heals stale pages on version bump) ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('helpset-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => { console.log('[SW] Deleting old cache:', key); return caches.delete(key); })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // ── ARASAAC pictogram API — network only ──
  if (url.hostname === 'api.arasaac.org') {
    event.respondWith(
      fetch(request).catch(() => new Response('[]', { headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }

  // ── ARASAAC static images — cache then network ──
  if (url.hostname === 'static.arasaac.org') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache =>
        cache.match(request).then(cached =>
          cached || fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached)
        )
      )
    );
    return;
  }

  // ── Google Fonts and jsDelivr CDN — cache first (versioned URLs, safe) ──
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
      || url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache =>
        cache.match(request).then(cached =>
          cached || fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached || new Response('', { status: 503 }))
        )
      )
    );
    return;
  }

  // ── Helpset (same-origin) ──
  if (url.hostname === 'helpset.uk' || url.hostname === 'localhost' || url.hostname === '127.0.0.1') {

    // PAGE NAVIGATIONS → NETWORK-FIRST (always the latest page online; cache is offline fallback)
    if (request.mode === 'navigate') {
      event.respondWith(
        fetch(request).then(response => {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(request, copy)); // keep offline copy fresh
          return response;
        }).catch(() =>
          caches.match(request).then(cached =>
            cached || caches.match('/').then(home =>
              home || new Response(
                '<h1>You are offline</h1><p>Please reconnect to use Helpset.</p>',
                { headers: { 'Content-Type': 'text/html' } }
              )
            )
          )
        )
      );
      return;
    }

    // OTHER same-origin assets (images, manifest, etc.) → stale-while-revalidate
    event.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request).then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, copy));
          }
          return response;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // ── Everything else — network with cache fallback ──
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// ── Message handler ──
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))));
  }
});
