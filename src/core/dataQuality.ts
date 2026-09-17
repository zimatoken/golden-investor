// src/core/dataQuality.ts

import type { MarketState } from '../data/manualMarket';

/**
 * TTL для разных типов данных.
 *
 * Идея: ключевая ставка меняется раз в 6 недель — TTL 45 дней.
 * Yield curve обновляется чаще — TTL 7 дней.
 * Золото — ежедневно — TTL 1 день.
 */
export const DATA_TTL_DAYS: Record<DataFieldKey, number> = {
  keyRate: 45,
  inflation: 45,
  yieldCurve: 7,
  depositRate: 3,
  goldPrice: 1,
  nextCBDate: 90,
  events: 30,
};

export type DataFieldKey =
  | 'keyRate'
  | 'inflation'
  | 'yieldCurve'
  | 'depositRate'
  | 'goldPrice'
  | 'nextCBDate'
  | 'events';

export type FreshnessLevel = 'fresh' | 'warning' | 'stale';

export interface FieldFreshness {
  key: DataFieldKey;
  label: string;
  ageDays: number;
  ttlDays: number;
  level: FreshnessLevel;
}

export interface DataQuality {
  fields: FieldFreshness[];
  /** Сколько полей в норме */
  freshCount: number;
  /** Всего полей */
  totalCount: number;
  /** Общий уровень: worst из всех полей */
  overall: FreshnessLevel;
  /** Сводный текст для UI */
  summaryText: string;
}

const FIELD_LABELS: Record<DataFieldKey, string> = {
  keyRate: 'Ключевая ставка',
  inflation: 'Инфляция',
  yieldCurve: 'Кривая доходности',
  depositRate: 'Ставки по вкладам',
  goldPrice: 'Золото',
  nextCBDate: 'Календарь ЦБ',
  events: 'События',
};

/**
 * Сколько дней прошло с момента даты.
 */
function daysSince(isoDate: string): number {
  const d = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - d) / (1000 * 60 * 60 * 24)));
}

/**
 * Оценка свежести одного поля.
 */
function evaluateField(key: DataFieldKey, ageDays: number): FreshnessLevel {
  const ttl = DATA_TTL_DAYS[key];
  if (ageDays <= ttl) return 'fresh';
  if (ageDays <= ttl * 2) return 'warning';
  return 'stale';
}

/**
 * Общая оценка качества данных.
 *
 * Упрощение v1: используем market.updatedAt как общую дату обновления.
 * В будущем (PHASE 2.2) можно добавить отдельные даты для каждого поля.
 */
export function getDataQuality(market: MarketState): DataQuality {
  const updatedAt = market.updatedAt || new Date().toISOString();
  const age = daysSince(updatedAt);

  const keys: DataFieldKey[] = [
    'keyRate',
    'inflation',
    'yieldCurve',
    'depositRate',
    'goldPrice',
    'nextCBDate',
  ];

  const fields: FieldFreshness[] = keys.map((key) => ({
    key,
    label: FIELD_LABELS[key],
    ageDays: age,
    ttlDays: DATA_TTL_DAYS[key],
    level: evaluateField(key, age),
  }));

  const freshCount = fields.filter((f) => f.level === 'fresh').length;
  const totalCount = fields.length;

  // Overall = worst из всех полей
  const hasStale = fields.some((f) => f.level === 'stale');
  const hasWarning = fields.some((f) => f.level === 'warning');
  const overall: FreshnessLevel = hasStale ? 'stale' : hasWarning ? 'warning' : 'fresh';

  const summaryText =
    overall === 'fresh'
      ? `Данные актуальны (${freshCount} из ${totalCount} полей в норме)`
      : overall === 'warning'
      ? `Данные частично устарели (${freshCount} из ${totalCount} полей в норме)`
      : `Данные устарели (${freshCount} из ${totalCount} полей в норме)`;

  return {
    fields,
    freshCount,
    totalCount,
    overall,
    summaryText,
  };
}