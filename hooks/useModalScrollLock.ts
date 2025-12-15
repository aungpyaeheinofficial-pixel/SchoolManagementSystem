import { useEffect, useRef } from 'react';

type ModalScrollLockOptions = {
  /**
   * If true, scroll the app content container to top when opening the modal
   * so the modal appears "in-frame" even if the user was scrolled down.
   */
  scrollToTopOnOpen?: boolean;
};

type LockSnapshot = {
  scrollTop: number;
  elOverflow: string;
  elOverscrollBehavior: string;
  htmlOverflow: string;
  bodyOverflow: string;
};

function getAppScrollContainer(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-app-scroll-container="true"]');
}

/**
 * Locks background scroll (for this app's scroll container) while a modal is open.
 * Also optionally scrolls the app container to top so the modal is immediately visible.
 */
export function useModalScrollLock(isOpen: boolean, options: ModalScrollLockOptions = {}) {
  const snapshotRef = useRef<LockSnapshot | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const el = getAppScrollContainer();
    if (!el) return;

    const html = document.documentElement;
    const body = document.body;

    // Snapshot styles + current scroll position
    snapshotRef.current = {
      scrollTop: el.scrollTop,
      elOverflow: el.style.overflow,
      elOverscrollBehavior: (el.style as any).overscrollBehavior ?? '',
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
    };

    // Ensure the modal appears in-frame (the app scrolls inside `el`, not the window)
    if (options.scrollToTopOnOpen !== false) {
      // `behavior: 'instant'` isn't universally supported; use immediate assignment.
      el.scrollTop = 0;
    }

    // Lock scroll on the app container
    el.style.overflow = 'hidden';
    // Prevent overscroll / scroll chaining on mobile
    (el.style as any).overscrollBehavior = 'contain';

    // Also harden overall page scroll
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.classList.add('modal-open');
    body.classList.add('modal-open');

    return () => {
      const snap = snapshotRef.current;
      snapshotRef.current = null;
      if (!snap) return;

      // Restore styles
      el.style.overflow = snap.elOverflow;
      (el.style as any).overscrollBehavior = snap.elOverscrollBehavior;
      html.style.overflow = snap.htmlOverflow;
      body.style.overflow = snap.bodyOverflow;
      html.classList.remove('modal-open');
      body.classList.remove('modal-open');

      // Restore scroll position
      el.scrollTop = snap.scrollTop;
    };
  }, [isOpen, options.scrollToTopOnOpen]);
}


