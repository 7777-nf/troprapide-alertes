// TropRapide Service Worker - Notifications Push
const CACHE_NAME = 'troprapide-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// Réception notification push
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || '🛵 TropRapide';
  const options = {
    body: data.body || 'Nouvelle commande !',
    icon: data.icon || 'https://www.troprapide.com/images/logo/yellow/eccursson.svg',
    badge: 'https://www.troprapide.com/images/logo/yellow/eccursson.svg',
    vibrate: [200, 100, 200, 100, 200],
    data: { url: data.url || '/', orderId: data.orderId },
    actions: [
      { action: 'open', title: '✅ Voir la commande' },
      { action: 'dismiss', title: '✕ Ignorer' }
    ],
    requireInteraction: true,
    tag: data.orderId || 'troprapide-notif'
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Clic sur notification
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = e.notification.data.url;
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes('troprapide') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Background sync - vérifie Firebase toutes les 30s quand page fermée
self.addEventListener('periodicsync', e => {
  if (e.tag === 'check-orders') {
    e.waitUntil(checkNewOrders());
  }
});

async function checkNewOrders() {
  // Handled by Firebase push notifications
}
