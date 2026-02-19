import { useEffect } from 'react';

/**
 * useClickOutside(ref, handler, enabled)
 * - when enabled = true → listen mousedown outside ref
 */
export function useClickOutside(ref, handler, enabled = true) { 
    useEffect(() => {
    if (!enabled) return;

    const onMouseDown = (e) => {
      const el = ref?.current;
      if (!el) return;
      if (!el.contains(e.target)) handler(e);
    };

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [ref, handler, enabled])
}

