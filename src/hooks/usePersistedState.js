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
import { pushKey, pullAll, mergeValues, SYNCED_KEYS } from '../lib/sync.js';
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
          const remote = await pullAll(auth.user.id);
          if (!cancelled && remote[key] !== undefined) {
            setState(prev => {
              const merged = mergeValues(key, prev, remote[key]);
              S.set(key, merged); // update local cache
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

      // Debounced push to Supabase
      if (auth?.user && isSynced) {
        if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
        pushTimerRef.current = setTimeout(() => {
          pushKey(auth.user.id, key, next);
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
