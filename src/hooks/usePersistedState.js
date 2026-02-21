/**
 * usePersistedState(key, defaultValue)
 *
 * - Sync read from localStorage on mount (instant first render)
 * - Async reconciliation from IndexedDB after mount (truth source)
 * - Writes: localStorage immediately + IndexedDB debounced via S.set
 */
import { useState, useEffect, useCallback } from 'react';
import { S } from '../lib/storage.js';

const LS_PREFIX = 'ph_';

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

  // Async reconciliation: IDB is the truth source; update if it has a value
  useEffect(() => {
    S.get(key).then((val) => {
      if (val !== null) setState(val);
    }).catch(() => {});
  }, [key]);

  const set = useCallback((valOrUpdater) => {
    setState((prev) => {
      const next = typeof valOrUpdater === 'function' ? valOrUpdater(prev) : valOrUpdater;
      S.set(key, next);   // localStorage immediately + IDB debounced
      return next;
    });
  }, [key]);

  return [state, set];
}
