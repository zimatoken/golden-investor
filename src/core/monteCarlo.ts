// src/core/monteCarlo.ts

import type { InstrumentType } from '../types/market';

/**
 * Параметры инструмента для Монте-Карло.
 * В будущем можно добавить поле `provider` ('sber' | 'alfa' | 'tbank')
 * и загружать данные из таблицы банков.
 */
export interface MonteCarloParams {
  instrument: InstrumentType;
  annualReturn: number;    // Ожидаемая доходность, % годовых
  volatility: number;      // Волатильность, % годовых
  horizonYears: number;    // Горизонт, лет
  initialAmount: number;   // Начальная сумма, ₽
}

export interface MonteCarloResult {
  finalAmounts: number[];      // 500 финальных сумм (отсортированы)
  mean: number;                // Среднее
  median: number;              // Медиана
  p5: number;                  // 5-й процентиль (худший)
  p25: number;                 // 25-й
  p75: number;                 // 75-й
  p95: number;                 // 95-й (лучший)
  var95Percent: number;        // VaR 95% в % (макс. потеря с вероятностью 95%)
  probLoss: number;            // Вероятность убытка (0..1)
  probBelowDeposit: number;    // Вероятность, что хуже депозита (0..1)
  depositRate: number;         // Ставка депозита для сравнения
}

/**
 * Параметры по умолчанию для каждого инструмента.
 * Основаны на данных 2026 года.
 */
export const INSTRUMENT_PARAMS: Record<InstrumentType, { annualReturn: number; volatility: number }> = {
  ofz: { annualReturn: 20, volatility: 9 },      // Длинные ОФЗ: 20%, волатильность 9%
  gold: { annualReturn: 25, volatility: 25 },    // Золото: 25%, волатильность 25%
  deposit: { annualReturn: 12.5, volatility: 0 } // Вклад: 12,5%, 0%
};

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
  const { annualReturn, volatility, horizonYears, initialAmount } = params;
  const NUM_SIMULATIONS = 500;

  const finalAmounts: number[] = [];

  for (let i = 0; i < NUM_SIMULATIONS; i++) {
    let amount = initialAmount;

    for (let year = 0; year < horizonYears; year++) {
      // Случайная годовая доходность
      const randomReturn = annualReturn + volatility * normalRandom();
      amount = amount * (1 + randomReturn / 100);

      if (amount < 0) amount = 0;
    }

    finalAmounts.push(amount);
  }

  finalAmounts.sort((a, b) => a - b);

  const mean = finalAmounts.reduce((s, v) => s + v, 0) / NUM_SIMULATIONS;
  const median = finalAmounts[Math.floor(NUM_SIMULATIONS / 2)];
  const p5 = finalAmounts[Math.floor(NUM_SIMULATIONS * 0.05)];
  const p25 = finalAmounts[Math.floor(NUM_SIMULATIONS * 0.25)];
  const p75 = finalAmounts[Math.floor(NUM_SIMULATIONS * 0.75)];
  const p95 = finalAmounts[Math.floor(NUM_SIMULATIONS * 0.95)];

  const var95Percent = ((p5 - initialAmount) / initialAmount) * 100;
  const probLoss = finalAmounts.filter((v) => v < initialAmount).length / NUM_SIMULATIONS;

  const DEPOSIT_RATE = 12.5;
  const depositFinal = initialAmount * Math.pow(1 + DEPOSIT_RATE / 100, horizonYears);
  const probBelowDeposit = finalAmounts.filter((v) => v < depositFinal).length / NUM_SIMULATIONS;

  return {
    finalAmounts,
    mean,
    median,
    p5,
    p25,
    p75,
    p95,
    var95Percent,
    probLoss,
    probBelowDeposit,
    depositRate: DEPOSIT_RATE,
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