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

/* ─── PHASE 7.2: Сценарная модель для ОФЗ ──────── */

/**
 * Сценарий изменения ставки ЦБ.
 */
export type RateScenario = 'falling' | 'flat' | 'rising';

export interface ScenarioParams {
  label: RateScenario;
  title: string;
  /** Средняя годовая доходность за весь горизонт */
  annualReturn: number;
  /** Волатильность (оставляем фиксированной для ОФЗ) */
  volatility: number;
  /** ΔСтавки в п.п. (для ОФЗ) */
  rateDeltaPp: number;
  /** Доходность первого года */
  firstYearReturn: number;
  /** Доходность последующих лет */
  steadyReturn: number;
  /** Что это значит (для UI) */
  description: string;
}

/**
 * Duration для длинных ОФЗ. Используется приблизительная оценка.
 * Точное значение — из duration.ts, но для сценария берём константу.
 */
const LONG_OFZ_DURATION = 8;

/**
 * Возвращает три сценария для ОФЗ.
 *
 * @param market — текущее состояние рынка
 * @param horizonYears — горизонт в годах
 */
export function getScenarioParams(
  market: MarketState,
  horizonYears: number
): ScenarioParams[] {
  const coupon = market.ofz10y;        // купонная доходность = текущая доходность к погашению
  const duration = LONG_OFZ_DURATION;

  /**
   * Считает среднюю годовую доходность с учётом эффекта первого года.
   */
  const avgReturn = (rateDeltaPp: number): { avg: number; first: number; steady: number } => {
    const priceChangePct = -duration * rateDeltaPp;  // в %
    const firstYear = coupon + priceChangePct;        // первый год: купон + прирост тела
    const steady = coupon;                            // последующие годы: только купон

    if (horizonYears <= 1) {
      return { avg: firstYear, first: firstYear, steady };
    }

    const avg = (firstYear + (horizonYears - 1) * steady) / horizonYears;
    return { avg, first: firstYear, steady };
  };

  const falling = avgReturn(-2);
  const flat = avgReturn(0);
  const rising = avgReturn(+2);

  return [
    {
      label: 'falling',
      title: '📉 Оптимистичный: ставка −2 п.п.',
      annualReturn: Math.round(falling.avg * 100) / 100,
      volatility: 9,
      rateDeltaPp: -2,
      firstYearReturn: Math.round(falling.first * 100) / 100,
      steadyReturn: Math.round(falling.steady * 100) / 100,
      description: `Первый год: +${falling.first.toFixed(2)}% (купон + рост тела). Дальше: ${falling.steady.toFixed(2)}%/год.`,
    },
    {
      label: 'flat',
      title: '📊 Базовый: ставка без изменений',
      annualReturn: Math.round(flat.avg * 100) / 100,
      volatility: 9,
      rateDeltaPp: 0,
      firstYearReturn: Math.round(flat.first * 100) / 100,
      steadyReturn: Math.round(flat.steady * 100) / 100,
      description: `Купон ${flat.steady.toFixed(2)}% весь срок. Тело не меняется.`,
    },
    {
      label: 'rising',
      title: '📈 Пессимистичный: ставка +2 п.п.',
      annualReturn: Math.round(rising.avg * 100) / 100,
      volatility: 9,
      rateDeltaPp: +2,
      firstYearReturn: Math.round(rising.first * 100) / 100,
      steadyReturn: Math.round(rising.steady * 100) / 100,
      description: `Первый год: ${rising.first >= 0 ? '+' : ''}${rising.first.toFixed(2)}% (купон − падение тела). Дальше: ${rising.steady.toFixed(2)}%/год.`,
    },
  ];
}

/* ─── PHASE 7.3: Stress Test (5 шоков) ──────── */

/**
 * Один стресс-сценарий.
 */
export interface StressScenario {
  id: string;
  icon: string;
  title: string;
  /** Медиана при шоке (номинал) */
  median: number;
  /** Медиана при шоке (реально, с инфляцией) */
  realMedian: number;
  /** Худший сценарий (5-й процентиль) */
  p5: number;
  /** Что произошло */
  impact: string;
  /** Тон: positive / negative / neutral */
  tone: 'positive' | 'negative' | 'neutral';
}

export interface StressTestResult {
  baseMedian: number;           // Базовый сценарий (без шоков)
  baseRealMedian: number;       // Базовая реальная медиана
  scenarios: StressScenario[];
}

/**
 * Внутренняя симуляция с модификатором дохода по годам.
 *
 * @param modifier — функция, которая возвращает множитель для года (или null, если модификатор не нужен)
 */
function runMonteCarloWithModifier(
  baseAnnualReturn: number,
  volatility: number,
  horizonYears: number,
  initialAmount: number,
  inflation: number,
  modifier: (yearIndex: number, randomReturn: number) => number,
  numSimulations = 500
): { median: number; realMedian: number; p5: number } {
  const finalAmounts: number[] = [];
  const inflationFactor = Math.pow(1 + inflation / 100, horizonYears);

  for (let i = 0; i < numSimulations; i++) {
    let amount = initialAmount;
    for (let year = 0; year < horizonYears; year++) {
      const randomReturn = baseAnnualReturn + volatility * normalRandom();
      const appliedReturn = modifier(year, randomReturn);
      amount = amount * (1 + appliedReturn / 100);
      if (amount < 0) amount = 0;
    }
    finalAmounts.push(amount);
  }

  finalAmounts.sort((a, b) => a - b);
  const median = finalAmounts[Math.floor(numSimulations / 2)];
  const p5 = finalAmounts[Math.floor(numSimulations * 0.05)];

  return {
    median,
    realMedian: median / inflationFactor,
    p5,
  };
}

/**
 * Запускает стресс-тест: 5 детерминированных шоков.
 *
 * @param instrument — инструмент
 * @param market — текущий market
 * @param horizonYears — горизонт
 * @param initialAmount — начальная сумма
 */
export function runStressTest(
  instrument: InstrumentType,
  market: MarketState,
  horizonYears: number,
  initialAmount: number
): StressTestResult {
  const baseParams = getMonteCarloParams(instrument, market);
  const baseAnnualReturn = baseParams.annualReturn;
  const volatility = baseParams.volatility;

  // Базовый сценарий
  const base = runMonteCarloWithModifier(
    baseAnnualReturn,
    volatility,
    horizonYears,
    initialAmount,
    market.inflation,
    (_, r) => r
  );

  const scenarios: StressScenario[] = [];

  // 1. Инфляционный шок
  const inflationShock = runMonteCarloWithModifier(
    baseAnnualReturn,
    volatility,
    horizonYears,
    initialAmount,
    market.inflation + 4,
    (_, r) => r
  );
  const inflationLoss = base.realMedian > 0
    ? Math.round(((inflationShock.realMedian - base.realMedian) / base.realMedian) * 100)
    : 0;
  scenarios.push({
    id: 'inflation-shock',
    icon: '🔥',
    title: `Инфляция +4 п.п. (${market.inflation}% → ${(market.inflation + 4).toFixed(1)}%)`,
    median: inflationShock.median,
    realMedian: inflationShock.realMedian,
    p5: inflationShock.p5,
    impact: `Реальная медиана ${formatMoney(inflationShock.realMedian)} ₽ (${inflationLoss}% к базовой)`,
    tone: 'negative',
  });

  // 2. Ставка +2 п.п. (для ОФЗ — через duration)
  if (instrument === 'ofz') {
    const duration = 8;
    const firstYearReturn = baseAnnualReturn - duration * 2;
    const rateUp = runMonteCarloWithModifier(
      baseAnnualReturn,
      volatility,
      horizonYears,
      initialAmount,
      market.inflation,
      (year, r) => (year === 0 ? firstYearReturn : r)
    );
    scenarios.push({
      id: 'rate-up',
      icon: '📈',
      title: 'Ставка +2 п.п.',
      median: rateUp.median,
      realMedian: rateUp.realMedian,
      p5: rateUp.p5,
      impact: `Первый год: ${firstYearReturn.toFixed(2)}% (тело падает по дюрации)`,
      tone: 'negative',
    });

    // 3. Ставка −2 п.п.
    const firstYearReturnDown = baseAnnualReturn + duration * 2;
    const rateDown = runMonteCarloWithModifier(
      baseAnnualReturn,
      volatility,
      horizonYears,
      initialAmount,
      market.inflation,
      (year, r) => (year === 0 ? firstYearReturnDown : r)
    );
    scenarios.push({
      id: 'rate-down',
      icon: '📉',
      title: 'Ставка −2 п.п.',
      median: rateDown.median,
      realMedian: rateDown.realMedian,
      p5: rateDown.p5,
      impact: `Первый год: +${firstYearReturnDown.toFixed(2)}% (тело растёт по дюрации)`,
      tone: 'positive',
    });
  }

  // 4. Волатильность ×2
  const volShock = runMonteCarloWithModifier(
    baseAnnualReturn,
    volatility * 2,
    horizonYears,
    initialAmount,
    market.inflation,
    (_, r) => r
  );
  scenarios.push({
    id: 'volatility-x2',
    icon: '💥',
    title: 'Волатильность ×2',
    median: volShock.median,
    realMedian: volShock.realMedian,
    p5: volShock.p5,
    impact: `Худший (5%) падает до ${formatMoney(volShock.p5)} ₽`,
    tone: 'neutral',
  });

  // 5. Стагнация — 3 года нулевого роста
  const stagnationYears = 3;
  const stagnation = runMonteCarloWithModifier(
    baseAnnualReturn,
    volatility,
    horizonYears,
    initialAmount,
    market.inflation,
    (year, r) => (year < stagnationYears ? 0 : r)
  );
  scenarios.push({
    id: 'stagnation',
    icon: '🧊',
    title: `Стагнация ${stagnationYears} года`,
    median: stagnation.median,
    realMedian: stagnation.realMedian,
    p5: stagnation.p5,
    impact: `Первые ${stagnationYears} года — нулевой рост`,
    tone: 'negative',
  });

  return {
    baseMedian: base.median,
    baseRealMedian: base.realMedian,
    scenarios,
  };
}