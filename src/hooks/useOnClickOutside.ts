import { useEffect, RefObject } from 'react';

/**
 * Custom hook to detect clicks outside a referenced element.
 * Supports an optional ignoreRef (such as the toggle trigger button) to prevent
 * click event races between click-outside and the trigger's onClick handler.
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
  ignoreRef?: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target || !document.contains(target)) return;

      // Do nothing if clicking inside the ref element
      if (ref.current && ref.current.contains(target)) {
        return;
      }

      // Do nothing if clicking inside the trigger/toggle button
      if (ignoreRef?.current && ignoreRef.current.contains(target)) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, ignoreRef]);
}
