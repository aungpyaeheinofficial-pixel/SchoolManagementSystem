import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type ModalPortalProps = {
  children: React.ReactNode;
};

/**
 * Renders children into document.body so fixed overlays are truly viewport-fixed.
 * This avoids being clipped/offset by the app's scroll container / header layout.
 */
export const ModalPortal: React.FC<ModalPortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
};


