/**
 * usePersistedState(key, defaultValue)
 *
 * Three-layer persistence:
 * - localStorage: sync read on mount (instant first render)
 * - IndexedDB: async local cache, debounced writes at 300ms via S.set
 * - Supabase: source of truth, debounced writes at 2s via pushKey
 *
 * On mount: localStorage → render, then pull from Supabase → merge → update.
 * On write: update React state → S.set (LS + IDB) → debounced pushKey (Supabase).
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { S } from '../lib/storage.js';
import { pushKey, pullAllShared, mergeValues, SYNCED_KEYS } from '../lib/sync.js';
import { useAuthContext } from '../components/AuthProvider.jsx';

const LS_PREFIX = 'ph_';
const PUSH_DEBOUNCE = 2000;

function lsRead(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw === null ? null : JSON.parse(raw);
  } catch { return null; }
}

export function usePersistedState(key, defaultValue) {
  const [state, setState] = useState(() => {
    const stored = lsRead(key);
    return stored !== null ? stored : defaultValue;
  });

  const auth = useAuthContext();
  const pushTimerRef = useRef(null);
  const isSynced = SYNCED_KEYS.includes(key);

  // Ref that always holds the latest committed state.  The debounced push
  // reads from this instead of capturing a stale `next` in a closure, so
  // it always sends the most up-to-date value (including any reconcile
  // merges that happened after the push was scheduled).
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Async reconciliation: pull from Supabase (truth) on mount, fall back to IDB
  useEffect(() => {
    let cancelled = false;

    async function reconcile() {
      // First try IDB for fast local reconciliation
      try {
        const idbVal = await S.get(key);
        if (idbVal !== null && !cancelled) setState(idbVal);
      } catch {}

      // Then pull from Supabase if user is authenticated and key is synced
      if (auth?.user && isSynced) {
        try {
          // pullAllShared deduplicates — all 11 hooks share one network call
          const remote = await pullAllShared(auth.user.id);
          if (!cancelled && remote[key] !== undefined) {
            setState(prev => {
              const merged = mergeValues(key, prev, remote[key]);
              // Only update if the merge actually changed something
              if (JSON.stringify(merged) === JSON.stringify(prev)) return prev;
              S.set(key, merged); // update local cache
              // Push merged result back so all devices converge.
              // Without this, merged data stays local-only until the user
              // happens to make a new change on this device.
              if (JSON.stringify(merged) !== JSON.stringify(remote[key])) {
                pushKey(auth.user.id, key, merged);
              }
              return merged;
            });
          }
        } catch {}
      }
    }

    reconcile();
    return () => { cancelled = true; };
  }, [key, auth?.user?.id, isSynced]);

  const set = useCallback((valOrUpdater) => {
    setState((prev) => {
      const next = typeof valOrUpdater === 'function' ? valOrUpdater(prev) : valOrUpdater;
      S.set(key, next); // localStorage immediately + IDB debounced

      // Debounced push to Supabase — reads from stateRef when the timer
      // fires so it always pushes the latest state, not a stale snapshot.
      if (auth?.user && isSynced) {
        if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
        pushTimerRef.current = setTimeout(() => {
          pushKey(auth.user.id, key, stateRef.current);
        }, PUSH_DEBOUNCE);
      }

      return next;
    });
  }, [key, auth?.user?.id, isSynced]);

  // Cleanup push timer on unmount
  useEffect(() => {
    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
  }, []);

  return [state, set];
}
