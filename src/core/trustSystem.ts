// src/core/trustSystem.ts
// PHASE 6.2 — Trust System: насколько пользователь следует своему плану.
// Чистые функции. Не импортирует UI. Без localStorage.

import type { PlanRow, DecisionEntry } from '../types/market';
import type { MarketState } from '../data/manualMarket';
import type { InvestmentPolicy } from '../types/policy';
import { groupScenarios, type PlanScenarioStatus } from './planMap';

/** Минимум сработавших сценариев для расчёта trustScore. */
export const MIN_TRIGGERED_FOR_SCORE = 3;

/** Сколько дней ждём решение после срабатывания сценария. */
export const FOLLOWUP_WINDOW_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;
const FOLLOWUP_WINDOW_MS = FOLLOWUP_WINDOW_DAYS * DAY_MS;

export type FollowupState = 'completed' | 'pending' | 'ignored';

/**
 * Статус «реакции» на один сработавший сценарий.
 */
export interface ScenarioFollowup {
  row: PlanRow;
  status: PlanScenarioStatus;
  triggeredDaysAgo: number | null;
  linkedDecision: DecisionEntry | null;
  followup: FollowupState;
}

/**
 * Сценарий, который сработал, но решения в Дневнике нет
 * и окно ожидания (7 дней) прошло.
 */
export interface IgnoredScenario {
  row: PlanRow;
  triggeredDaysAgo: number;
}

/**
 * Итоговый отчёт Trust System.
 */
export interface TrustReport {
  total: number;
  triggered: number;
  conflicts: number;
  completed: number;
  pending: number;
  ignored: IgnoredScenario[];
  trustScore: number | null;
  hasEnoughData: boolean;
}

function daysBetween(fromMs: number, toMs: number): number {
  return Math.max(0, Math.floor((toMs - fromMs) / DAY_MS));
}

/**
 * Связывает сработавший сценарий с решением из Дневника.
 *
 * Уровень 1: точная связка по planRowId (сейчас не пишется — PHASE 6.3).
 * Уровень 2: решение с wasInPlan === true в окне [triggeredAt, +7 дней].
 * Уровень 3: triggeredAt не записан — не можем судить, статус 'pending'.
 */
export function resolveFollowup(
  scenario: PlanScenarioStatus,
  decisions: DecisionEntry[],
  now: number = Date.now()
): ScenarioFollowup {
  const { row } = scenario;

  if (!row.triggeredAt) {
    return {
      row,
      status: scenario,
      triggeredDaysAgo: null,
      linkedDecision: null,
      followup: 'pending',
    };
  }

  const triggeredMs = new Date(row.triggeredAt).getTime();
  const windowEnd = triggeredMs + FOLLOWUP_WINDOW_MS;

  const byId = decisions.find((d) => d.planRowId === row.id);

  const byWindow =
    byId ??
    decisions.find((d) => {
      if (!d.wasInPlan) return false;
      const t = new Date(d.date).getTime();
      return t >= triggeredMs && t <= windowEnd;
    });

  const daysAgo = daysBetween(triggeredMs, now);

  if (byWindow) {
    return {
      row,
      status: scenario,
      triggeredDaysAgo: daysAgo,
      linkedDecision: byWindow,
      followup: 'completed',
    };
  }

  if (now <= windowEnd) {
    return {
      row,
      status: scenario,
      triggeredDaysAgo: daysAgo,
      linkedDecision: null,
      followup: 'pending',
    };
  }

  return {
    row,
    status: scenario,
    triggeredDaysAgo: daysAgo,
    linkedDecision: null,
    followup: 'ignored',
  };
}

/**
 * Главная функция: считает TrustReport по Карте, рынку и Дневнику.
 */
export function computeTrust(
  rows: PlanRow[],
  market: MarketState,
  policy: InvestmentPolicy,
  decisions: DecisionEntry[],
  now: number = Date.now()
): TrustReport {
  const groups = groupScenarios(rows, market, policy);

  const followups = groups.triggered.map((s) =>
    resolveFollowup(s, decisions, now)
  );

  const completed = followups.filter((f) => f.followup === 'completed').length;
  const pending = followups.filter((f) => f.followup === 'pending').length;

  const ignored: IgnoredScenario[] = [];
  for (const f of followups) {
    if (f.followup === 'ignored' && f.triggeredDaysAgo !== null) {
      ignored.push({ row: f.row, triggeredDaysAgo: f.triggeredDaysAgo });
    }
  }

  const hasEnoughData = groups.triggered.length >= MIN_TRIGGERED_FOR_SCORE;
  const trustScore = hasEnoughData
    ? Math.round((completed / groups.triggered.length) * 100)
    : null;

  return {
    total: groups.total,
    triggered: groups.triggered.length,
    conflicts: groups.conflicts.length,
    completed,
    pending,
    ignored,
    trustScore,
    hasEnoughData,
  };
}

/**
 * Сценарии, на которые пользователь не отреагировал.
 */
export function getIgnoredScenarios(report: TrustReport): IgnoredScenario[] {
  return report.ignored;
}