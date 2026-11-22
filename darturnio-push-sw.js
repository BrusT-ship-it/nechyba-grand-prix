/* Darturnio.com — independent Web Push service worker.
 * Deploy this file at https://darturnio.com/darturnio-push-sw.js
 * Do not upload it as a file inside a Supabase Edge Function.
 */
'use strict';

self.addEventListener('install', event => { event.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let payload = {};
    try { payload = event.data ? event.data.json() : {}; } catch (_) {}
    const title = String(payload.title || 'Darturnio').slice(0, 140);
    const body = String(payload.body || 'Máš nové turnajové oznámení.').slice(0, 500);
    const rawUrl = String(payload.url || '/');
    let url = '/';
    try { const parsed = new URL(rawUrl, self.location.origin); if (parsed.origin === self.location.origin) url = parsed.pathname + parsed.search + parsed.hash; } catch (_) {}
    await self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: String(payload.tag || 'darturnio-notice').slice(0, 150),
      renotify: true,
      data: { url },
      vibrate: [180, 80, 180],
    });
  })());
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const path = String(event.notification.data?.url || '/');
    const url = new URL(path, self.location.origin);
    if (url.origin !== self.location.origin) return;
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === url.origin) {
        try { await client.navigate(url.href); } catch (_) {}
        return client.focus();
      }
    }
    return self.clients.openWindow(url.href);
  })());
});
