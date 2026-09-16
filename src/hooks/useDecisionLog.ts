// src/hooks/useDecisionLog.ts

import { useCallback, useState } from 'react';
import {
  loadDecisions,
  saveDecision,
  clearDecisions,
  loadStatusHistory,
  pushStatus,
  getStatusMonthAgo,
} from '../core/decisionLog';
import type { DecisionEntry, StatusHistoryEntry } from '../types/market';

export function useDecisionLog() {
  const [decisions, setDecisions] = useState<DecisionEntry[]>(() => loadDecisions());
  const [history, setHistory] = useState<StatusHistoryEntry[]>(() => loadStatusHistory());

  const add = useCallback((entry: DecisionEntry) => {
    saveDecision(entry);
    setDecisions(loadDecisions());
  }, []);

  const clear = useCallback(() => {
    clearDecisions();
    setDecisions([]);
  }, []);

  /**
   * Перечитать дневник из localStorage.
   * Нужно после `recordOutcome` (Фича 4 — проверка исходов).
   */
  const refresh = useCallback(() => {
    setDecisions(loadDecisions());
  }, []);

  const recordStatus = useCallback((status: StatusHistoryEntry['status']) => {
    pushStatus(status);
    setHistory(loadStatusHistory());
  }, []);

  const monthAgo = getStatusMonthAgo();

  return {
    decisions,
    history,
    add,
    clear,
    refresh,
    recordStatus,
    monthAgo,
  };
}