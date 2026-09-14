// src/core/decisionLog.ts

import type { DecisionEntry, StatusHistoryEntry } from '../types/market';

const LOG_KEY = 'gi_decision_log_v1';
const HISTORY_KEY = 'gi_status_history_v1';

/* ─── Дневник решений ────────────────────── */

export function loadDecisions(): DecisionEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDecision(entry: DecisionEntry): void {
  const log = loadDecisions();
  log.push(entry);
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

export function clearDecisions(): void {
  localStorage.removeItem(LOG_KEY);
}

/* ─── История статусов ───────────────────── */

export function loadStatusHistory(): StatusHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushStatus(status: StatusHistoryEntry['status']): void {
  const history = loadStatusHistory();
  const today = new Date().toISOString().slice(0, 10);
  const last = history[history.length - 1];

  // Если сегодня уже записан — не дублируем
  if (last && last.date.slice(0, 10) === today) {
    if (last.status !== status) {
      history[history.length - 1] = { date: new Date().toISOString(), status };
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
    return;
  }

  history.push({ date: new Date().toISOString(), status });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * Находит статус «месяц назад» — ближайшую запись ~30 дней назад.
 */
export function getStatusMonthAgo(): StatusHistoryEntry | null {
  const history = loadStatusHistory();
  if (history.length === 0) return null;

  const target = Date.now() - 30 * 24 * 60 * 60 * 1000;

  let closest: StatusHistoryEntry | null = null;
  let minDiff = Infinity;

  for (const entry of history) {
    const diff = Math.abs(new Date(entry.date).getTime() - target);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }

  return closest;
}

/* ─── Анализ дневника ────────────────────── */

export interface DecisionStats {
  total: number;
  inPlan: number;
  impulsive: number;
  byInstrument: Record<string, number>;
  byActionType: Record<string, number>;
  disciplineScore: number;  // 0–100
  firstDecisionDate: string | null;
  lastDecisionDate: string | null;
}

export function analyzeDecisions(decisions: DecisionEntry[]): DecisionStats {
  const total = decisions.length;
  const inPlan = decisions.filter((d) => d.wasInPlan).length;
  const impulsive = total - inPlan;

  const byInstrument: Record<string, number> = {};
  const byActionType: Record<string, number> = {};

  for (const d of decisions) {
    if (d.instrument) {
      byInstrument[d.instrument] = (byInstrument[d.instrument] || 0) + 1;
    }
    byActionType[d.actionType] = (byActionType[d.actionType] || 0) + 1;
  }

  const disciplineScore = total > 0 ? Math.round((inPlan / total) * 100) : 0;

  const sorted = [...decisions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return {
    total,
    inPlan,
    impulsive,
    byInstrument,
    byActionType,
    disciplineScore,
    firstDecisionDate: sorted[0]?.date || null,
    lastDecisionDate: sorted[sorted.length - 1]?.date || null,
  };
}

/* ─── Фильтрация ─────────────────────────── */

export type DecisionFilter = 'all' | 'in-plan' | 'impulsive';

export function filterDecisions(
  decisions: DecisionEntry[],
  filter: DecisionFilter
): DecisionEntry[] {
  const sorted = [...decisions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (filter === 'in-plan') return sorted.filter((d) => d.wasInPlan);
  if (filter === 'impulsive') return sorted.filter((d) => !d.wasInPlan);
  return sorted;
}

/* ─── Группировка по месяцам ─────────────── */

export interface MonthlyGroup {
  month: string;      // "Сентябрь 2026"
  key: string;        // "2026-09"
  decisions: DecisionEntry[];
}

export function groupByMonth(decisions: DecisionEntry[]): MonthlyGroup[] {
  const groups: Record<string, DecisionEntry[]> = {};

  for (const d of decisions) {
    const date = new Date(d.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  }

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ];

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => {
      const [year, month] = key.split('-');
      return {
        key,
        month: `${monthNames[parseInt(month, 10) - 1]} ${year}`,
        decisions: items.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      };
    });
}

/* ─── Экспорт в JSON ─────────────────────── */

export function exportDecisions(): void {
  const decisions = loadDecisions();
  const stats = analyzeDecisions(decisions);
  const payload = {
    exportedAt: new Date().toISOString(),
    stats,
    decisions,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `golden-investor-decisions-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}