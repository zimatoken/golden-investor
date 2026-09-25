// src/core/kgTransfer.ts
// Парсинг URL-параметров от Kapital Garden.

export interface KGTransferData {
  /** Сумма в минорных единицах (копейках) */
  amountMinor: number;
  /** Валюта, пока только RUB */
  currency: string;
  /** Метка времени, когда KG сформировал ссылку */
  ts: number;
}

/**
 * Читает параметры ?from=kg&amount=...&currency=...&ts=...
 * Возвращает данные или null, если это не передача от KG.
 */
export function parseKGTransfer(search: string): KGTransferData | null {
  const params = new URLSearchParams(search);

  // Главный маркер — from=kg. Без него игнорируем.
  if (params.get('from') !== 'kg') {
    return null;
  }

  const amountRaw = params.get('amount');
  if (!amountRaw) {
    return null;
  }

  const amountMinor = Number(amountRaw);
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    return null;
  }

  // ts необязателен, но полезен для отсечения старых ссылок.
  const tsRaw = params.get('ts');
  const ts = tsRaw ? Number(tsRaw) : Date.now();

  return {
    amountMinor,
    currency: params.get('currency') ?? 'RUB',
    ts: Number.isFinite(ts) ? ts : Date.now(),
  };
}

/**
 * Форматирует минорные единицы в читаемую строку.
 * 5250000 → "52 500 ₽"
 */
export function formatAmount(amountMinor: number, currency: string): string {
  const symbol = currency === 'RUB' ? '₽' : currency;
  const major = amountMinor / 100;
  const formatted = major.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${symbol}`;
}