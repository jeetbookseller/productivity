/**
 * T0 — Storage contract tests (11 tests)
 * Also covers uid(), dlFile(), shareItem() from utils.js
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { S } from './storage.js';
import { uid, dlFile, shareItem } from './utils.js';

// ── IndexedDB mock via fake-indexeddb (provided by jsdom environment) ──────────
// jsdom includes a basic indexedDB stub. We reset the DB handle before each test
// so each test gets a clean store.

beforeEach(async () => {
  // Reset in-memory DB reference so openDB() re-opens a fresh connection
  S._resetDB();
  // Clear any lingering localStorage keys
  localStorage.clear();
});

afterEach(async () => {
  // Clean up test keys from localStorage
  Object.keys(localStorage)
    .filter((k) => k.startsWith('ph___TEST__'))
    .forEach((k) => localStorage.removeItem(k));
});

// ── T0 Storage tests ───────────────────────────────────────────────────────────

describe('S.set / S.get', () => {
  it('T0-1: S.set then S.get returns the same value (string)', async () => {
    S.set('__TEST__str', 'hello');
    const val = await S.get('__TEST__str');
    expect(val).toBe('hello');
  });

  it('T0-2: S.set then S.get returns the same value (object)', async () => {
    const obj = { a: 1, b: [2, 3] };
    S.set('__TEST__obj', obj);
    const val = await S.get('__TEST__obj');
    expect(val).toEqual(obj);
  });

  it('T0-3: S.get on missing key returns null', async () => {
    const val = await S.get('__TEST__nonexistent_key_xyz');
    expect(val).toBeNull();
  });
});

describe('S.exp', () => {
  it('T0-4: S.exp returns all set keys', async () => {
    S.set('__TEST__e1', 'alpha');
    S.set('__TEST__e2', 42);
    const data = await S.exp();
    expect(data['__TEST__e1']).toBe('alpha');
    expect(data['__TEST__e2']).toBe(42);
  });
});

describe('S.imp', () => {
  it('T0-5: S.imp bulk-imports; each key readable via S.get', async () => {
    const payload = {
      '__TEST__i1': 'imported-a',
      '__TEST__i2': { x: true },
    };
    await S.imp(payload);
    expect(await S.get('__TEST__i1')).toBe('imported-a');
    expect(await S.get('__TEST__i2')).toEqual({ x: true });
  });

  it('T0-6: S.imp with null/undefined does not throw', async () => {
    await expect(S.imp(null)).resolves.toBeUndefined();
    await expect(S.imp(undefined)).resolves.toBeUndefined();
  });
});

describe('S.clr', () => {
  it('T0-7: S.clr removes all keys; subsequent S.get returns null', async () => {
    S.set('__TEST__c1', 'before-clear');
    await S.clr();
    const val = await S.get('__TEST__c1');
    expect(val).toBeNull();
  });

  it('T0-8: S.clr clears localStorage ph_ keys', async () => {
    S.set('__TEST__c2', 'ls-check');
    await S.clr();
    const raw = localStorage.getItem('ph___TEST__c2');
    expect(raw).toBeNull();
  });
});

// ── uid() tests ────────────────────────────────────────────────────────────────

describe('uid()', () => {
  it('T0-9: uid() returns a non-empty string', () => {
    const id = uid();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('T0-10: two uid() calls return different values', () => {
    const a = uid();
    const b = uid();
    expect(a).not.toBe(b);
  });
});

// ── dlFile() + shareItem() tests ───────────────────────────────────────────────

describe('dlFile()', () => {
  it('T0-11: dlFile calls URL.createObjectURL and triggers anchor click', () => {
    const mockUrl = 'blob:mock-url';
    const createObjectURL = vi.fn(() => mockUrl);
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = origCreate(tag);
      if (tag === 'a') {
        vi.spyOn(el, 'click').mockImplementation(clickSpy);
      }
      return el;
    });

    dlFile('test.json', '{"a":1}');

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();

    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
});

// ── encodeSync() / decodeSync() tests ─────────────────────────────────────────

import { encodeSync, decodeSync } from './utils.js';

describe('encodeSync / decodeSync', () => {
  it('T7-1: encodeSync → decodeSync round-trip deep-equals original', () => {
    const data = { todos: [{ id: '1', text: 'hello' }], notes: [], lists: [] };
    const code = encodeSync(data);
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThan(0);
    const decoded = decodeSync(code);
    expect(decoded).toEqual(data);
  });

  it('T7-1b: decodeSync returns null for invalid input', () => {
    expect(decodeSync('not-valid-base64!!!')).toBeNull();
    expect(decodeSync('')).toBeNull();
  });
});

describe('shareItem()', () => {
  it('shareItem falls back to clipboard when navigator.share is unavailable', async () => {
    // Ensure navigator.share is not set
    const originalShare = navigator.share;
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    const result = await shareItem('test-text');

    expect(writeText).toHaveBeenCalledWith('test-text');
    expect(result).toBe(true);

    // Restore
    Object.defineProperty(navigator, 'share', { value: originalShare, configurable: true });
  });
});
