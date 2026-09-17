// src/core/planMap.ts

import type {
  PlanRow,
  PlanTargetField,
  PlanOperator,
  ScenarioStatus,
} from '../types/market';
import type { MarketState } from '../data/manualMarket';
import type { InvestmentPolicy } from '../types/policy';
import { HORIZON_YEARS } from '../types/policy';

export interface PlanScenarioStatus {
  row: PlanRow;
  status: ScenarioStatus;
  currentValue: number | null;
  targetValue: number | null;
  distancePct: number | null;   // насколько близко к срабатыванию (0 = сработало)
  policyWarning: string | null; // предупреждение о конфликте с политикой
}

/**
 * Текущее значение поля из market.
 */
function getFieldValue(market: MarketState, field: PlanTargetField): number {
  switch (field) {
    case 'keyRate': return market.keyRate;
    case 'inflation': return market.inflation;
    case 'ofz10y': return market.ofz10y;
    case 'depositRate': return market.depositRate;
  }
}

/**
 * Проверка условия срабатывания.
 */
function isTriggered(
  current: number,
  operator: PlanOperator,
  target: number
): boolean {
  switch (operator) {
    case '>': return current > target;
    case '<': return current < target;
    case '>=': return current >= target;
    case '<=': return current <= target;
  }
}

/**
 * «Дистанция» до срабатывания в % от текущего значения.
 * 0 = сработало.
 */
function computeDistancePct(current: number, target: number): number {
  if (current === 0) return 100;
  return Math.abs(current - target) / Math.abs(current) * 100;
}

/**
 * Проверка на конфликт с политикой.
 *
 * Упрощённая эвристика: если в тексте сценария упоминаются
 * «длинные ОФЗ» или «10+ лет», а горизонт политики < 5 лет — warning.
 */
function checkPolicyConflict(
  row: PlanRow,
  policy: InvestmentPolicy
): string | null {
  const text = (row.condition + ' ' + row.action).toLowerCase();
  const horizonYears = HORIZON_YEARS[policy.horizon] ?? 2;

  const mentionsLong =
    text.includes('длинн') ||
    text.includes('10+') ||
    text.includes('10 лет') ||
    text.includes('10-лет') ||
    text.includes('30 лет');

  if (mentionsLong && horizonYears < 5) {
    return `Горизонт политики — ${horizonYears} лет. Длинные ОФЗ обычно рассчитаны на 5+ лет. Возможно, сценарий не подходит под твои рамки.`;
  }

  return null;
}

/**
 * Вычисляет статус одного сценария.
 */
export function getScenarioStatus(
  row: PlanRow,
  market: MarketState,
  policy: InvestmentPolicy
): PlanScenarioStatus {
  // Конфликт с политикой — приоритетный статус
  const policyWarning = checkPolicyConflict(row, policy);

  // Нет отслеживания — статус «далеко»
  if (!row.targetField || !row.operator || row.targetValue === undefined) {
    return {
      row,
      status: policyWarning ? 'policy-conflict' : 'far',
      currentValue: null,
      targetValue: null,
      distancePct: null,
      policyWarning,
    };
  }

  const currentValue = getFieldValue(market, row.targetField);
  const triggered = isTriggered(currentValue, row.operator, row.targetValue);
  const distancePct = computeDistancePct(currentValue, row.targetValue);

  if (triggered) {
    return {
      row,
      status: 'triggered',
      currentValue,
      targetValue: row.targetValue,
      distancePct: 0,
      policyWarning,
    };
  }

  // Порог «близко» — 5% от текущего значения
  const isNear = distancePct <= 5;

  return {
    row,
    status: policyWarning ? 'policy-conflict' : (isNear ? 'near' : 'far'),
    currentValue,
    targetValue: row.targetValue,
    distancePct,
    policyWarning,
  };
}

/**
 * Группирует сценарии по статусу.
 */
export interface GroupedScenarios {
  triggered: PlanScenarioStatus[];
  near: PlanScenarioStatus[];
  conflicts: PlanScenarioStatus[];
  far: PlanScenarioStatus[];
  total: number;
}

export function groupScenarios(
  rows: PlanRow[],
  market: MarketState,
  policy: InvestmentPolicy
): GroupedScenarios {
  const all = rows.map((r) => getScenarioStatus(r, market, policy));

  return {
    triggered: all.filter((s) => s.status === 'triggered'),
    near: all.filter((s) => s.status === 'near'),
    conflicts: all.filter((s) => s.status === 'policy-conflict'),
    far: all.filter((s) => s.status === 'far'),
    total: all.length,
  };
}

/**
 * Человеко-читаемые названия полей.
 */
export const FIELD_LABELS: Record<PlanTargetField, string> = {
  keyRate: 'Ключевая ставка',
  inflation: 'Инфляция',
  ofz10y: 'Доходность 10Y ОФЗ',
  depositRate: 'Ставка по вкладам',
};

/**
 * Человеко-читаемые названия операторов.
 */
export const OPERATOR_LABELS: Record<PlanOperator, string> = {
  '>': 'больше',
  '<': 'меньше',
  '>=': 'больше или равно',
  '<=': 'меньше или равно',
};

/**
 * Описание условия срабатывания.
 */
export function describeTarget(row: PlanRow): string | null {
  if (!row.targetField || !row.operator || row.targetValue === undefined) {
    return null;
  }
  return `${FIELD_LABELS[row.targetField]} ${OPERATOR_LABELS[row.operator]} ${row.targetValue}%`;
}