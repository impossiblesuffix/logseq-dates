const CACHE = 'habit-watcher-v36';

// Only precache local files — external CDN URLs cause addAll() to fail
const PRECACHE = [
  './index.html',
  './manifest.json',
  './icon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never intercept Supabase API — always needs live data
  if (url.hostname.includes('supabase.co')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Cache-first for everything else, cache lazily on first fetch
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          caches.open(CACHE).then(c => c.put(e.request, response.clone()));
        }
        return response;
      });
    })
  );
});
