// src/core/decisionEngine.ts

import type { MarketState } from '../data/manualMarket';
import type { InvestmentPolicy } from '../types/policy';
import type { MarketRegime } from './marketRegime';
import type { DataQuality } from './dataQuality';
import type { EventRisk } from './eventRisk';
import { HORIZON_YEARS, DRAWDOWN_VALUE } from '../types/policy';

/**
 * Статус сценария.
 *
 * ВАЖНО: это НЕ BUY/SELL. Это оценка соответствия
 * сценария политике пользователя.
 */
export type ScenarioStatus =
  | 'SUPPORTED'          // Условия + политика совпадают
  | 'PARTIAL'            // Есть за, есть против
  | 'WAIT'               // Условия не сформированы
  | 'INVALID'            // Политика противоречит сценарию
  | 'INSUFFICIENT_DATA'; // Данных мало / устарели

export interface DecisionFactor {
  text: string;          // «Доходность 10Y > вклад на 3.39%»
  tone: 'positive' | 'negative' | 'neutral';
}

export interface DecisionAssessment {
  instrument: 'ofz-long';
  instrumentLabel: string;
  status: ScenarioStatus;
  statusLabel: string;
  statusIcon: string;
  supports: DecisionFactor[];     // Что поддерживает
  obstacles: DecisionFactor[];    // Что мешает
  nextSteps: string[];            // Что дальше
  disclaimer: string;             // «Это не рекомендация...»
}

export interface DecisionInput {
  market: MarketState;
  regime: MarketRegime;
  dataQuality: DataQuality;
  eventRisk: EventRisk;
  policy: InvestmentPolicy;
}

/**
 * Длинные ОФЗ — 10 лет и больше.
 * Порог: 8% при +1% ставки (см. DurationRisk).
 */
const LONG_OFZ_DURATION_THRESHOLD = 8;

/**
 * Оценка сценария «Длинные ОФЗ».
 */
export function assessLongOFZ(input: DecisionInput): DecisionAssessment {
  const { market, regime, dataQuality, eventRisk, policy } = input;

  const supports: DecisionFactor[] = [];
  const obstacles: DecisionFactor[] = [];
  const nextSteps: string[] = [];

  // ─── 1. РЫНОК: что говорит среда ─────────────

  // Spread ОФЗ vs вклад
  const spread = market.ofz10y - market.depositRate;
  if (spread >= 3) {
    supports.push({
      text: `Доходность 10Y ОФЗ ${market.ofz10y}% выше вклада ${market.depositRate}% на ${spread.toFixed(2)} п.п.`,
      tone: 'positive',
    });
  } else if (spread >= 1.5) {
    supports.push({
      text: `Доходность 10Y ОФЗ ${market.ofz10y}% выше вклада ${market.depositRate}% на ${spread.toFixed(2)} п.п. — но разница небольшая.`,
      tone: 'neutral',
    });
  } else {
    obstacles.push({
      text: `Доходность 10Y ОФЗ ${market.ofz10y}% — разница с вкладом ${market.depositRate}% всего ${spread.toFixed(2)} п.п.`,
      tone: 'negative',
    });
  }

  // Реальная ставка
  const realKeyRate = market.keyRate - market.inflation;
  if (realKeyRate > 2) {
    supports.push({
      text: `Реальная ключевая ставка: +${realKeyRate.toFixed(2)} п.п. — положительная.`,
      tone: 'positive',
    });
  } else if (realKeyRate < 0) {
    obstacles.push({
      text: `Реальная ключевая ставка отрицательная: ${realKeyRate.toFixed(2)} п.п.`,
      tone: 'negative',
    });
  }

  // Режим рынка
  if (regime.type === 'HIGH_RATES_DISINFLATION') {
    supports.push({
      text: `Режим рынка: ${regime.label} — классическая среда для длинных ОФЗ.`,
      tone: 'positive',
    });
  } else if (regime.type === 'INFLATION_SHOCK') {
    obstacles.push({
      text: `Режим рынка: ${regime.label} — длинные ОФЗ уязвимы при инфляции.`,
      tone: 'negative',
    });
  } else if (regime.type === 'HIGH_RATES_STICKY') {
    obstacles.push({
      text: `Режим рынка: ${regime.label} — ЦБ может ещё держать ставку высокой.`,
      tone: 'neutral',
    });
  } else if (regime.type === 'CURVE_INVERTED_OR_FLAT') {
    obstacles.push({
      text: `Режим рынка: ${regime.label} — рынок в неопределённости.`,
      tone: 'neutral',
    });
  }

  // ─── 2. ПОЛИТИКА: подходит ли пользователю ───

  const horizonYears = HORIZON_YEARS[policy.horizon];
  if (horizonYears >= 5) {
    supports.push({
      text: `Твой горизонт (${policy.horizon}) — подходит для длинных ОФЗ.`,
      tone: 'positive',
    });
  } else if (horizonYears >= 3) {
    supports.push({
      text: `Твой горизонт (${policy.horizon}) — на грани. Длинные ОФЗ требуют терпения.`,
      tone: 'neutral',
    });
  } else {
    obstacles.push({
      text: `Твой горизонт (${policy.horizon}) — короткий. Если ставка не упадёт вовремя, не успеешь получить эффект.`,
      tone: 'negative',
    });
  }

  const drawdownPct = DRAWDOWN_VALUE[policy.drawdownTolerance];
  if (drawdownPct >= LONG_OFZ_DURATION_THRESHOLD) {
    supports.push({
      text: `Твоя просадка (до −${drawdownPct}%) покрывает −${LONG_OFZ_DURATION_THRESHOLD}% при +1% ставки.`,
      tone: 'positive',
    });
  } else {
    obstacles.push({
      text: `Твоя просадка (до −${drawdownPct}%) может не покрыть −${LONG_OFZ_DURATION_THRESHOLD}% при +1% ставки.`,
      tone: 'negative',
    });
  }

  // Ликвидность
  if (policy.liquidityNeed === 'low') {
    supports.push({
      text: `Ликвидность: можешь не трогать деньги — подходит для ОФЗ.`,
      tone: 'positive',
    });
  } else if (policy.liquidityNeed === 'high') {
    obstacles.push({
      text: `Ликвидность: нужна постоянно — длинные ОФЗ неудобны.`,
      tone: 'negative',
    });
  }

  // ─── 3. EVENT RISK ───────────────────────────

  if (eventRisk.level === 'high') {
    obstacles.push({
      text: `${eventRisk.label} — заседание ЦБ. Оценка может быстро измениться.`,
      tone: 'negative',
    });
    nextSteps.push('Дождись решения ЦБ, прежде чем действовать.');
  } else if (eventRisk.level === 'medium') {
    obstacles.push({
      text: `${eventRisk.label} — заседание ЦБ. Можно готовить план, но не спеши.`,
      tone: 'neutral',
    });
  }

  // ─── 4. DATA QUALITY ────────────────────────

  if (dataQuality.overall === 'stale') {
    obstacles.push({
      text: `Данные устарели (${dataQuality.freshCount} из ${dataQuality.totalCount} в норме).`,
      tone: 'negative',
    });
  } else if (dataQuality.overall === 'warning') {
    obstacles.push({
      text: `Данные частично устарели (${dataQuality.freshCount} из ${dataQuality.totalCount} в норме).`,
      tone: 'neutral',
    });
  }

  // ─── 5. ИТОГОВЫЙ СТАТУС ─────────────────────

  let status: ScenarioStatus;
  let statusLabel: string;
  let statusIcon: string;

  const negatives = obstacles.filter((o) => o.tone === 'negative').length;
  const positives = supports.filter((s) => s.tone === 'positive').length;

  if (dataQuality.overall === 'stale') {
    status = 'INSUFFICIENT_DATA';
    statusLabel = 'Недостаточно данных';
    statusIcon = '❓';
  } else if (negatives >= 2 || (negatives >= 1 && positives === 0)) {
    status = 'INVALID';
    statusLabel = 'Сценарий противоречит политике';
    statusIcon = '❌';
  } else if (positives >= 3 && negatives === 0) {
    status = 'SUPPORTED';
    statusLabel = 'Сценарий поддерживается';
    statusIcon = '✅';
  } else if (positives >= 1 && negatives <= 1) {
    status = 'PARTIAL';
    statusLabel = 'Сценарий частично подходит';
    statusIcon = '⚠️';
  } else {
    status = 'WAIT';
    statusLabel = 'Подождать';
    statusIcon = '⏸';
  }

  // ─── 6. NEXT STEPS ───────────────────────────

  if (status === 'SUPPORTED') {
    nextSteps.push('Проверь «🗺 Карта» — если там записан сценарий — можешь сверяться с ним.');
    nextSteps.push('Запиши решение в «📖 Дневник», чтобы через 30 дней проверить.');
  } else if (status === 'PARTIAL') {
    nextSteps.push('Открой «🗺 Карта» и запиши сценарий: при каких условиях ты будешь действовать.');
    nextSteps.push('Пересмотри свою политику — возможно, нужно скорректировать горизонт.');
  } else if (status === 'INVALID') {
    nextSteps.push('Твоя политика не подходит под этот сценарий. Рассмотри вклад или короткие ОФЗ.');
    nextSteps.push('Или измени политику, если готов к большему риску.');
  } else if (status === 'WAIT') {
    nextSteps.push('Дождись, пока условия сформируются. Следи за данными ЦБ.');
  } else {
    nextSteps.push('Обнови данные ЦБ. Без свежих данных анализ невозможен.');
  }

  return {
    instrument: 'ofz-long',
    instrumentLabel: 'Длинные ОФЗ (10Y)',
    status,
    statusLabel,
    statusIcon,
    supports,
    obstacles,
    nextSteps,
    disclaimer:
      'Это не рекомендация. Это оценка соответствия сценария твоей политике. Решение — за тобой.',
  };
}