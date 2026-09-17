// src/core/duration.ts

import type { YieldCurvePoint } from '../data/manualMarket';

/**
 * Приблизительная модифицированная дюрация ОФЗ по сроку.
 *
 * Значения — усреднённые для типичных ОФЗ РФ с купоном 6-8%.
 * Точное значение зависит от конкретной облигации, её купона
 * и остаточного срока до погашения.
 *
 * Модифицированная дюрация показывает, на сколько процентов
 * изменится цена облигации при изменении доходности на 1 п.п.
 *
 *   ΔЦена ≈ -Duration × ΔДоходность
 */
export const APPROX_DURATION_BY_MONTHS: Record<number, number> = {
  3:    0.25,
  12:   1.0,
  24:   1.9,
  36:   2.8,
  60:   4.5,
  120:  8.0,
  240:  14.5,
  360:  18.0,
};

/**
 * Оценка дюрации для произвольного срока в месяцах.
 * Если точного значения нет — интерполируем или используем годы / 12.
 */
export function approximateDuration(months: number): number {
  if (APPROX_DURATION_BY_MONTHS[months] !== undefined) {
    return APPROX_DURATION_BY_MONTHS[months];
  }
  // Fallback: годы / 2 — грубое приближение
  return months / 12 / 2;
}

/**
 * Оценка изменения цены облигации при сдвиге доходности.
 *
 * @param duration — модифицированная дюрация
 * @param yieldShiftPct — сдвиг доходности в п.п. (например, +1 или -2)
 * @returns изменение цены в % (например, -8 для +1 п.п. при duration=8)
 */
export function priceChangePct(duration: number, yieldShiftPct: number): number {
  return -duration * yieldShiftPct;
}

/**
 * Одна строка отчёта по дюрации для конкретного срока.
 */
export interface DurationRow {
  months: number;
  label: string;
  yield: number;
  duration: number;
  plus1: number;    // изменение цены при +1 п.п. (%)
  plus2: number;
  minus1: number;
  minus2: number;
}

/**
 * Возвращает таблицу чувствительности для выбранных сроков.
 * По умолчанию — ключевые точки: 1, 5, 10, 30 лет.
 */
export function buildDurationTable(
  curve: YieldCurvePoint[],
  monthsList: number[] = [12, 60, 120, 360],
  labels: Record<number, string> = {}
): DurationRow[] {
  return monthsList
    .map((m) => {
      const point = curve.find((p) => p.months === m);
      if (!point) return null;

      const d = approximateDuration(m);
      return {
        months: m,
        label: labels[m] ?? `${m} мес`,
        yield: point.yield,
        duration: d,
        plus1: priceChangePct(d, 1),
        plus2: priceChangePct(d, 2),
        minus1: priceChangePct(d, -1),
        minus2: priceChangePct(d, -2),
      };
    })
    .filter((row): row is DurationRow => row !== null);
}