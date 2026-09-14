// src/data/manualMarket.ts

export interface MarketState {
  keyRate: number;
  keyRateDate: string;
  depositRate: number;
  ofz10y: number;
  ofzShort: number;
  goldPrice: number;
  nextCBDate: string;
  inflation: number;
  updatedAt: string;
}

// Временные данные на 14.09.2026
export const MANUAL_MARKET: MarketState = {
  keyRate: 14.0,
  keyRateDate: '2026-07-24',
  depositRate: 12.97,
  ofz10y: 15.9,
  ofzShort: 12.5,
  goldPrice: 7850,
  nextCBDate: '2026-09-11',
  inflation: 6.5,
  updatedAt: new Date().toISOString(),
};