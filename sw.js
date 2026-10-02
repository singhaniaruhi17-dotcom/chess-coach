// Chess Coach Service Worker — v1
const CACHE = 'chess-coach-v1';
const STATIC = [
  '/',
  '/index.html',
  '/chess.min.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API calls always go to network (never cache engine results)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // For everything else: cache-first, fall back to network
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
