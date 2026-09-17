// src/types/invalidation.ts

/**
 * Поля, за которыми следим.
 */
export type InvalidationField =
  | 'inflation'
  | 'keyRate'
  | 'ofz10y'
  | 'depositRate';

/**
 * Оператор сравнения.
 */
export type InvalidationOperator = '>' | '<' | '>=' | '<=';

/**
 * Условие отмены сценария.
 *
 * Пример: «Если инфляция > 8% — пересмотрю решение».
 */
export interface InvalidationCondition {
  id: string;
  field: InvalidationField;
  operator: InvalidationOperator;
  value: number;
  note?: string;                // Свободный комментарий
  createdAt: string;            // ISO
  /** Уже сработало? — устанавливается при проверке */
  triggered: boolean;
  /** Когда сработало (ISO) */
  triggeredAt?: string;
}

/**
 * Человеко-читаемые названия полей.
 */
export const FIELD_LABELS: Record<InvalidationField, string> = {
  inflation: 'Инфляция',
  keyRate: 'Ключевая ставка',
  ofz10y: 'Доходность 10Y ОФЗ',
  depositRate: 'Ставка по вкладам',
};

/**
 * Единицы измерения.
 */
export const FIELD_UNITS: Record<InvalidationField, string> = {
  inflation: '%',
  keyRate: '%',
  ofz10y: '%',
  depositRate: '%',
};

/**
 * Операторы с человеко-читаемым текстом.
 */
export const OPERATOR_LABELS: Record<InvalidationOperator, string> = {
  '>': 'больше',
  '<': 'меньше',
  '>=': 'больше или равно',
  '<=': 'меньше или равно',
};