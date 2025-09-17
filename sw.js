// Service Worker for Words Learning App PWA
// Version: 1.0.0

const CACHE_NAME = 'words-learning-v1';
const RUNTIME_CACHE = 'words-learning-runtime-v1';

// Resources to cache immediately
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/quiz.js',
  '/language-manager.js',
  '/user-manager.js',
  '/survival-mode.js',
  '/config.js',
  '/emergency-login.js',
  '/router.js',
  '/test-framework.js',
  '/tests.js',
  '/auto-ui-tester.js',
  '/build-tester.js',
  '/responsive-tester.js',
  '/import-csv-data.js',
  '/external-database.js',
  '/image-fetcher.js',
  '/fetch-images.js',
  '/quick-debug.js',
  '/manifest.json'
];

// API endpoints that can be cached
const API_CACHE_PATTERNS = [
  /\/api\/words$/,
  /\/api\/words\/study$/,
  /\/api\/words\/review$/,
  /\/api\/stats$/,
  /\/api\/users\/me$/
];

// Network first patterns (always try network first)
const NETWORK_FIRST_PATTERNS = [
  /\/api\/auth\//,
  /\/api\/words\/bulk$/,
  /\/api\/words\/.*\/progress$/,
  /\/api\/words\/.*\/status$/
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Core assets cached successfully');
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache core assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old versions of our cache
              return cacheName.startsWith('words-learning-') && 
                     cacheName !== CACHE_NAME && 
                     cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with different strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else {
    event.respondWith(handleAssetRequest(request));
  }
});

// Handle API requests with appropriate caching strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Network first for authentication and write operations
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return networkFirst(request);
  }
  
  // Cache first for read-only data
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return cacheFirst(request, RUNTIME_CACHE);
  }
  
  // Default to network first for unknown API endpoints
  return networkFirst(request);
}

// Handle static asset requests
async function handleAssetRequest(request) {
  // Try cache first for core assets
  if (CORE_ASSETS.some(asset => request.url.endsWith(asset))) {
    return cacheFirst(request, CACHE_NAME);
  }
  
  // For other assets, try cache first with network fallback
  return cacheFirst(request, CACHE_NAME);
}

// Cache first strategy
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      
      // Update cache in background if it's an API request
      if (request.url.includes('/api/')) {
        updateCacheInBackground(request, cache);
      }
      
      return cachedResponse;
    }
    
    // If not in cache, fetch from network and cache
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      console.log('[SW] Cached new response:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    
    // Return offline fallback if available
    return getOfflineFallback(request);
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.url.includes('/api/')) {
      // Cache successful API responses
      const cache = await caches.open(RUNTIME_CACHE);
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      console.log('[SW] Cached network response:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // Fall back to cache
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving stale content from cache:', request.url);
      return cachedResponse;
    }
    
    // Return offline fallback
    return getOfflineFallback(request);
  }
}

// Update cache in background
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      console.log('[SW] Background cache update:', request.url);
    }
  } catch (error) {
    console.log('[SW] Background update failed:', error);
  }
}

// Get offline fallback response
async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // For API requests, return a basic error response
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'No network connection available' 
      }), 
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // For navigation requests, return cached index.html
  if (request.mode === 'navigate') {
    const cache = await caches.open(CACHE_NAME);
    const indexResponse = await cache.match('/index.html');
    if (indexResponse) {
      return indexResponse;
    }
  }
  
  // Return a generic offline response
  return new Response(
    'Offline - No cached version available',
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    }
  );
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'study-progress-sync') {
    event.waitUntil(syncStudyProgress());
  }
  
  if (event.tag === 'word-status-sync') {
    event.waitUntil(syncWordStatus());
  }
});

// Sync study progress when back online
async function syncStudyProgress() {
  try {
    // Get offline progress from IndexedDB
    const offlineProgress = await getOfflineProgress();
    
    if (offlineProgress.length === 0) {
      console.log('[SW] No offline progress to sync');
      return;
    }
    
    console.log('[SW] Syncing offline progress:', offlineProgress.length, 'items');
    
    // Send each progress update to server
    for (const progress of offlineProgress) {
      try {
        const response = await fetch(`/api/words/${progress.wordId}/progress`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': progress.token
          },
          body: JSON.stringify(progress.data)
        });
        
        if (response.ok) {
          await removeOfflineProgress(progress.id);
          console.log('[SW] Synced progress for word:', progress.wordId);
        }
      } catch (error) {
        console.error('[SW] Failed to sync progress for word:', progress.wordId, error);
      }
    }
    
    // Notify the main app about sync completion
    broadcastMessage({
      type: 'SYNC_COMPLETED',
      category: 'study-progress',
      count: offlineProgress.length
    });
    
  } catch (error) {
    console.error('[SW] Study progress sync failed:', error);
  }
}

// Sync word status changes when back online
async function syncWordStatus() {
  try {
    const offlineStatusUpdates = await getOfflineStatusUpdates();
    
    if (offlineStatusUpdates.length === 0) {
      console.log('[SW] No offline status updates to sync');
      return;
    }
    
    console.log('[SW] Syncing offline status updates:', offlineStatusUpdates.length, 'items');
    
    for (const update of offlineStatusUpdates) {
      try {
        const response = await fetch(`/api/words/${update.wordId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': update.token
          },
          body: JSON.stringify({ status: update.status })
        });
        
        if (response.ok) {
          await removeOfflineStatusUpdate(update.id);
          console.log('[SW] Synced status for word:', update.wordId);
        }
      } catch (error) {
        console.error('[SW] Failed to sync status for word:', update.wordId, error);
      }
    }
    
    broadcastMessage({
      type: 'SYNC_COMPLETED',
      category: 'word-status',
      count: offlineStatusUpdates.length
    });
    
  } catch (error) {
    console.error('[SW] Word status sync failed:', error);
  }
}

// Broadcast message to all clients
function broadcastMessage(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
}

// Helper functions for IndexedDB operations (will be implemented in next iteration)
async function getOfflineProgress() {
  // TODO: Implement IndexedDB operations for offline progress
  return [];
}

async function removeOfflineProgress(id) {
  // TODO: Implement IndexedDB removal
}

async function getOfflineStatusUpdates() {
  // TODO: Implement IndexedDB operations for offline status updates
  return [];
}

async function removeOfflineStatusUpdate(id) {
  // TODO: Implement IndexedDB removal
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let notification = {
    title: 'Words Learning',
    body: 'Time for your daily study session!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'study-reminder',
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'study',
        title: 'Start Studying'
      },
      {
        action: 'dismiss',
        title: 'Later'
      }
    ]
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      notification = { ...notification, ...payload };
    } catch (error) {
      console.error('[SW] Invalid push payload:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notification.title, notification)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  if (action === 'study' || !action) {
    // Open the app and navigate to study section
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              action: 'study',
              data: data
            });
            return client.focus();
          }
        }
        
        // If app is not open, open it
        if (clients.openWindow) {
          return clients.openWindow(data.url || '/');
        }
      })
    );
  }
  
  // For 'dismiss' action, just close notification (already handled above)
});

console.log('[SW] Service Worker loaded successfully');