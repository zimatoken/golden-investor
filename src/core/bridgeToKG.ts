// src/core/bridgeToKG.ts
//
// Обратный поток ЗИ → KG.
// Пишет в localStorage (общий origin zimatoken.github.io)
// ключ kg_zi_result_v1, который читает Kapital Garden.
//
// ВАЖНО: работает только на проде (один origin).
// Локально localhost:5173 и localhost:5174 — разные origin'ы.

export type KGZIStatus = 'accepted' | 'dismissed' | 'invested';

export interface KGZIResult {
  /** ts из URL — ключ связи с прямым потоком */
  ts: number;
  amountMinor: number;
  currency: string;
  status: KGZIStatus;
  /** Когда ЗИ опубликовал результат */
  updatedAt: string;
  /** Что пользователь сделал (только для status='invested') */
  action?: 'ofz' | 'gold' | 'deposit' | null;
}

const STORAGE_KEY = 'kg_zi_result_v1';

/** Прочитать текущую запись (если есть). */
export function loadKGZIResult(): KGZIResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as KGZIResult;
    if (
      typeof parsed.ts === 'number' &&
      typeof parsed.amountMinor === 'number' &&
      typeof parsed.status === 'string'
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Записать/обновить результат. */
export function publishKGZIResult(result: KGZIResult): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    // ignore — например, localStorage переполнен
  }
}

/** Хелпер: опубликовать «принято». */
export function publishAccepted(params: {
  ts: number;
  amountMinor: number;
  currency: string;
}): void {
  publishKGZIResult({
    ts: params.ts,
    amountMinor: params.amountMinor,
    currency: params.currency,
    status: 'accepted',
    updatedAt: new Date().toISOString(),
  });
}

/** Хелпер: опубликовать «отложено». */
export function publishDismissed(params: {
  ts: number;
  amountMinor: number;
  currency: string;
}): void {
  publishKGZIResult({
    ts: params.ts,
    amountMinor: params.amountMinor,
    currency: params.currency,
    status: 'dismissed',
    updatedAt: new Date().toISOString(),
  });
}

/** Хелпер: опубликовать «вложено». */
export function publishInvested(params: {
  ts: number;
  amountMinor: number;
  currency: string;
  action: 'ofz' | 'gold' | 'deposit';
}): void {
  publishKGZIResult({
    ts: params.ts,
    amountMinor: params.amountMinor,
    currency: params.currency,
    status: 'invested',
    updatedAt: new Date().toISOString(),
    action: params.action,
  });
}