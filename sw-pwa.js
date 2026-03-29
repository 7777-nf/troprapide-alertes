// TropRapide PWA Service Worker v1.0
const CACHE_NAME = 'troprapide-pwa-v1';
const STATIC_ASSETS = [
  '/app/',
  '/app/index.html',
  '/app/manifest.json',
  'https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js'
];

// Install — cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS.filter(url => !url.includes('googleapis') && !url.includes('gstatic')));
    }).catch(() => {})
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  clients.claim();
});

// Fetch — cache first for static, network first for API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Firebase — always network
  if (url.hostname.includes('firebase') || url.hostname.includes('firebaseio')) {
    return;
  }

  // Static assets — cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback
        if (e.request.destination === 'document') {
          return caches.match('/app/index.html');
        }
      });
    })
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || '🛵 TropRapide', {
      body: data.body || 'Nouvelle activité sur votre commande',
      icon: '/app/icons/icon-192.png',
      badge: '/app/icons/icon-72.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/app/' },
      actions: [
        { action: 'open', title: '👁 Voir' },
        { action: 'close', title: '✕' }
      ],
      requireInteraction: true,
      tag: 'troprapide-' + (data.orderId || Date.now())
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;
  const url = e.notification.data.url || '/app/';
  e.waitUntil(
    clients.matchAll({type:'window'}).then(wins => {
      const win = wins.find(w => w.url.includes('troprapide'));
      if (win) return win.focus();
      return clients.openWindow(url);
    })
  );
});
