// src/types/market.ts

export interface MarketState {
  keyRate: number;           // Ключевая ставка, %
  keyRateDate: string;       // Когда установлена
  depositRate: number;       // Средняя ставка по вкладам, %
  ofz10y: number;            // Доходность 10-летних ОФЗ, %
  ofzShort: number;          // Доходность коротких ОФЗ (1-3 года), %
  goldPrice: number;         // Золото, руб/грамм
  nextCBDate: string;        // Дата следующего заседания ЦБ
  inflation: number;         // Инфляция, %
  updatedAt: string;
}

export interface Scenario {
  label: 'optimistic' | 'base' | 'pessimistic';
  title: string;
  probability: number;
  outcome: string;
  totalReturn: number;
  isWorseThanDeposit: boolean;
}

export interface PlanRow {
  id: string;
  condition: string;        // «Если ЦБ снижает ставку на 1%»
  action: string;          // «Покупаю длинные ОФЗ на 30%»
  instrument: string;      // «ОФЗ 26218 / 26230»
}

export type InstrumentType = 'ofz' | 'gold' | 'deposit';

export interface InstrumentOption {
  id: InstrumentType;
  icon: string;
  title: string;
  subtitle: string;
}

export interface DecisionEntry {
  id: string;
  date: string;          // ISO
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
}

export interface StatusHistoryEntry {
  date: string;
  status: 'act' | 'wait' | 'do-nothing';
}