// src/hooks/useTheme.ts

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'golden-investor-theme';

/**
 * Определяет тему по приоритету:
 * 1. localStorage — если пользователь выбирал вручную
 * 2. prefers-color-scheme — системная тема устройства
 * 3. light — по умолчанию
 */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  // 1. Пользовательский выбор
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }

  // 2. Системная тема
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  // 3. По умолчанию
  return 'light';
}

/**
 * Проверяет: пользователь выбрал тему вручную?
 */
function hasUserChoice(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'light' || saved === 'dark';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [isManual, setIsManual] = useState<boolean>(hasUserChoice);

  // Синхронизация с <html data-theme="...">
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Следим за изменениями системной темы
  // Если пользователь не выбирал вручную — переключаемся автоматически
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent) => {
      // Только если пользователь не выбрал вручную
      if (!isManual) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    // addEventListener современный, addListener — для старых Safari
    if (media.addEventListener) {
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    } else if (media.addListener) {
      media.addListener(handler);
      return () => media.removeListener(handler);
    }
  }, [isManual]);

  /**
   * Переключение вручную — с этого момента системная тема игнорируется.
   */
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      setIsManual(true);
      return next;
    });
  }, []);

  /**
   * Установить тему явно.
   */
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    setIsManual(true);
  }, []);

  /**
   * Сбросить на системную тему — удалить пользовательский выбор.
   * Полезно для кнопки «Следовать системе» в настройках.
   */
  const resetToSystem = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsManual(false);
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setThemeState('dark');
    } else {
      setThemeState('light');
    }
  }, []);

  return {
    theme,
    isManual,       // true — пользователь выбрал вручную, false — следует системе
    toggleTheme,
    setTheme,
    resetToSystem,
  };
}
