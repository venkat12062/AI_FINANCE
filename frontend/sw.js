const CACHE_NAME = 'finance-manager-v6';

// Install - skip waiting immediately
self.addEventListener('install', event => {
    self.skipWaiting();
});

// Activate - purge all old caches and claim clients immediately
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Clearing legacy cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch handler: Network First, graceful fallback
self.addEventListener('fetch', event => {
    const { request } = event;

    // Only intercept GET requests
    if (request.method !== 'GET') return;

    // Skip chrome extension and non-http(s) requests
    if (!request.url.startsWith('http')) return;

    // Let cross-origin CDN requests bypass SW directly (fonts, CDN scripts, etc.)
    const requestUrl = new URL(request.url);
    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then(response => {
                // If valid response for a static asset, cache it
                if (response && response.status === 200 && !request.url.includes('/api/')) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseClone).catch(() => {});
                    });
                }
                return response;
            })
            .catch(async () => {
                // Try to find in cache
                const cachedResponse = await caches.match(request);
                if (cachedResponse) {
                    return cachedResponse;
                }

                // If requesting an HTML page and offline, serve offline fallback
                if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
                    const offlinePage = await caches.match('/offline.html');
                    if (offlinePage) return offlinePage;
                    return new Response('<h1>Offline</h1><p>You are currently offline.</p>', {
                        headers: { 'Content-Type': 'text/html' }
                    });
                }

                // If API call and offline, return JSON error
                if (request.url.includes('/api/')) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'You are currently offline. Please check your internet connection.'
                    }), {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Default fallback response so event.respondWith never receives undefined
                return new Response('', { status: 404, statusText: 'Not Found' });
            })
    );
});
