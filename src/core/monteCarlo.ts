// src/core/monteCarlo.ts

import type { InstrumentType } from '../types/market';
import type { MarketState } from '../data/manualMarket';

/**
 * Параметры инструмента для Монте-Карло.
 */
export interface MonteCarloParams {
  instrument: InstrumentType;
  annualReturn: number;    // Ожидаемая доходность, % годовых (из market или сценарий)
  volatility: number;      // Волатильность, % годовых
  horizonYears: number;    // Горизонт, лет
  initialAmount: number;   // Начальная сумма, ₽
  inflation: number;       // Инфляция, % годовых (из market)
  isScenario: boolean;     // true — если доходность сценарная, не из market
}

export interface MonteCarloResult {
  finalAmounts: number[];         // 500 финальных сумм (отсортированы)
  realAmounts: number[];          // 500 реальных (с учётом инфляции) сумм
  mean: number;                   // Среднее номинальное
  median: number;                 // Медиана номинальная
  realMedian: number;             // Медиана реальная (с инфляцией)
  p5: number;                     // 5-й процентиль (худший)
  p25: number;
  p75: number;
  p95: number;                    // 95-й (лучший)
  var95Percent: number;           // VaR 95% в %
  probLoss: number;               // Вероятность убытка
  probBelowDeposit: number;       // Вероятность хуже депозита
  depositRate: number;            // Ставка депозита для сравнения
  depositFinal: number;           // Что было бы на вкладе
  initialAmount: number;
  horizonYears: number;
  inflation: number;
  isScenario: boolean;
}

/**
 * Legacy-параметры. Используются как fallback, если market недоступен.
 *
 * @deprecated — используй getMonteCarloParams(instrument, market).
 */
export const INSTRUMENT_PARAMS_LEGACY: Record<InstrumentType, { annualReturn: number; volatility: number }> = {
  ofz: { annualReturn: 20, volatility: 9 },
  gold: { annualReturn: 25, volatility: 25 },
  deposit: { annualReturn: 12.5, volatility: 0 },
};

/**
 * Обратная совместимость: старое имя константы.
 * @deprecated
 */
export const INSTRUMENT_PARAMS = INSTRUMENT_PARAMS_LEGACY;

/**
 * Возвращает параметры Монте-Карло для инструмента на основе market.
 *
 * Логика:
 * - Вклад: annualReturn = market.depositRate (факт).
 * - ОФЗ: annualReturn = market.ofz10y (текущая доходность к погашению).
 *   volatility — фиксированная (на основе исторической).
 * - Золото: annualReturn = 0 (не прогнозируем), показываем как «страховка».
 *   volatility — фиксированная (высокая).
 *
 * Все доходности, кроме вклада, — СЦЕНАРНЫЕ.
 */
export function getMonteCarloParams(
  instrument: InstrumentType,
  market: MarketState
): { annualReturn: number; volatility: number; isScenario: boolean } {
  switch (instrument) {
    case 'deposit':
      return {
        annualReturn: market.depositRate,
        volatility: 0,
        isScenario: false,
      };

    case 'ofz':
      return {
        annualReturn: market.ofz10y,
        volatility: 9,       // историческая волатильность длинных ОФЗ
        isScenario: true,    // доходность к погашению ≠ гарантия полной доходности
      };

    case 'gold':
      return {
        annualReturn: 0,     // не прогнозируем рост
        volatility: 25,      // высокая волатильность
        isScenario: true,    // цена может как вырасти, так и упасть
      };
  }
}

/**
 * Генератор нормального распределения (Box-Muller).
 */
function normalRandom(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Запускает Монте-Карло симуляцию.
 */
export function runMonteCarlo(params: MonteCarloParams): MonteCarloResult {
  const { annualReturn, volatility, horizonYears, initialAmount, inflation } = params;
  const NUM_SIMULATIONS = 500;

  const finalAmounts: number[] = [];
  const realAmounts: number[] = [];

  // Инфляция в долях за весь горизонт
  const inflationFactor = Math.pow(1 + inflation / 100, horizonYears);

  for (let i = 0; i < NUM_SIMULATIONS; i++) {
    let amount = initialAmount;

    for (let year = 0; year < horizonYears; year++) {
      const randomReturn = annualReturn + volatility * normalRandom();
      amount = amount * (1 + randomReturn / 100);
      if (amount < 0) amount = 0;
    }

    finalAmounts.push(amount);
    realAmounts.push(amount / inflationFactor);
  }

  finalAmounts.sort((a, b) => a - b);
  realAmounts.sort((a, b) => a - b);

  const mean = finalAmounts.reduce((s, v) => s + v, 0) / NUM_SIMULATIONS;
  const median = finalAmounts[Math.floor(NUM_SIMULATIONS / 2)];
  const realMedian = realAmounts[Math.floor(NUM_SIMULATIONS / 2)];
  const p5 = finalAmounts[Math.floor(NUM_SIMULATIONS * 0.05)];
  const p25 = finalAmounts[Math.floor(NUM_SIMULATIONS * 0.25)];
  const p75 = finalAmounts[Math.floor(NUM_SIMULATIONS * 0.75)];
  const p95 = finalAmounts[Math.floor(NUM_SIMULATIONS * 0.95)];

  const var95Percent = ((p5 - initialAmount) / initialAmount) * 100;
  const probLoss = finalAmounts.filter((v) => v < initialAmount).length / NUM_SIMULATIONS;

  // Для сравнения берём ставку вклада из market — но у нас нет market, используем annualReturn
  // Вместо хардкода берём «нулевую» доходность как базу: если инструмент — вклад, сравнивать не с чем
  const DEPOSIT_RATE = 12.5; // TODO: заменить в PHASE 7.2 (передать из market явно)
  const depositFinal = initialAmount * Math.pow(1 + DEPOSIT_RATE / 100, horizonYears);
  const probBelowDeposit = finalAmounts.filter((v) => v < depositFinal).length / NUM_SIMULATIONS;

  return {
    finalAmounts,
    realAmounts,
    mean,
    median,
    realMedian,
    p5,
    p25,
    p75,
    p95,
    var95Percent,
    probLoss,
    probBelowDeposit,
    depositRate: DEPOSIT_RATE,
    depositFinal,
    initialAmount,
    horizonYears,
    inflation,
    isScenario: params.isScenario,
  };
}

/**
 * Форматирование денег.
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(amount);
}