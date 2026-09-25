// src/hooks/useKGTransfer.ts
// Хук, который читает ?from=kg при загрузке ЗИ.

import { useEffect, useState } from 'react';
import { parseKGTransfer, type KGTransferData } from '../core/kgTransfer';

const SEEN_KEY = 'gi_kg_transfer_seen_ts';

/** Показываем баннер, только если ссылка свежая (не старше 5 минут). */
const MAX_AGE_MS = 5 * 60 * 1000;

export interface KGTransferState {
  /** Данные от KG, если есть что показывать */
  data: KGTransferData | null;
  /** Пользователь нажал «Позже» или «Принять» */
  dismiss: () => void;
}

export function useKGTransfer(): KGTransferState {
  const [data, setData] = useState<KGTransferData | null>(null);

  useEffect(() => {
    const parsed = parseKGTransfer(window.location.search);
    if (!parsed) return;

    // Отсекаем старые ссылки (если вкладка открыта давно и её перезагрузили).
    if (Date.now() - parsed.ts > MAX_AGE_MS) return;

    // Отсекаем повторный показ для той же самой передачи.
    const seenTs = Number(localStorage.getItem(SEEN_KEY) ?? '0');
    if (seenTs === parsed.ts) return;

    setData(parsed);
  }, []);

  const dismiss = () => {
    if (data) {
      localStorage.setItem(SEEN_KEY, String(data.ts));
    }
    setData(null);
  };

  return { data, dismiss };
}