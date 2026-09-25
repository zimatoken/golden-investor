// src/core/kgReceived.ts
// Хранилище «принятых от Kapital Garden» сумм.
// Одна активная запись (последняя принятая). История — в Дневнике.

export interface KGReceivedEntry {
  /** Сумма в минорных единицах (копейках) */
  amountMinor: number;
  /** Валюта */
  currency: string;
  /** Метка времени передачи от KG (ts из URL) */
  transferTs: number;
  /** Когда пользователь нажал «Принять» */
  acceptedAt: string; // ISO
}

const STORAGE_KEY = 'gi_kg_received_v1';

/** Прочитать текущую принятую сумму (или null). */
export function loadKGReceived(): KGReceivedEntry | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as KGReceivedEntry;
    if (
      typeof parsed.amountMinor === 'number' &&
      typeof parsed.currency === 'string' &&
      typeof parsed.acceptedAt === 'string'
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Сохранить принятую сумму. */
export function saveKGReceived(entry: KGReceivedEntry): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
}

/** Очистить (например, после того как пользователь распределил). */
export function clearKGReceived(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Принять пакет от KG.
 * 1. Сохраняет в localStorage.
 * 2. Возвращает созданную запись.
 *
 * Запись в Дневник делается отдельно (в компоненте KGBanner),
 * потому что useDecisionLog — хук, и его нельзя вызывать из core/.
 */
export function acceptKGTransfer(params: {
  amountMinor: number;
  currency: string;
  transferTs: number;
}): KGReceivedEntry {
  const entry: KGReceivedEntry = {
    amountMinor: params.amountMinor,
    currency: params.currency,
    transferTs: params.transferTs,
    acceptedAt: new Date().toISOString(),
  };
  saveKGReceived(entry);
  return entry;
}