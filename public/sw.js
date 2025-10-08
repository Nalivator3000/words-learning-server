// Service Worker - NO CACHING VERSION
// Version: 2025.10.08

// Install event - skip caching
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing (NO CACHE MODE)');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - delete ALL caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated - CLEARING ALL CACHES');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - ALWAYS fetch from network, NO CACHE
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request, {
      cache: 'no-store' // Force fresh fetch, bypass cache
    })
  );
});

console.log('📱 Service Worker loaded - NO CACHING MODE');
