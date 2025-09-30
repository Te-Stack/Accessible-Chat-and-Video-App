// hooks/useFocusManager.ts
import { useRef, useCallback } from 'react';
import type { FocusManager } from '../types/accessibility';

export const useFocusManager = (): FocusManager => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback((): void => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback((): void => {
    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus();
    }
  }, []);

  const manageFocus = useCallback((element: HTMLElement | null): void => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }, []);

  const trapFocus = useCallback((containerElement: HTMLElement | null): (() => void) | void => {
    if (!containerElement) return () => {};

    const focusableElements = containerElement.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    containerElement.addEventListener('keydown', handleKeyDown);

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    return (): void => {
      containerElement.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    saveFocus,
    restoreFocus,
    manageFocus,
    trapFocus
  };
};