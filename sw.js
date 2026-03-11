// ============================
// 🌱 LE POTAGER MALIN — Service Worker v2
// ============================

const CACHE_NAME = 'potager-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/data.js',
  '/js/app.js',
  '/js/dashboard.js',
  '/js/selection.js',
  '/js/calendar.js',
  '/js/encyclopedia.js',
  '/js/journal.js',
  '/manifest.json',
  '/icons/icon-192.svg',
];

// External resources to cache
const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap',
];

// Install — cache all static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Cache static assets
      await cache.addAll(STATIC_ASSETS);
      // Try to cache external resources (don't fail if offline)
      for (const url of EXTERNAL_ASSETS) {
        try { await cache.add(url); } catch {}
      }
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - API calls: network only (never cache)
// - Static assets: network first, fallback to cache
// - External (fonts, etc): cache first, fallback to network
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Never cache API calls
  if (url.pathname.startsWith('/api/')) return;

  // External resources (fonts, etc): cache first
  if (url.origin !== self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return resp;
        });
      })
    );
    return;
  }

  // Local assets: network first, fallback to cache (for offline)
  e.respondWith(
    fetch(e.request).then(resp => {
      if (resp.ok) {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      }
      return resp;
    }).catch(() => caches.match(e.request).then(cached => {
      // If no cached response for navigation, return cached index
      if (!cached && e.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
      return cached;
    }))
  );
});
