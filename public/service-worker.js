// public/service-worker.js
// Verhoog CACHE_VERSION bij elke deploy om caches te verversen.
const CACHE_VERSION = 'v1.6.0';
const STATIC_CACHE = `cashmettrash-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `cashmettrash-dynamic-${CACHE_VERSION}`;

const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/logo.svg?v=2'];

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
    url.hostname.includes('stripe.com') ||
    // Kaarttegels en routes niet bewaren: dat zijn er te veel en ze horen niet
    // in de offline-cache van de app thuis.
    url.hostname.includes('openstreetmap.org') ||
    url.hostname.includes('openrouteservice.org')
  ) {
    return;
  }

  // Gehashte build-assets altijd van het netwerk, dat voorkomt MIME-fouten na een deploy.
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

// ---------------------------------------------------------------------------
// Pushmeldingen. Firebase Cloud Messaging levert de melding hier af, ook als de
// app dicht is. We tonen hem zelf, zodat we de tekst en het icoon bepalen.
// ---------------------------------------------------------------------------

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let lading = {};
  try {
    lading = event.data.json();
  } catch {
    lading = { notification: { title: 'CashMetTrash', body: event.data.text() } };
  }

  const inhoud = lading.notification || lading.data || {};
  const titel = inhoud.title || 'CashMetTrash';

  event.waitUntil(
    self.registration.showNotification(titel, {
      body: inhoud.body || '',
      icon: '/icon-192.png?v=2',
      badge: '/icon-192.png?v=2',
      tag: inhoud.tag || 'cashmettrash',
      // Nieuwe melding vervangt de vorige met dezelfde tag, maar laat wel
      // opnieuw van zich horen.
      renotify: true,
      data: { url: (lading.data && lading.data.url) || inhoud.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const doel = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((vensters) => {
      // Staat de app al open? Dan die gebruiken in plaats van een nieuw tabblad.
      for (const venster of vensters) {
        if ('focus' in venster) {
          venster.navigate?.(doel);
          return venster.focus();
        }
      }
      return self.clients.openWindow(doel);
    })
  );
});
