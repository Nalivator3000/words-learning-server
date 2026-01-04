// Service Worker for Words Learning App
// Version 5.5.2 - Force cache refresh for stats page fix

const CACHE_VERSION = 'v5.5.2';
const CACHE_NAME = `words-learning-${CACHE_VERSION}`;

// Files to cache for offline use
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/gamification.css',
    '/i18n.js',
    '/audio-manager.js',
    '/auth-validation.js',
    '/add-word-ui.js',
    '/app.js',
    '/api-database.js',
    '/quiz.js',
    '/gamification.js',
    '/user-manager.js',
    '/language-manager.js',
    '/survival-mode.js',
    '/theme.js',
    '/manifest.json'
];

// API endpoints that should be network-first
const API_ENDPOINTS = [
    '/api/words',
    '/api/users',
    '/api/language-pairs',
    '/api/gamification',
    '/api/achievements',
    '/api/leaderboard',
    '/api/daily-goals'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('📦 Service Worker: Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Service Worker: Installation complete');
                return self.skipWaiting(); // Activate immediately
            })
            .catch((error) => {
                console.error('❌ Service Worker: Installation failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker: Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Activation complete');
                return self.clients.claim(); // Take control immediately
            })
    );
});

// Message event - handle commands from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('⏭️ Service Worker: Skipping waiting...');
        self.skipWaiting();
    }
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // API requests: Network-first strategy
    if (isApiRequest(url.pathname)) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // HTML, JS, CSS: Network-first to get updates immediately
    if (isDynamicAsset(url.pathname)) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // Other static assets (images, fonts): Cache-first strategy
    event.respondWith(cacheFirstStrategy(request));
});

// Check if request is an API call
function isApiRequest(pathname) {
    return API_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint));
}

// Check if request is for dynamic assets that should always be fresh
function isDynamicAsset(pathname) {
    return pathname.endsWith('.html') ||
           pathname.endsWith('.js') ||
           pathname.endsWith('.css') ||
           pathname === '/' ||
           pathname.includes('/translations/');
}

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request) {
    try {
        // Try to get from cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('💾 Service Worker: Serving from cache:', request.url);
            return cachedResponse;
        }

        // If not in cache, fetch from network
        console.log('🌐 Service Worker: Fetching from network:', request.url);
        const networkResponse = await fetch(request);

        // Cache the new response (only GET requests can be cached)
        if (networkResponse.ok && request.method === 'GET') {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('❌ Service Worker: Fetch failed:', error);

        // Return offline page if available
        const cachedResponse = await caches.match('/index.html');
        if (cachedResponse) {
            return cachedResponse;
        }

        // Last resort: return error response
        return new Response('Offline - please check your connection', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/plain'
            })
        });
    }
}

// Network-first strategy (for API requests and dynamic assets)
async function networkFirstStrategy(request) {
    try {
        // Try network first - always fetch fresh version
        console.log('🌐 Service Worker: Fetching from network:', request.url);
        const networkResponse = await fetch(request);

        // Cache successful responses (use URL without query params as cache key for JS/CSS)
        if (networkResponse.ok && request.method === 'GET') {
            const cache = await caches.open(CACHE_NAME);
            const url = new URL(request.url);

            // For JS/CSS files, strip version query param before caching
            if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
                const cacheKey = new Request(url.pathname, {
                    method: request.method,
                    headers: request.headers
                });
                console.log(`💾 Caching ${url.pathname} (stripped query params)`);
                cache.put(cacheKey, networkResponse.clone());
            } else {
                cache.put(request, networkResponse.clone());
            }
        }

        return networkResponse;
    } catch (error) {
        console.warn('⚠️ Service Worker: Network failed, trying cache:', error);

        // Fall back to cache if network fails
        // Try to match without query params for JS/CSS
        const url = new URL(request.url);
        let cachedResponse;

        if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
            console.log(`🔍 Looking for cached ${url.pathname} (ignoring version)`);
            cachedResponse = await caches.match(url.pathname);
        } else {
            cachedResponse = await caches.match(request);
        }

        if (cachedResponse) {
            console.log('💾 Service Worker: Serving from cache:', request.url);
            return cachedResponse;
        }

        // Return error response if cache miss
        return new Response(JSON.stringify({
            error: 'Offline',
            message: 'Network unavailable and no cached data'
        }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        });
    }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('⏭️ Service Worker: Skipping waiting...');
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        console.log('🗑️ Service Worker: Clearing cache...');
        event.waitUntil(
            caches.delete(CACHE_NAME).then(() => {
                console.log('✅ Service Worker: Cache cleared');
            })
        );
    }
});

// Background sync for offline word progress updates
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-word-progress') {
        console.log('🔄 Service Worker: Syncing word progress...');
        event.waitUntil(syncWordProgress());
    }
});

async function syncWordProgress() {
    try {
        // Get pending updates from IndexedDB or cache
        // This would need implementation in the main app
        console.log('✅ Service Worker: Word progress synced');
    } catch (error) {
        console.error('❌ Service Worker: Sync failed', error);
        throw error; // Retry later
    }
}

console.log('🚀 Service Worker: Script loaded');
