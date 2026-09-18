// src/types/market.ts
//
// Общие типы. MarketState теперь живёт в data/manualMarket.ts.

export interface Scenario {
  label: 'optimistic' | 'base' | 'pessimistic';
  title: string;
  probability: number;
  outcome: string;
  totalReturn: number;
  isWorseThanDeposit: boolean;
}

/**
 * Целевое поле, за которым следит сценарий карты.
 */
export type PlanTargetField =
  | 'keyRate'
  | 'inflation'
  | 'ofz10y'
  | 'depositRate';

/**
 * Оператор сравнения.
 */
export type PlanOperator = '>' | '<' | '>=' | '<=';

/**
 * Статус сценария в карте.
 */
export type ScenarioStatus =
  | 'far'
  | 'near'
  | 'triggered'
  | 'policy-conflict';

/**
 * Строка плана (карты сценариев).
 */
export interface PlanRow {
  id: string;
  condition: string;
  action: string;
  instrument: string;

  // Опциональное отслеживание срабатывания:
  targetField?: PlanTargetField;
  operator?: PlanOperator;
  targetValue?: number;

  // Метаданные:
  createdAt?: string;
  updatedAt?: string;
  triggeredAt?: string;
}

export type InstrumentType = 'ofz' | 'gold' | 'deposit';

export interface InstrumentOption {
  id: InstrumentType;
  icon: string;
  title: string;
  subtitle: string;
}

/**
 * Результат проверки решения через 30 дней.
 */
export type OutcomeType = 'win' | 'loss' | 'unclear';

export interface DecisionEntry {
  id: string;
  date: string;
  actionType: 'buy' | 'sell' | 'wait';
  instrument: InstrumentType | null;
  amount: number | null;
  reason: string;
  wasInPlan: boolean;
  marketSnapshot: {
    keyRate: number;
    inflation: number;
    status: 'act' | 'wait' | 'do-nothing';
  };

  // ─── НОВЫЕ ПОЛЯ (Фича 4) ──────────────────────
  checkDate?: string;        // Когда проверять (date + 30 дней)
  outcome?: OutcomeType;     // Результат проверки
  checkedAt?: string;        // Когда пользователь ответил (ISO)
  outcomeNote?: string;      // Комментарий пользователя (опционально)

  // ─── v4: связь с Картой (для Trust System) ────
  planRowId?: string;        // ID сценария из Карты, если решение по плану
}

export interface StatusHistoryEntry {
  date: string;
  status: 'act' | 'wait' | 'do-nothing';
}