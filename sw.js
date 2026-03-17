// Lamsangstore Scanner — Service Worker v2
// Force new cache to replace old icons/manifest

const CACHE_NAME = 'ls-scanner-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  './apple-touch-icon.png',
  './favicon.ico'
];

// Install: cache new assets
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate: delete ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((name) => name !== CACHE_NAME)
             .map((name) => {
               console.log('[SW] Deleting old cache:', name);
               return caches.delete(name);
             })
      );
    }).then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch: network-first for manifest and icons, cache-first for others
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Always fetch manifest and icons from network (never serve stale)
  if (url.pathname.includes('manifest') || 
      url.pathname.includes('icon-') || 
      url.pathname.includes('apple-touch-icon') ||
      url.pathname.includes('favicon')) {
    event.respondWith(
      fetch(event.request).then((response) => {
        // Update cache with fresh version
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for other assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
