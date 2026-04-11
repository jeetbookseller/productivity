import { supabase } from './supabase.js';

/**
 * Keys that get synced to Supabase.
 * Excluded: 'tab', 'focusTimerState' (device-specific)
 */
export const SYNCED_KEYS = [
  'todos', 'notes', 'lists', 'focus', 'theme', 'preset',
  'customT', 'poms', 'met', 'dHist', 'fHist',
];

/** Array keys whose items have an `id` field — merge by id union. */
const ID_ARRAY_KEYS = new Set(['todos', 'notes', 'lists', 'fHist']);

/** Array keys whose items are keyed by `date` — merge by date. */
const DATE_ARRAY_KEYS = new Set(['dHist']);

/**
 * Upsert a single key for a user.
 */
export async function pushKey(userId, key, value) {
  if (!supabase) return;
  const { error } = await supabase
    .from('user_data')
    .upsert(
      { user_id: userId, key, value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,key' }
    );
  if (error) console.error(`[sync] pushKey "${key}" failed:`, error.message);
}

/**
 * Fetch all synced keys for a user. Returns a { key: value } map.
 */
export async function pullAll(userId) {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from('user_data')
    .select('key, value')
    .eq('user_id', userId);
  if (error) {
    console.error('[sync] pullAll failed:', error.message);
    return {};
  }
  const result = {};
  for (const row of data) {
    result[row.key] = row.value;
  }
  return result;
}

// ── Shared pull cache ─────────────────────────────────────────────────────────
// All usePersistedState hooks mount at the same time.  Without caching, each
// one fires its own pullAll (11 identical network requests).  We deduplicate
// by keeping the promise for a short window so concurrent callers share it.

let _pullPromise = null;
let _pullUserId = null;
let _pullTime = 0;
const PULL_CACHE_TTL = 5000; // ms — covers the initial mount burst

/**
 * Shared wrapper around pullAll.  Concurrent calls within the TTL window for
 * the same userId reuse a single in-flight request.
 */
export function pullAllShared(userId) {
  const now = Date.now();
  if (_pullUserId === userId && _pullPromise && (now - _pullTime) < PULL_CACHE_TTL) {
    return _pullPromise;
  }
  _pullUserId = userId;
  _pullTime = now;
  _pullPromise = pullAll(userId);
  return _pullPromise;
}

/**
 * Merge local and remote values for a given key.
 *
 * - ID-array keys (todos, notes, lists, fHist):
 *     union by `id`; remote wins for same-ID conflicts.
 * - Date-array keys (dHist):
 *     union by `date`; takes max pomodoro count per day.
 * - focus (array of IDs): union, dedup, cap at 5.
 * - Scalars (theme, preset, customT, poms, met): remote wins.
 */
export function mergeValues(key, local, remote) {
  // If remote is null/undefined, keep local
  if (remote === undefined || remote === null) return local;
  // If local is null/undefined, use remote
  if (local === undefined || local === null) return remote;

  if (ID_ARRAY_KEYS.has(key)) {
    return mergeById(local, remote);
  }

  if (DATE_ARRAY_KEYS.has(key)) {
    return mergeByDate(local, remote);
  }

  if (key === 'focus') {
    return mergeFocus(local, remote);
  }

  // Scalars: remote wins
  return remote;
}

/**
 * Union two arrays by `id`. Remote wins for same-ID conflicts.
 */
function mergeById(local, remote) {
  if (!Array.isArray(local)) local = [];
  if (!Array.isArray(remote)) remote = [];

  const map = new Map();
  for (const item of local) {
    if (item && item.id) map.set(item.id, item);
  }
  for (const item of remote) {
    if (item && item.id) map.set(item.id, item); // remote overwrites
  }
  return Array.from(map.values());
}

/**
 * Union two arrays by `date` (for dHist).
 * For entries with the same date, keep the higher pomodoro count — this
 * handles the case where two devices independently record poms for the
 * same day without double-counting.
 */
function mergeByDate(local, remote) {
  if (!Array.isArray(local)) local = [];
  if (!Array.isArray(remote)) remote = [];

  const map = new Map();
  for (const entry of local) {
    if (entry && entry.date) map.set(entry.date, { ...entry });
  }
  for (const entry of remote) {
    if (entry && entry.date) {
      const existing = map.get(entry.date);
      if (existing) {
        // Take max pomodoro count per day
        existing.p = Math.max(existing.p || 0, entry.p || 0);
      } else {
        map.set(entry.date, { ...entry });
      }
    }
  }
  // Return sorted by date ascending
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Union focus arrays (plain ID strings), dedup, cap at 5.
 */
function mergeFocus(local, remote) {
  if (!Array.isArray(local)) local = [];
  if (!Array.isArray(remote)) remote = [];

  const seen = new Set();
  const merged = [];
  // Remote items first (higher priority)
  for (const id of remote) {
    if (!seen.has(id)) { seen.add(id); merged.push(id); }
  }
  for (const id of local) {
    if (!seen.has(id)) { seen.add(id); merged.push(id); }
  }
  return merged.slice(0, 5);
}
