// public/service-worker.js
// Verhoog CACHE_VERSION bij elke deploy om caches te verversen.
const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `cashmettrash-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `cashmettrash-dynamic-${CACHE_VERSION}`;

const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/logo.svg'];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch((err) => console.error('[SW] Cachen van statische assets mislukt:', err))
  );
  // Bewust geen skipWaiting: de gebruiker bevestigt de update.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((namen) =>
      Promise.all(
        namen
          .filter((naam) => naam !== STATIC_CACHE && naam !== DYNAMIC_CACHE)
          .map((naam) => caches.delete(naam))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Firebase en de PHP-proxy altijd rechtstreeks van het netwerk.
  if (
    url.hostname.includes('firebaseapp.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('internedata.nl') ||
    url.hostname.includes('stripe.com')
  ) {
    return;
  }

  // Gehashte build-assets altijd van het netwerk — voorkomt MIME-fouten na een deploy.
  if (url.pathname.match(/\.(js|css)$/) && url.pathname.match(/-[a-zA-Z0-9_-]{8}\./)) {
    event.respondWith(fetch(request));
    return;
  }

  // Network-first voor navigatie, met de gecachete shell als terugval.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const kopie = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, kopie));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache-first voor afbeeldingen en fonts.
  event.respondWith(
    caches.match(request).then((gecached) => {
      if (gecached) return gecached;

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        if (url.pathname.match(/\.(png|jpe?g|svg|gif|webp|woff2?|ttf|eot)$/)) {
          const kopie = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, kopie));
        }

        return response;
      });
    })
  );
});
