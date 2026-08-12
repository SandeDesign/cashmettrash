// Update version on every deployment to force cache refresh
const CACHE_VERSION = 'v1.3.1.1.1.1.1.1.1.1.1';
const CACHE_NAME = `vlottrgg-${CACHE_VERSION}`;
const STATIC_CACHE = `vlottrgg-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `vlottrgg-dynamic-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Listen for SKIP_WAITING message from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Received SKIP_WAITING, activating new version');
    self.skipWaiting();
  }
});

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing new version...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[Service Worker] Failed to cache static assets:', err);
      });
    })
  );
  // Don't auto-skip waiting - wait for user confirmation
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Firebase requests - always fetch from network
  if (request.url.includes('firebaseapp.com') ||
      request.url.includes('googleapis.com') ||
      request.url.includes('firebasestorage.googleapis.com')) {
    return;
  }

  // CRITICAL FIX: Skip service worker for hashed JS/CSS assets
  // These change on every build and should ALWAYS come from network
  // This prevents MIME type errors when loading new versions
  if (url.pathname.match(/\.(js|css)$/) && url.pathname.match(/-[a-zA-Z0-9]{8}\./)) {
    console.log('[Service Worker] Network-only for hashed asset:', url.pathname);
    event.respondWith(fetch(request));
    return;
  }

  // Network first for HTML and API requests
  if (request.mode === 'navigate' || request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Only fallback to cached HTML for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          throw new Error('Network request failed and no cache available');
        })
    );
    return;
  }

  // Cache first for static assets (images, fonts, etc.)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Only cache images, fonts, and other static assets
        if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)) {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return response;
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }
});

async function syncBookings() {
  // Placeholder for syncing offline bookings when connection is restored
  console.log('[Service Worker] Syncing bookings...');
}

// Push notification support
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  const options = {
    body: event.data ? event.data.text() : 'Nieuwe update beschikbaar',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Bekijken',
      },
      {
        action: 'close',
        title: 'Sluiten',
      },
    ]
  };

  event.waitUntil(
    self.registration.showNotification('VlottrGG', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event.action);

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
