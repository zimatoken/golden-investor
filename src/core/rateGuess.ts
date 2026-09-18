// src/core/rateGuess.ts
//
// PHASE 10.1 — «Угадай ставку ЦБ».
// Пользователь делает прогноз до заседания. После — сравнение.

import type { MarketState } from '../data/manualMarket';

const STORAGE_KEY = 'gi_rate_guesses_v1';

/**
 * Один прогноз ставки.
 */
export interface RateGuess {
  id: string;
  guessRate: number;
  baseRate: number;
  cbDate: string;         // YYYY-MM-DD — дата заседания
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
  actualRate?: number;
  correct?: boolean;
}

export interface RateGuessStats {
  total: number;         // всего прогнозов (включая нерешённые)
  resolved: number;      // проверенных
  correct: number;       // угаданных
  accuracy: number | null; // % угаданных (null если < 1 решённого)
}

/**
 * Возможные варианты ставки для быстрого выбора.
 * Около текущей ставки ±1.5 п.п. с шагом 0.5.
 */
export function getRateOptions(currentRate: number): number[] {
  const options: number[] = [];
  for (let delta = -1.5; delta <= 1.5; delta += 0.5) {
    const rate = Math.round((currentRate + delta) * 10) / 10;
    if (rate > 0) options.push(rate);
  }
  return options;
}

/**
 * Загрузка всех прогнозов.
 */
export function loadGuesses(): RateGuess[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Сохранение прогнозов.
 */
function saveGuesses(guesses: RateGuess[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(guesses));
}

/**
 * Добавить новый прогноз.
 * Если прогноз для этого заседания уже есть — перезаписываем.
 */
export function addGuess(
  guessRate: number,
  baseRate: number,
  cbDate: string
): RateGuess {
  const list = loadGuesses();

  // Убираем старый прогноз для этой даты, если был
  const filtered = list.filter((g) => g.cbDate !== cbDate);

  const guess: RateGuess = {
    id: `guess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    guessRate,
    baseRate,
    cbDate,
    createdAt: new Date().toISOString(),
    resolved: false,
  };
  filtered.push(guess);
  saveGuesses(filtered);
  return guess;
}

/**
 * Получить активный прогноз для конкретной даты заседания.
 */
export function getActiveGuess(cbDate: string): RateGuess | null {
  const list = loadGuesses();
  const found = list.find((g) => g.cbDate === cbDate && !g.resolved);
  return found ?? null;
}

/**
 * Проверить прогнозы: сравнить с текущей ставкой.
 * Вызывается при загрузке StatusScreen.
 *
 * Логика:
 * - Если заседание уже прошло (cbDate < today) — резолвим.
 * - Фактическая ставка = market.keyRate.
 * - Угадал — если |guessRate − keyRate| < 0.01.
 */
export function resolveGuesses(market: MarketState): RateGuess[] {
  const list = loadGuesses();
  const today = new Date().toISOString().slice(0, 10);
  let changed = false;

  const updated = list.map((g) => {
    if (g.resolved) return g;
    if (g.cbDate >= today) return g; // ещё не прошло

    changed = true;
    return {
      ...g,
      resolved: true,
      resolvedAt: new Date().toISOString(),
      actualRate: market.keyRate,
      correct: Math.abs(g.guessRate - market.keyRate) < 0.01,
    };
  });

  if (changed) saveGuesses(updated);
  return updated;
}

/**
 * Статистика.
 */
export function getGuessStats(): RateGuessStats {
  const list = loadGuesses();
  const resolved = list.filter((g) => g.resolved);
  const correct = resolved.filter((g) => g.correct).length;

  return {
    total: list.length,
    resolved: resolved.length,
    correct,
    accuracy: resolved.length >= 1
      ? Math.round((correct / resolved.length) * 100)
      : null,
  };
}

/**
 * Удалить все прогнозы (для reset).
 */
export function clearGuesses(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Сколько дней до заседания.
 */
export function daysUntil(dateIso: string): number {
  const target = new Date(dateIso).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.round((target - today) / (24 * 60 * 60 * 1000));
}