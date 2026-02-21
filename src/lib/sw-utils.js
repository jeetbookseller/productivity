/**
 * sw-utils.js — Testable service worker utilities
 *
 * Exports CACHE_NAME, registerSW(base), and cacheFirst(request, cacheName).
 * public/sw.js has identical logic but is fully standalone (no ES imports)
 * for browser service worker compatibility.
 */

export const CACHE_NAME = 'productivity-hub-v18';

/**
 * Register the service worker.
 * @param {string} base - App base URL (e.g. '/productivity/')
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerSW(base) {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(`${base}sw.js`, { scope: base });
  } catch (err) {
    console.error('[SW] Registration failed:', err);
    return null;
  }
}

/**
 * Cache-first fetch strategy.
 * Returns cached response if found; otherwise fetches from network,
 * caches a clone of the response, and returns the network response.
 *
 * @param {Request} request
 * @param {string} cacheName
 * @returns {Promise<Response>}
 */
export async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.status === 200) {
    cache.put(request, response.clone());
  }
  return response;
}
