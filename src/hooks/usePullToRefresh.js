/**
 * usePullToRefresh(elementRef, onRefresh)
 *
 * Attaches touch listeners to the given scroll element and tracks a pull-down
 * gesture. Returns { pullY, refreshing } for rendering a visual indicator.
 *
 * - pullY: current visual drag distance (0 → THRESHOLD px, with resistance)
 * - refreshing: true while onRefresh() promise is pending
 *
 * Only activates when the element is scrolled to the top (scrollTop === 0).
 */
import { useState, useEffect, useRef } from 'react';

const THRESHOLD = 64;   // visual px required to trigger
const RESISTANCE = 0.5; // drag multiplier (user must move 2× THRESHOLD)

export function usePullToRefresh(elementRef, onRefresh) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startYRef = useRef(null);
  const pullYRef = useRef(0);
  const pullingRef = useRef(false);
  const refreshingRef = useRef(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    function onTouchStart(e) {
      if (refreshingRef.current || el.scrollTop > 0) return;
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = false;
    }

    function onTouchMove(e) {
      if (startYRef.current === null || refreshingRef.current) return;
      if (el.scrollTop > 0) {
        startYRef.current = null;
        pullYRef.current = 0;
        setPullY(0);
        return;
      }
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta > 0) {
        pullingRef.current = true;
        const clamped = Math.min(delta * RESISTANCE, THRESHOLD);
        pullYRef.current = clamped;
        setPullY(clamped);
        e.preventDefault();
      } else {
        startYRef.current = null;
        pullYRef.current = 0;
        setPullY(0);
      }
    }

    function onTouchEnd() {
      if (!pullingRef.current) {
        startYRef.current = null;
        return;
      }
      pullingRef.current = false;
      startYRef.current = null;
      const reached = pullYRef.current >= THRESHOLD;
      pullYRef.current = 0;
      setPullY(0);
      if (reached && !refreshingRef.current) {
        refreshingRef.current = true;
        setRefreshing(true);
        Promise.resolve(onRefresh()).finally(() => {
          refreshingRef.current = false;
          setRefreshing(false);
        });
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [elementRef, onRefresh]);

  return { pullY, refreshing };
}
