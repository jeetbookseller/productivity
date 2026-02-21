/**
 * T8 — PWA / Service Worker tests (5 tests: T8-1 to T8-5)
 * Tests src/lib/sw-utils.js exports.
 * public/sw.js has identical logic but is standalone (no ES imports)
 * for browser SW compatibility.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── T8-1: CACHE_NAME constant ─────────────────────────────────────────────────

describe('T8 — CACHE_NAME', () => {
  it('T8-1: CACHE_NAME is the correct versioned string', async () => {
    const { CACHE_NAME } = await import('./lib/sw-utils.js');
    expect(CACHE_NAME).toBe('productivity-hub-v18');
  });
});

// ── T8-2: manifest.json fields ────────────────────────────────────────────────

describe('T8 — manifest.json', () => {
  it('T8-2: manifest fields are valid (name, icons, display, theme_color)', () => {
    const raw = readFileSync(resolve(process.cwd(), 'public/manifest.json'), 'utf-8');
    const m = JSON.parse(raw);
    expect(typeof m.name).toBe('string');
    expect(m.name.length).toBeGreaterThan(0);
    expect(Array.isArray(m.icons)).toBe(true);
    expect(m.icons.length).toBeGreaterThanOrEqual(2);
    expect(m.icons.every((i) => i.src && i.sizes && i.type)).toBe(true);
    expect(m.display).toBe('standalone');
    expect(typeof m.theme_color).toBe('string');
    expect(m.theme_color).toBe('#7CB69D');
  });
});

// ── T8-3: registerSW — registers SW at correct path ──────────────────────────

describe('T8 — registerSW (supported)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('navigator', {
      serviceWorker: {
        register: vi.fn().mockResolvedValue({ scope: '/productivity/' }),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('T8-3: registerSW calls navigator.serviceWorker.register with sw.js path', async () => {
    const { registerSW } = await import('./lib/sw-utils.js');
    await registerSW('/productivity/');
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith(
      '/productivity/sw.js',
      { scope: '/productivity/' }
    );
  });
});

// ── T8-4: registerSW — graceful no-op when SW unavailable ────────────────────

describe('T8 — registerSW (unsupported)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('navigator', {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('T8-4: registerSW returns null without throwing when serviceWorker is absent', async () => {
    const { registerSW } = await import('./lib/sw-utils.js');
    const result = await registerSW('/productivity/');
    expect(result).toBeNull();
  });
});

// ── T8-5: cacheFirst — returns cached response when available ─────────────────

describe('T8 — cacheFirst (offline)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('T8-5: cacheFirst returns cached response without hitting network', async () => {
    vi.resetModules();
    const { cacheFirst, CACHE_NAME } = await import('./lib/sw-utils.js');

    const mockResponse = new Response('cached content', { status: 200 });
    const mockCache = {
      match: vi.fn().mockResolvedValue(mockResponse),
      put: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal('caches', {
      open: vi.fn().mockResolvedValue(mockCache),
    });
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const result = await cacheFirst(new Request('https://example.com/app.js'), CACHE_NAME);

    expect(mockCache.match).toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result).toBe(mockResponse);
  });
});
