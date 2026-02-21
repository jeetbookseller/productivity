/**
 * Productivity Hub Service Worker
 * Cache name: productivity-hub-v18
 * Strategy: cache-first with runtime population
 *
 * Standalone file — no ES module imports — for browser SW compatibility.
 * Logic mirrors src/lib/sw-utils.js for testability.
 */

const CACHE_NAME = 'productivity-hub-v18';
const SHELL = ['/productivity/', '/productivity/index.html'];

// ── Install: pre-cache the app shell ─────────────────────────────────────────

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

// ── Activate: delete old caches ───────────────────────────────────────────────

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

// ── Fetch: cache-first strategy ───────────────────────────────────────────────

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(cacheFirst(e.request));
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const fallback = await cache.match('/productivity/index.html');
    return fallback || new Response('Offline', { status: 503 });
  }
}
