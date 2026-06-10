const CACHE_NAME = 'my-home-v2';
const FONTS_CACHE = 'my-home-fonts-v2';

const APP_SHELL = [
    '/',
    '/manifest.webmanifest',
    '/favicon.ico',
    '/favicon.svg',
    '/apple-touch-icon.png',
    '/icons/icon-v2-192.png',
    '/icons/icon-v2-512.png',
    '/icons/maskable-v2-192.png',
    '/icons/maskable-v2-512.png',
];

const HASHED_RE = /\/(js|css|images|fonts|assets)\/[^/]+-[a-f0-9]{6,}\.\w+$/;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((key) => key !== CACHE_NAME && key !== FONTS_CACHE).map((key) => caches.delete(key)),
            ))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') {
        return;
    }

    if (url.origin === self.location.origin && url.pathname.startsWith('/admin')) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request));
        return;
    }

    if (url.hostname.endsWith('gstatic.com') || url.hostname === 'fonts.googleapis.com') {
        event.respondWith(cacheFirst(request, FONTS_CACHE));
        return;
    }

    if (url.origin !== self.location.origin) {
        return;
    }

    if (HASHED_RE.test(url.pathname)) {
        event.respondWith(cacheFirst(request, CACHE_NAME));
        return;
    }

    if (['style', 'script', 'image', 'font'].includes(request.destination)) {
        event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
        return;
    }

    event.respondWith(networkFirst(request));
});

function cacheFirst(request, cacheName) {
    return caches.open(cacheName).then((cache) =>
        cache.match(request).then((cached) => {
            if (cached) {
                return cached;
            }

            return fetch(request).then((response) => {
                if (response.ok) {
                    cache.put(request, response.clone());
                }

                return response;
            });
        }),
    );
}

function networkFirst(request) {
    return fetch(request)
        .then((response) => {
            if (response.ok) {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }

            return response;
        })
        .catch(() => caches.match(request).then((cached) => cached ?? caches.match('/')));
}

function staleWhileRevalidate(request, cacheName) {
    return caches.open(cacheName).then((cache) =>
        cache.match(request).then((cached) => {
            const fetching = fetch(request).then((response) => {
                if (response.ok) {
                    cache.put(request, response.clone());
                }

                return response;
            }).catch(() => cached);

            return cached ?? fetching;
        }),
    );
}
