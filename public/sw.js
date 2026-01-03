// ========================================
// طمأنينة PWA Service Worker
// Version: 5.0 - Comprehensive Offline Support
// ========================================

// Cache versions - INCREMENT THESE FOR UPDATES!
const APP_VERSION = 'v5';
const CACHE_STATIC = `tmanina-static-${APP_VERSION}`;
const CACHE_PAGES = `tmanina-pages-${APP_VERSION}`;
const CACHE_ASSETS = `tmanina-assets-${APP_VERSION}`;
const CACHE_QURAN_DATA = 'tmanina-quran-data-v1';
const CACHE_AUDIO = 'tmanina-audio-v1';

// All caches we manage
const ALL_CACHES = [CACHE_STATIC, CACHE_PAGES, CACHE_ASSETS, CACHE_QURAN_DATA, CACHE_AUDIO];

// Static files to cache on install (App Shell)
const STATIC_FILES = [
    '/',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png'
];

// Pages that work offline
const OFFLINE_PAGES = [
    '/',
    '/?view=tasbih',
    '/?view=dhikr',
    '/?view=times',
    '/?view=calendar',
    '/?view=share',
    '/?view=activity',
    '/?view=install',
    '/?view=about',
    '/?view=notifications'
];

// Quran API patterns
const QURAN_API_PATTERNS = [
    'https://api.quran.com/api/v4/quran/verses/uthmani',
    'https://api.quran.com/api/v4/verses/by_page/',
    'https://api.alquran.cloud/v1/page/'
];

// Audio streaming patterns (require network)
const AUDIO_PATTERNS = [
    '.mp3',
    'stream.zeno.fm',
    'backup.qurango.net',
    'list.qurango.net',
    'mp3quran.net',
    'podcasts.mp3quran.net'
];

// ========================================
// INSTALL EVENT - Cache static resources
// ========================================
self.addEventListener('install', (event) => {
    console.log(`[SW ${APP_VERSION}] Installing...`);

    event.waitUntil(
        Promise.all([
            // Cache static files
            caches.open(CACHE_STATIC).then(cache => {
                console.log(`[SW ${APP_VERSION}] Caching static files`);
                return cache.addAll(STATIC_FILES);
            }),
            // Cache offline pages
            caches.open(CACHE_PAGES).then(cache => {
                console.log(`[SW ${APP_VERSION}] Caching offline pages`);
                return cache.addAll(OFFLINE_PAGES);
            })
        ])
    );

    // Skip waiting - activate immediately
    self.skipWaiting();
});

// ========================================
// ACTIVATE EVENT - Clean old caches
// ========================================
self.addEventListener('activate', (event) => {
    console.log(`[SW ${APP_VERSION}] Activating...`);

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Delete old version caches
                    if (!ALL_CACHES.includes(cacheName)) {
                        console.log(`[SW ${APP_VERSION}] Deleting old cache:`, cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log(`[SW ${APP_VERSION}] Taking control of clients`);
            return self.clients.claim();
        }).then(() => {
            // Notify all clients about the update
            return self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'SW_UPDATED',
                        version: APP_VERSION
                    });
                });
            });
        })
    );
});

// ========================================
// HELPER FUNCTIONS
// ========================================

function isQuranApiRequest(url) {
    return QURAN_API_PATTERNS.some(pattern => url.includes(pattern));
}

function isAudioRequest(url) {
    return AUDIO_PATTERNS.some(pattern => url.includes(pattern));
}

function isNavigationRequest(request) {
    return request.mode === 'navigate' ||
        (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

function isAssetRequest(url) {
    return url.includes('/_next/') ||
        url.endsWith('.js') ||
        url.endsWith('.css') ||
        url.endsWith('.woff2') ||
        url.endsWith('.woff') ||
        url.endsWith('.ttf') ||
        url.endsWith('.png') ||
        url.endsWith('.jpg') ||
        url.endsWith('.svg') ||
        url.endsWith('.ico');
}

// Create offline response for audio
function createOfflineAudioResponse() {
    return new Response(
        JSON.stringify({
            error: true,
            message: 'يرجى الاتصال بالإنترنت لتشغيل الصوت',
            offline: true
        }),
        {
            status: 503,
            statusText: 'Offline',
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

// Create offline page response
function createOfflinePageResponse() {
    return new Response(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>غير متصل - طمأنينة</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Tahoma, sans-serif;
                    background: linear-gradient(135deg, #2b5a4b 0%, #1a3830 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    text-align: center;
                    padding: 2rem;
                }
                .container {
                    max-width: 400px;
                }
                .icon {
                    font-size: 4rem;
                    margin-bottom: 1.5rem;
                    opacity: 0.8;
                }
                h1 {
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                }
                p {
                    opacity: 0.8;
                    margin-bottom: 2rem;
                    line-height: 1.6;
                }
                button {
                    background: white;
                    color: #2b5a4b;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 50px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon">📡</div>
                <h1>غير متصل بالإنترنت</h1>
                <p>يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.</p>
                <button onclick="location.reload()">إعادة المحاولة</button>
            </div>
        </body>
        </html>
    `, {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// ========================================
// FETCH EVENT - Routing strategies
// ========================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = request.url;

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http
    if (!url.startsWith('http')) {
        return;
    }

    // ========================================
    // AUDIO: Network Only with offline message
    // ========================================
    if (isAudioRequest(url)) {
        event.respondWith(
            fetch(request).catch(() => createOfflineAudioResponse())
        );
        return;
    }

    // ========================================
    // QURAN API: Stale-While-Revalidate
    // ========================================
    if (isQuranApiRequest(url)) {
        event.respondWith(
            caches.open(CACHE_QURAN_DATA).then(cache => {
                return cache.match(request).then(cachedResponse => {
                    const fetchPromise = fetch(request)
                        .then(networkResponse => {
                            if (networkResponse && networkResponse.ok) {
                                cache.put(request, networkResponse.clone());
                            }
                            return networkResponse;
                        })
                        .catch(() => cachedResponse);

                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // ========================================
    // NAVIGATION (HTML): Network First
    // ========================================
    if (isNavigationRequest(request)) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache the page for offline
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_PAGES).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Try cache, then offline page
                    return caches.match(request)
                        .then(cachedResponse => cachedResponse || createOfflinePageResponse());
                })
        );
        return;
    }

    // ========================================
    // ASSETS (JS/CSS/Images): Stale-While-Revalidate
    // ========================================
    if (isAssetRequest(url)) {
        event.respondWith(
            caches.open(CACHE_ASSETS).then(cache => {
                return cache.match(request).then(cachedResponse => {
                    const fetchPromise = fetch(request)
                        .then(networkResponse => {
                            if (networkResponse && networkResponse.ok) {
                                cache.put(request, networkResponse.clone());
                            }
                            return networkResponse;
                        })
                        .catch(() => cachedResponse);

                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // ========================================
    // FALLBACK: Stale-While-Revalidate
    // ========================================
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            const fetchPromise = fetch(request)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.ok) {
                        caches.open(CACHE_STATIC).then(cache => {
                            cache.put(request, networkResponse.clone());
                        });
                    }
                    return networkResponse;
                })
                .catch(() => cachedResponse);

            return cachedResponse || fetchPromise;
        })
    );
});

// ========================================
// MESSAGE EVENT - Handle client messages
// ========================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: APP_VERSION });
    }

    // Pre-cache all Quran pages for offline reading
    if (event.data && event.data.type === 'PRECACHE_QURAN') {
        precacheAllQuranPages(event.source);
    }

    // Check Quran cache status
    if (event.data && event.data.type === 'CHECK_QURAN_CACHE') {
        checkQuranCacheStatus().then(status => {
            event.source.postMessage({
                type: 'QURAN_CACHE_STATUS',
                ...status
            });
        });
    }
});

// ========================================
// QURAN PRE-CACHING - Download all 604 pages
// ========================================
const TOTAL_QURAN_PAGES = 604;
const BATCH_SIZE = 10; // Download 10 pages at a time to avoid overwhelming

async function precacheAllQuranPages(client) {
    const cache = await caches.open(CACHE_QURAN_DATA);
    let cachedCount = 0;
    let failedCount = 0;

    console.log(`[SW] Starting Quran pre-cache: ${TOTAL_QURAN_PAGES} pages`);

    // Notify client about start
    if (client) {
        client.postMessage({
            type: 'QURAN_PRECACHE_PROGRESS',
            current: 0,
            total: TOTAL_QURAN_PAGES,
            status: 'starting'
        });
    }

    // Check which pages are already cached
    const cachedPages = new Set();
    for (let page = 1; page <= TOTAL_QURAN_PAGES; page++) {
        const url = `https://api.quran.com/api/v4/verses/by_page/${page}?words=true&word_fields=text_uthmani,text_imlaei&per_page=50`;
        const cached = await cache.match(url);
        if (cached) {
            cachedPages.add(page);
        }
    }

    cachedCount = cachedPages.size;
    console.log(`[SW] Already cached: ${cachedCount} pages`);

    if (cachedCount === TOTAL_QURAN_PAGES) {
        if (client) {
            client.postMessage({
                type: 'QURAN_PRECACHE_PROGRESS',
                current: TOTAL_QURAN_PAGES,
                total: TOTAL_QURAN_PAGES,
                status: 'complete',
                message: 'القرآن الكريم محفوظ بالكامل!'
            });
        }
        return;
    }

    // Download missing pages in batches
    const pagesToDownload = [];
    for (let page = 1; page <= TOTAL_QURAN_PAGES; page++) {
        if (!cachedPages.has(page)) {
            pagesToDownload.push(page);
        }
    }

    for (let i = 0; i < pagesToDownload.length; i += BATCH_SIZE) {
        const batch = pagesToDownload.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (page) => {
            const url = `https://api.quran.com/api/v4/verses/by_page/${page}?words=true&word_fields=text_uthmani,text_imlaei&per_page=50`;
            try {
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response.clone());
                    cachedCount++;
                } else {
                    failedCount++;
                }
            } catch (error) {
                console.error(`[SW] Failed to cache page ${page}:`, error);
                failedCount++;
            }
        }));

        // Notify progress
        if (client) {
            client.postMessage({
                type: 'QURAN_PRECACHE_PROGRESS',
                current: cachedCount,
                total: TOTAL_QURAN_PAGES,
                failed: failedCount,
                status: 'downloading',
                message: `جاري التحميل... ${cachedCount}/${TOTAL_QURAN_PAGES}`
            });
        }

        // Small delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[SW] Quran pre-cache complete: ${cachedCount} cached, ${failedCount} failed`);

    // Final notification
    if (client) {
        client.postMessage({
            type: 'QURAN_PRECACHE_PROGRESS',
            current: cachedCount,
            total: TOTAL_QURAN_PAGES,
            failed: failedCount,
            status: 'complete',
            message: failedCount > 0
                ? `تم تحميل ${cachedCount} صفحة (${failedCount} فشل)`
                : 'القرآن الكريم محفوظ بالكامل!'
        });
    }
}

async function checkQuranCacheStatus() {
    const cache = await caches.open(CACHE_QURAN_DATA);
    let cachedCount = 0;

    for (let page = 1; page <= TOTAL_QURAN_PAGES; page++) {
        const url = `https://api.quran.com/api/v4/verses/by_page/${page}?words=true&word_fields=text_uthmani,text_imlaei&per_page=50`;
        const cached = await cache.match(url);
        if (cached) {
            cachedCount++;
        }
    }

    return {
        cached: cachedCount,
        total: TOTAL_QURAN_PAGES,
        complete: cachedCount === TOTAL_QURAN_PAGES,
        percentage: Math.round((cachedCount / TOTAL_QURAN_PAGES) * 100)
    };
}

console.log(`[SW ${APP_VERSION}] Loaded`);
