// src/types/policy.ts

/**
 * Инвестиционная политика пользователя.
 *
 * Задаётся один раз. Используется Decision Engine для
 * проверки: подходит ли сценарий под ТВОЙ горизонт и риски.
 */
export interface InvestmentPolicy {
  horizon: Horizon;
  drawdownTolerance: DrawdownTolerance;
  liquidityNeed: LiquidityNeed;
  goal: Goal;
  experience: Experience;
  /** Когда политика была последний раз изменена (ISO) */
  updatedAt: string;
}

export type Horizon = 'lt1y' | '1-3y' | '3-5y' | '5-10y' | 'gt10y';
export type DrawdownTolerance = 'none' | 'p5' | 'p10' | 'p20' | 'p30';
export type LiquidityNeed = 'high' | 'medium' | 'low';
export type Goal = 'preserve' | 'save' | 'protect-inflation' | 'grow';
export type Experience = 'novice' | 'intermediate' | 'advanced';

/**
 * Дефолтная политика — для новых пользователей.
 * Максимально консервативная: короткий горизонт, нет просадки.
 */
export const DEFAULT_POLICY: InvestmentPolicy = {
  horizon: '1-3y',
  drawdownTolerance: 'p5',
  liquidityNeed: 'high',
  goal: 'preserve',
  experience: 'novice',
  updatedAt: new Date().toISOString(),
};

/**
 * Человеко-читаемые названия для UI.
 */
export const HORIZON_LABELS: Record<Horizon, string> = {
  'lt1y': 'Меньше 1 года',
  '1-3y': '1–3 года',
  '3-5y': '3–5 лет',
  '5-10y': '5–10 лет',
  'gt10y': 'Больше 10 лет',
};

export const DRAWDOWN_LABELS: Record<DrawdownTolerance, string> = {
  'none': 'Не готов к просадке',
  'p5': 'До −5%',
  'p10': 'До −10%',
  'p20': 'До −20%',
  'p30': 'До −30%',
};

export const LIQUIDITY_LABELS: Record<LiquidityNeed, string> = {
  'high': 'Нужна постоянно',
  'medium': 'Иногда',
  'low': 'Могу не трогать',
};

export const GOAL_LABELS: Record<Goal, string> = {
  'preserve': 'Сохранить капитал',
  'save': 'Накопить',
  'protect-inflation': 'Защитить от инфляции',
  'grow': 'Рост капитала',
};

export const EXPERIENCE_LABELS: Record<Experience, string> = {
  'novice': 'Новичок',
  'intermediate': 'Средний',
  'advanced': 'Продвинутый',
};

/**
 * Численное значение допустимой просадки (для Decision Engine).
 */
export const DRAWDOWN_VALUE: Record<DrawdownTolerance, number> = {
  'none': 0,
  'p5': 5,
  'p10': 10,
  'p20': 20,
  'p30': 30,
};

/**
 * Численное значение горизонта в годах.
 */
export const HORIZON_YEARS: Record<Horizon, number> = {
  'lt1y': 0.5,
  '1-3y': 2,
  '3-5y': 4,
  '5-10y': 7,
  'gt10y': 15,
};