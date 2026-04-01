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
const ID_ARRAY_KEYS = new Set(['todos', 'notes', 'lists', 'dHist', 'fHist']);

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

/**
 * Merge local and remote values for a given key.
 *
 * - ID-array keys (todos, notes, lists, dHist, fHist):
 *     union by `id`; remote wins for same-ID conflicts.
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
