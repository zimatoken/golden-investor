// src/hooks/useMarketData.ts

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_MARKET, type MarketState } from '../data/manualMarket';

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

function loadMarket(): MarketState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Проверка структуры
      if (typeof parsed.keyRate === 'number' && typeof parsed.updatedAt === 'string') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('useMarketData: ошибка чтения, используем DEFAULT_MARKET');
  }
  return DEFAULT_MARKET;
}

function saveMarket(state: MarketState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Хук для чтения/записи рыночных данных.
 * Автоматически сохраняет в localStorage при обновлении.
 */
export function useMarketData() {
  const [market, setMarketState] = useState<MarketState>(loadMarket);

  // Сохранение при любом изменении
  useEffect(() => {
    saveMarket(market);
  }, [market]);

  const updateMarket = useCallback((patch: Partial<MarketState>) => {
    setMarketState((prev) => ({
      ...prev,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const resetToDefault = useCallback(() => {
    setMarketState({ ...DEFAULT_MARKET, updatedAt: new Date().toISOString() });
  }, []);

  return {
    market,
    updateMarket,
    resetToDefault,
    isStale: isStale(market.updatedAt),
    daysSince: daysSinceUpdate(market.updatedAt),
  };
}