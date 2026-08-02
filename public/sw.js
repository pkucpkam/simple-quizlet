/* ============================================================
   Service Worker for Simple Quizlet – SRS Push Notifications
   ============================================================
   This SW is intentionally minimal: it only handles the
   'push' event (for future server-sent push) and the
   'notificationclick' event (to open /srs-review on click).
   Local notifications are shown directly via the Notification
   API from the page (no push subscription needed).
============================================================ */

const CACHE_NAME = 'simple-quizlet-v1';

self.addEventListener('install', (event) => {
    // Skip waiting so the new SW activates immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Handle push events (future server-sent push)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Simple Quizlet';
    const options = {
        body: data.body || 'Bạn có thẻ cần ôn hôm nay!',
        icon: '/logo/brain.png',
        badge: '/logo/brain.png',
        tag: 'srs-reminder',
        renotify: true,
        data: { url: data.url || '/srs-review' },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// When user clicks the notification, open /srs-review
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url)
        ? event.notification.data.url
        : '/srs-review';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If app window already open, navigate it
            for (const client of clientList) {
                if ('navigate' in client && 'focus' in client) {
                    return client.navigate(targetUrl).then(() => client.focus());
                }
            }
            // Otherwise open a new tab
            return self.clients.openWindow(targetUrl);
        })
    );
});
