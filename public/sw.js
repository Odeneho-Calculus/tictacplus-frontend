// Service Worker for TicTac+ PWA
const CACHE_NAME = 'tictacplus-v1';
const STATIC_CACHE_NAME = 'tictacplus-static-v1';
const DYNAMIC_CACHE_NAME = 'tictacplus-dynamic-v1';

// Check if we're in development mode
const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname.includes('localhost');

// If in development, unregister this service worker immediately
if (isDevelopment) {
    console.log('Development mode detected, unregistering service worker');
    self.registration.unregister().then(() => {
        console.log('Service worker unregistered for development');
        // Force reload to clear any cached resources
        self.clients.matchAll().then(clients => {
            clients.forEach(client => client.navigate(client.url));
        });
    }).catch(err => {
        console.error('Failed to unregister service worker:', err);
    });
}

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    // Add other static assets as needed
];

// Files to cache on first request
const DYNAMIC_FILES = [
    '/api/',
    '/assets/',
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');

    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .catch((error) => {
                console.error('Failed to cache static files:', error);
            })
    );

    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                // Take control of all clients immediately
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    // If in development mode, don't handle any requests
    if (isDevelopment) {
        return;
    }

    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Skip all development-related requests
    if (url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.pathname.includes('node_modules') ||
        url.pathname.includes('.vite') ||
        url.pathname.includes('@vite') ||
        url.pathname.includes('/@fs/') ||
        url.pathname.includes('/@') ||
        url.pathname.includes('.jsx') ||
        url.pathname.includes('.tsx') ||
        url.pathname.includes('.scss') ||
        url.pathname.includes('.css') ||
        url.searchParams.has('direct') ||
        url.searchParams.has('t=') ||
        url.searchParams.has('v=')) {
        return; // Let browser handle these requests
    }

    // Handle different types of requests
    if (url.pathname.startsWith('/api/')) {
        // API requests - network first, cache as fallback
        event.respondWith(networkFirstStrategy(request));
    } else if (url.pathname.startsWith('/assets/') || url.pathname.includes('.')) {
        // Static assets - cache first, network as fallback
        event.respondWith(cacheFirstStrategy(request));
    } else {
        // Navigation requests - network first, cache as fallback
        event.respondWith(networkFirstStrategy(request));
    }
});

// Network first strategy (for API calls and navigation)
async function networkFirstStrategy(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);

        // If successful, cache the response
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache:', error);

        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // If it's a navigation request and no cache, return offline page
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }

        // For other requests, return a generic offline response
        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Cache first strategy (for static assets)
async function cacheFirstStrategy(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Cache miss, try network
        const networkResponse = await fetch(request);

        // If successful, cache the response
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('Both cache and network failed:', error);

        // Return a generic offline response
        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Handle background sync (if supported)
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);

    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // Implement background sync logic here
        console.log('Performing background sync...');

        // Example: sync offline game moves, user data, etc.
        // This would depend on your specific app requirements

    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Handle push notifications (if supported)
self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);

    const options = {
        body: event.data ? event.data.text() : 'New notification from TicTac+',
        icon: '/assets/images/logo-192.png',
        badge: '/assets/images/logo-192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Open Game',
                icon: '/assets/images/logo-192.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/assets/images/logo-192.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('TicTac+', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);

    event.notification.close();

    if (event.action === 'explore') {
        // Open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    console.log('Message received in SW:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker loaded successfully');