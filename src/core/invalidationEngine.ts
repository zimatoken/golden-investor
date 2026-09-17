// src/core/invalidationEngine.ts

import type { MarketState } from '../data/manualMarket';
import type {
  InvalidationCondition,
  InvalidationField,
  InvalidationOperator,
} from '../types/invalidation';
import { FIELD_LABELS, OPERATOR_LABELS } from '../types/invalidation';

const STORAGE_KEY = 'gi_invalidation_v1';

/**
 * Загрузка условий.
 */
export function loadInvalidations(): InvalidationCondition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.warn('invalidationEngine: ошибка чтения');
  }
  return [];
}

/**
 * Сохранение всех условий.
 */
export function saveInvalidations(list: InvalidationCondition[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/**
 * Добавить условие.
 */
export function addInvalidation(
  field: InvalidationField,
  operator: InvalidationOperator,
  value: number,
  note?: string
): InvalidationCondition {
  const list = loadInvalidations();
  const item: InvalidationCondition = {
    id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    field,
    operator,
    value,
    note,
    createdAt: new Date().toISOString(),
    triggered: false,
  };
  list.push(item);
  saveInvalidations(list);
  return item;
}

/**
 * Удалить условие по id.
 */
export function removeInvalidation(id: string): void {
  const list = loadInvalidations().filter((c) => c.id !== id);
  saveInvalidations(list);
}

/**
 * Обновить условие.
 */
export function updateInvalidation(
  id: string,
  patch: Partial<InvalidationCondition>
): void {
  const list = loadInvalidations().map((c) =>
    c.id === id ? { ...c, ...patch } : c
  );
  saveInvalidations(list);
}

/**
 * Проверка одного условия против текущего значения.
 */
function evaluate(
  current: number,
  operator: InvalidationOperator,
  threshold: number
): boolean {
  switch (operator) {
    case '>': return current > threshold;
    case '<': return current < threshold;
    case '>=': return current >= threshold;
    case '<=': return current <= threshold;
  }
}

/**
 * Текущее значение поля из market.
 */
function getCurrentValue(market: MarketState, field: InvalidationField): number {
  switch (field) {
    case 'inflation': return market.inflation;
    case 'keyRate': return market.keyRate;
    case 'ofz10y': return market.ofz10y;
    case 'depositRate': return market.depositRate;
  }
}

export interface InvalidationCheck {
  condition: InvalidationCondition;
  currentValue: number;
  triggered: boolean;
}

/**
 * Проверка всех условий.
 * Возвращает список с текущим состоянием — но НЕ сохраняет
 * автоматически (чтобы избежать лишних записей в localStorage).
 */
export function checkInvalidations(market: MarketState): InvalidationCheck[] {
  const list = loadInvalidations();
  return list.map((c) => {
    const current = getCurrentValue(market, c.field);
    const triggered = evaluate(current, c.operator, c.value);
    return { condition: c, currentValue: current, triggered };
  });
}

/**
 * Обновление triggered в localStorage (для истории).
 * Вызывается при загрузке StatusScreen, если есть новые срабатывания.
 */
export function syncInvalidations(market: MarketState): InvalidationCheck[] {
  const checks = checkInvalidations(market);
  const list = loadInvalidations();
  let changed = false;
  const updated = list.map((c) => {
    const check = checks.find((x) => x.condition.id === c.id);
    if (!check) return c;

    if (check.triggered && !c.triggered) {
      changed = true;
      return { ...c, triggered: true, triggeredAt: new Date().toISOString() };
    }
    if (!check.triggered && c.triggered) {
      changed = true;
      return { ...c, triggered: false, triggeredAt: undefined };
    }
    return c;
  });

  if (changed) saveInvalidations(updated);
  return checks;
}

/**
 * Человеко-читаемое описание условия.
 */
export function describeCondition(c: InvalidationCondition): string {
  return `${FIELD_LABELS[c.field]} ${OPERATOR_LABELS[c.operator]} ${c.value}%`;
}

/**
 * Проверка: есть ли вообще условия?
 */
export function hasInvalidations(): boolean {
  return loadInvalidations().length > 0;
}