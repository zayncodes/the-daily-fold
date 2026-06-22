import { useRef } from "react";

/**
 * Lightweight horizontal swipe detection for touch devices. Returns touch
 * handlers to spread onto an element; fires onLeft / onRight past a threshold.
 */
export function useSwipe(
  onLeft?: () => void,
  onRight?: () => void,
  threshold = 60,
) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  return {
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (startX.current === null || startY.current === null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      // Ignore mostly-vertical gestures (scrolling).
      if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) onLeft?.();
        else onRight?.();
      }
      startX.current = null;
      startY.current = null;
    },
  };
}
