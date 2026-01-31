/**
 * Army SMP 2 - Service Worker
 * Handles caching, offline support, and push notifications
 */

const CACHE_NAME = 'army-smp-v1';
const STATIC_CACHE = 'army-smp-static-v1';
const DYNAMIC_CACHE = 'army-smp-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/offline.html',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png',
    '/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');

    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => {
                    return key !== STATIC_CACHE && key !== DYNAMIC_CACHE;
                }).map((key) => {
                    console.log('[SW] Removing old cache:', key);
                    return caches.delete(key);
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip API calls - always go to network
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Skip external requests
    if (url.origin !== location.origin) return;

    // For navigation requests (HTML pages)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .catch(() => caches.match('/offline.html'))
        );
        return;
    }

    // For static assets - cache first
    if (isStaticAsset(request.url)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Default - network first with cache fallback
    event.respondWith(networkFirst(request));
});

// Check if request is for static asset
function isStaticAsset(url) {
    return url.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$/);
}

// Cache first strategy
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return new Response('Offline', { status: 503 });
    }
}

// Network first strategy
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;

        // Return offline page for navigation
        if (request.mode === 'navigate') {
            return caches.match('/offline.html');
        }

        return new Response('Offline', { status: 503 });
    }
}

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    let data = {
        title: 'Army SMP 2',
        body: 'You have a new notification!',
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-32x32.png'
    };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/android-chrome-192x192.png',
        badge: data.badge || '/favicon-32x32.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            dateOfArrival: Date.now()
        },
        actions: data.actions || [
            { action: 'open', title: 'Open', icon: '/android-chrome-192x192.png' },
            { action: 'close', title: 'Close' }
        ],
        tag: data.tag || 'army-smp-notification',
        renotify: true
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);

    event.notification.close();

    if (event.action === 'close') return;

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(url);
                        return client.focus();
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

// Background sync event (for offline actions)
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOrders());
    }
});

// Sync pending orders when online
async function syncOrders() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const pendingOrders = await cache.match('pending-orders');

        if (pendingOrders) {
            const orders = await pendingOrders.json();
            for (const order of orders) {
                await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(order)
                });
            }
            await cache.delete('pending-orders');
        }
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

console.log('[SW] Service Worker loaded');
