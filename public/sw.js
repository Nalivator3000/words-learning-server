// Service Worker for FluentFlow Language Learning App
// Version: 2025.09.26

const CACHE_NAME = 'fluentflow-v1';
const urlsToCache = [
  '/',
  '/style.css',
  '/app.js',
  '/database.js',
  '/user-manager.js',
  '/language-manager.js',
  '/quiz.js',
  '/survival-mode.js'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('💾 Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

console.log('📱 FluentFlow Service Worker loaded');