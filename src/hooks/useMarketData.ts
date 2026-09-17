// src/hooks/useMarketData.ts

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_MARKET,
  normalizeMarket,
  type MarketState,
} from '../data/manualMarket';

const STORAGE_KEY = 'golden-investor-market';

/**
 * Сколько дней данные считаются свежими.
 * После — StatusScreen показывает баннер «Обновить данные».
 */
const FRESHNESS_DAYS = 14;

/**
 * Проверка: устарели ли данные.
 */
export function isStale(updatedAt: string): boolean {
  const updated = new Date(updatedAt).getTime();
  const now = Date.now();
  const days = (now - updated) / (1000 * 60 * 60 * 24);
  return days > FRESHNESS_DAYS;
}

/**
 * Сколько дней прошло с момента обновления.
 */
export function daysSinceUpdate(updatedAt: string): number {
  const updated = new Date(updatedAt).getTime();
  const now = Date.now();
  return Math.floor((now - updated) / (1000 * 60 * 60 * 24));
}

/**
 * Загрузка из localStorage.
 * Применяет normalizeMarket — гарантирует наличие yieldCurve
 * и синхронизирует ofz10y/ofzShort.
 */
function loadMarket(): MarketState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.keyRate === 'number' && typeof parsed.updatedAt === 'string') {
        return normalizeMarket(parsed as MarketState);
      }
    }
  } catch (e) {
    console.warn('useMarketData: ошибка чтения, используем DEFAULT_MARKET');
  }
  return normalizeMarket(DEFAULT_MARKET);
}

function saveMarket(state: MarketState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Хук для чтения/записи рыночных данных.
 * Автоматически сохраняет в localStorage при обновлении.
 *
 * Особенность v4: любые изменения проходят через normalizeMarket,
 * чтобы ofz10y и ofzShort всегда были синхронизированы с yieldCurve.
 */
export function useMarketData() {
  const [market, setMarketState] = useState<MarketState>(loadMarket);

  useEffect(() => {
    saveMarket(market);
  }, [market]);

  /**
   * Обновление рыночных данных.
   * Патч применяется, затем — нормализация (sync ofz10y/ofzShort из yieldCurve).
   */
  const updateMarket = useCallback((patch: Partial<MarketState>) => {
    setMarketState((prev) => {
      const merged = {
        ...prev,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      return normalizeMarket(merged);
    });
  }, []);

  /**
   * Установить конкретную точку yield curve.
   * Автоматически синхронизирует ofz10y/ofzShort, если это 120/12 месяцев.
   */
  const updateYieldPoint = useCallback((months: number, yieldValue: number) => {
    setMarketState((prev) => {
      const curve = prev.yieldCurve ?? [];
      const idx = curve.findIndex((p) => p.months === months);
      const newCurve =
        idx >= 0
          ? curve.map((p) => (p.months === months ? { ...p, yield: yieldValue } : p))
          : [...curve, { months, yield: yieldValue }].sort((a, b) => a.months - b.months);

      return normalizeMarket({
        ...prev,
        yieldCurve: newCurve,
        updatedAt: new Date().toISOString(),
      });
    });
  }, []);

  const resetToDefault = useCallback(() => {
    setMarketState(
      normalizeMarket({ ...DEFAULT_MARKET, updatedAt: new Date().toISOString() })
    );
  }, []);

  return {
    market,
    updateMarket,
    updateYieldPoint,
    resetToDefault,
    isStale: isStale(market.updatedAt),
    daysSince: daysSinceUpdate(market.updatedAt),
  };
}