// src/data/manualMarket.ts

export interface MarketState {
  keyRate: number;           // Ключевая ставка ЦБ, %
  keyRateDate: string;       // ← ДОБАВЬ ЭТУ СТРОКУ (когда ставка установлена)
  inflation: number;         // Инфляция, %
  ofz10y: number;            // Доходность 10-летних ОФЗ, %
  ofzShort: number;          // Доходность коротких ОФЗ, %
  depositRate: number;       // Средняя ставка по вкладам, %
  goldPrice: number;         // Золото, руб/грамм
  nextCBDate: string;        // Дата следующего заседания ЦБ, YYYY-MM-DD
  updatedAt: string;         // Когда обновлено (ISO)
}

/**
 * Данные по умолчанию. Используются при первом запуске.
 * Пользователь может обновить их через UI.
 */
export const DEFAULT_MARKET: MarketState = {
  keyRate: 14.0,
  keyRateDate: '2026-09-16', 
  inflation: 6.5,
  ofz10y: 15.9,
  ofzShort: 12.5,
  depositRate: 12.97,
  goldPrice: 7850,
  nextCBDate: '2026-10-24',
  updatedAt: new Date().toISOString(),
};

/**
 * Демо-данные. Оставлено для совместимости со старым кодом.
 * @deprecated Используй useMarketData()
 */
export const MANUAL_MARKET = DEFAULT_MARKET;