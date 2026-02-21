/**
 * useResponsive — breakpoint hooks
 *
 * useDesk()  → true when viewport width >= 768px  (tablet+)
 * useWide()  → true when viewport width >= 1280px (wide desktop+)
 */
import { useState, useEffect } from 'react';

function useMinWidth(minWidth) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= minWidth : false
  );

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${minWidth}px)`);
    const handler = (e) => setMatches(e.matches);
    // Use addEventListner with backwards-compat fallback
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
    } else {
      mql.addListener(handler);   // Safari < 14
    }
    setMatches(mql.matches);
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handler);
      } else {
        mql.removeListener(handler);
      }
    };
  }, [minWidth]);

  return matches;
}

export function useDesk() { return useMinWidth(768); }
export function useWide() { return useMinWidth(1280); }
