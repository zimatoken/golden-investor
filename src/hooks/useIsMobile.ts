// src/hooks/useIsMobile.ts

import { useEffect, useState } from 'react';

/**
 * Следит за шириной окна. Возвращает true, если ширина ≤ 768px.
 * Реагирует на ресайз и поворот экрана.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);

  return isMobile;
}