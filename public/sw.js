// Service Worker — GYM PRO v6.0 (rendimiento + frescura del diseño)
// Estrategias:
//   - Fuentes y assets versionados de Vite (con hash ?v=/?t=/?import): cache-first.
//   - Resto de assets same-origin (HTML, CSS, JS de src, JSON): network-first,
//     por lo que Chrome SIEMPRE recibe la última versión del diseño y re-cachea.
//   - Solo interceptamos GET same-origin; lo cross-origin va directo a la red.

const CACHE_VERSION = 'gympro-v7.0-pwa';
const CACHE_RUNTIME = `${CACHE_VERSION}-runtime`;
const CACHE_FUENTES = `${CACHE_VERSION}-fuentes`;

// Shell crítico: lo necesario para que la app arranque offline.
const SHELL_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon.svg',
    './icons/icon-192.svg',
    './icons/icon-192.png',
    './icons/icon-512.svg',
    './icons/icon-512.png',
    './icons/icon-maskable.svg',
    './icons/maskable-192.png',
    './icons/maskable-512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_RUNTIME)
            .then((cache) => cache.addAll(SHELL_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((k) => !k.startsWith(CACHE_VERSION))
                    .map((k) => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

const esFuente = (url) => /\\.(woff2?|ttf|otf|eot)(\\?|$)/.test(url.pathname);

// Vite inyecta ?v=, ?t= o ?import en los assets versionados con hash único.
const esAssetVersionado = (url) =>
    url.search.length > 0 && /(?:v|t|import)=/.test(url.search);

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    let url;
    try { url = new URL(req.url); } catch (_) { return; }
    if (url.origin !== location.origin) return; // cross-origin → red directa

    // 1) Fuentes: cache-first (son inmutables y críticas para el tipado).
    if (esFuente(url)) {
        event.respondWith(cacheFirst(req, CACHE_FUENTES));
        return;
    }

    // 2) Assets versionados de Vite (hasheados): cache-first.
    //    Si el hash cambia, cambia la URL → Vite ya invalida de forma natural.
    if (esAssetVersionado(url)) {
        event.respondWith(cacheFirst(req, CACHE_RUNTIME));
        return;
    }

    // 3) Resto (index.html, styles/index.css, src/*.js, imágenes, JSON):
    //    network-first → el navegador recibe SIEMPRE la versión fresca del
    //    diseño (evita que Chrome muestre un CSS/JS viejo que "rompe" la UI)
    //    y solo usa la caché como respaldo si no hay conexión.
    event.respondWith(networkFirst(req, CACHE_RUNTIME));
});

async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response && response.status === 200 && response.type === 'basic') {
            cache.put(request, response.clone());
        }
        return response;
    } catch (_) {
        return new Response('', { status: 504, statusText: 'Offline' });
    }
}

async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    try {
        const response = await fetch(request);
        if (response && response.status === 200 && response.type === 'basic') {
            cache.put(request, response.clone());
        }
        return response;
    } catch (_) {
        const cached = await cache.match(request);
        if (cached) return cached;
        return new Response('', { status: 504, statusText: 'Offline' });
    }
}