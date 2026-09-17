// src/core/investmentPolicy.ts

import {
  DEFAULT_POLICY,
  type InvestmentPolicy,
} from '../types/policy';

const STORAGE_KEY = 'gi_policy_v1';

/**
 * Загрузка политики из localStorage.
 * Если нет или битая — возвращает DEFAULT_POLICY.
 */
export function loadPolicy(): InvestmentPolicy {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_POLICY;
    const parsed = JSON.parse(raw);
    // Простая валидация: должны быть все поля
    if (
      typeof parsed.horizon === 'string' &&
      typeof parsed.drawdownTolerance === 'string' &&
      typeof parsed.liquidityNeed === 'string' &&
      typeof parsed.goal === 'string' &&
      typeof parsed.experience === 'string'
    ) {
      return parsed as InvestmentPolicy;
    }
  } catch (e) {
    console.warn('investmentPolicy: ошибка чтения, используем DEFAULT_POLICY');
  }
  return DEFAULT_POLICY;
}

/**
 * Сохранение политики.
 */
export function savePolicy(policy: InvestmentPolicy): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(policy));
}

/**
 * Проверка: настроена ли политика пользователем.
 * Если updatedAt совпадает с DEFAULT_POLICY.updatedAt на момент старта — значит, не настроена.
 * Проще: смотрим, есть ли ключ в localStorage.
 */
export function isPolicyConfigured(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Сброс к дефолту.
 */
export function resetPolicy(): void {
  localStorage.removeItem(STORAGE_KEY);
}