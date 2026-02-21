/**
 * S — Storage API
 * Primary: IndexedDB ('ProductivityHub' DB, 'data' store)
 * Fallback: localStorage (for synchronous reads)
 * Writes to localStorage immediately; IndexedDB write debounced at 300ms.
 */

const DB_NAME = 'ProductivityHub';
const STORE_NAME = 'data';
const LS_PREFIX = 'ph_';

const STORAGE_KEYS = [
  'todos', 'lists', 'notes', 'focus', 'theme', 'preset',
  'customT', 'poms', 'met', 'dHist', 'fHist', 'tab',
  'seenAbout', 'focusTimerState',
];

// ── IndexedDB helpers ──────────────────────────────────────────────────────────

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror = (e) => reject(e.target.error);
  });
}

function idbGet(key) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = (e) => reject(e.target.error);
  }));
}

function idbSet(key, val) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(val, key);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  }));
}

function idbGetAll() {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const result = {};
    const reqKeys = store.getAllKeys();
    reqKeys.onsuccess = () => {
      const keys = reqKeys.result;
      if (keys.length === 0) { resolve(result); return; }
      let pending = keys.length;
      keys.forEach((k) => {
        const r = store.get(k);
        r.onsuccess = () => {
          result[k] = r.result ?? null;
          if (--pending === 0) resolve(result);
        };
        r.onerror = (e) => reject(e.target.error);
      });
    };
    reqKeys.onerror = (e) => reject(e.target.error);
  }));
}

function idbClear() {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).clear();
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  }));
}

// ── localStorage helpers ───────────────────────────────────────────────────────

function lsKey(key) { return LS_PREFIX + key; }

function lsGet(key) {
  try {
    const raw = localStorage.getItem(lsKey(key));
    return raw === null ? null : JSON.parse(raw);
  } catch { return null; }
}

function lsSet(key, val) {
  try { localStorage.setItem(lsKey(key), JSON.stringify(val)); } catch { /* quota */ }
}

function lsClear() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(LS_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

// ── Debounce map for IndexedDB writes ─────────────────────────────────────────

const _timers = {};

function scheduleIDB(key, val) {
  clearTimeout(_timers[key]);
  _timers[key] = setTimeout(() => { idbSet(key, val).catch(() => {}); }, 300);
}

// ── Public S API ───────────────────────────────────────────────────────────────

export const S = {
  /**
   * Async read: tries IndexedDB first, falls back to localStorage.
   */
  async get(key) {
    try {
      const val = await idbGet(key);
      if (val !== null) return val;
    } catch { /* fall through */ }
    return lsGet(key);
  },

  /**
   * Write: localStorage immediately (for sync reads), IndexedDB debounced.
   */
  set(key, val) {
    lsSet(key, val);
    scheduleIDB(key, val);
  },

  /**
   * Export all data as a plain object.
   */
  async exp() {
    try {
      const idbData = await idbGetAll();
      // Merge with localStorage so nothing is missed
      const lsData = {};
      Object.keys(localStorage)
        .filter((k) => k.startsWith(LS_PREFIX))
        .forEach((k) => {
          try { lsData[k.slice(LS_PREFIX.length)] = JSON.parse(localStorage.getItem(k)); } catch { /* skip */ }
        });
      return { ...lsData, ...idbData };
    } catch {
      // Fallback: export from localStorage only
      const out = {};
      Object.keys(localStorage)
        .filter((k) => k.startsWith(LS_PREFIX))
        .forEach((k) => {
          try { out[k.slice(LS_PREFIX.length)] = JSON.parse(localStorage.getItem(k)); } catch { /* skip */ }
        });
      return out;
    }
  },

  /**
   * Import all keys from a plain object.
   */
  async imp(data) {
    if (!data || typeof data !== 'object') return;
    const entries = Object.entries(data);
    for (const [key, val] of entries) {
      lsSet(key, val);
    }
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const [key, val] of entries) {
        store.put(val, key);
      }
      await new Promise((res, rej) => {
        tx.oncomplete = res;
        tx.onerror = (e) => rej(e.target.error);
      });
    } catch { /* localStorage already written */ }
  },

  /**
   * Clear all data from both storage layers.
   */
  async clr() {
    lsClear();
    try { await idbClear(); } catch { /* ignore */ }
  },

  // Reset in-memory DB handle (used in tests to get a fresh DB)
  _resetDB() { _db = null; },
};

export default S;
