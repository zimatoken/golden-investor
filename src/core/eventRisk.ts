// src/core/eventRisk.ts

import type { MarketState } from '../data/manualMarket';

/**
 * Уровень событийного риска.
 */
export type EventRiskLevel = 'none' | 'low' | 'medium' | 'high';

export interface EventRisk {
  level: EventRiskLevel;
  daysToCB: number;              // Дней до заседания ЦБ
  cbDate: string;                // Дата заседания
  label: string;                 // «Через 2 дня» / «Через 5 дней» / ...
  message: string;               // Что это значит для решений
  whatToDo: string;              // Что делать
}

/**
 * Считает разницу в днях между сегодня и датой.
 * Если дата в прошлом — возвращает отрицательное число.
 */
export function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso).setHours(0, 0, 0, 0);
  const to = new Date(toIso).setHours(0, 0, 0, 0);
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

/**
 * Форматирование «Через N дней».
 */
function formatDays(days: number): string {
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Завтра';
  if (days === 2) return 'Через 2 дня';
  if (days < 5) return `Через ${days} дня`;
  return `Через ${days} дней`;
}

/**
 * Основная функция: оцениваем событийный риск.
 *
 * Логика:
 * - ≤ 0 дней (сегодня/прошло) — high (решение ЦБ вот-вот / только что)
 * - 1-3 дня — high
 * - 4-7 дней — medium
 * - 8-14 дней — low
 * - > 14 дней — none
 */
export function getEventRisk(market: MarketState): EventRisk {
  const today = new Date().toISOString().slice(0, 10);
  const days = daysBetween(today, market.nextCBDate);
  const label = formatDays(days);

  // Сегодня или уже прошло
  if (days <= 0) {
    return {
      level: 'high',
      daysToCB: days,
      cbDate: market.nextCBDate,
      label: days === 0 ? 'Сегодня' : 'Недавно',
      message: days === 0
        ? 'Сегодня заседание Банка России. Решение может изменить оценку условий.'
        : 'Заседание ЦБ прошло недавно. Обнови данные, если решение уже известно.',
      whatToDo: days === 0
        ? 'Дождись решения ЦБ, прежде чем принимать долгосрочные решения.'
        : 'Обнови ключевую ставку в данных ЦБ, если решение уже опубликовано.',
    };
  }

  // Скоро (1-3 дня)
  if (days <= 3) {
    return {
      level: 'high',
      daysToCB: days,
      cbDate: market.nextCBDate,
      label,
      message: `${label.toLowerCase().replace('через', 'Через')} — заседание Банка России. Текущая оценка может быстро измениться после решения.`,
      whatToDo: 'Не принимай решение только на основании текущего статуса. Дождись решения ЦБ.',
    };
  }

  // Чуть дальше (4-7 дней)
  if (days <= 7) {
    return {
      level: 'medium',
      daysToCB: days,
      cbDate: market.nextCBDate,
      label,
      message: `${label} — заседание ЦБ. Если планируешь долгосрочное решение — учти это.`,
      whatToDo: 'Можно готовить сценарии, но не спеши с исполнением.',
    };
  }

  // Далёкое (8-14 дней)
  if (days <= 14) {
    return {
      level: 'low',
      daysToCB: days,
      cbDate: market.nextCBDate,
      label,
      message: `${label} — заседание ЦБ.`,
      whatToDo: 'Время для подготовки плана.',
    };
  }

  // Ничего близкого
  return {
    level: 'none',
    daysToCB: days,
    cbDate: market.nextCBDate,
    label,
    message: `Следующее заседание ЦБ — ${label.toLowerCase()}.`,
    whatToDo: '',
  };
}