// src/components/KGBanner.tsx
// Баннер «Kapital Garden передал X ₽».

import { formatAmount } from '../core/kgTransfer';
import type { KGTransferData } from '../core/kgTransfer';
import { acceptKGTransfer } from '../core/kgReceived';
import { useDecisionLog } from '../hooks/useDecisionLog';

interface Props {
  data: KGTransferData;
  /** Вызывается после успешного принятия (state + дневник) */
  onAccepted: (amountMinor: number, currency: string) => void;
  onDismiss: () => void;
}

export function KGBanner({ data, onAccepted, onDismiss }: Props) {
  const amountText = formatAmount(data.amountMinor, data.currency);
  const { add } = useDecisionLog();

  const handleAccept = () => {
    // 1. Сохраняем принятую сумму в localStorage ЗИ.
    acceptKGTransfer({
      amountMinor: data.amountMinor,
      currency: data.currency,
      transferTs: data.ts,
    });

    // 2. Пишем запись в Дневник решений — отдельным типом,
    //    чтобы не путать с «buy / sell / wait».
    add({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      actionType: 'kg-received' as const,
      instrument: null,
      amount: data.amountMinor / 100, // в рублях, как везде в дневнике
      reason: 'Получено от Kapital Garden',
      wasInPlan: true, // это не импульс — это осознанное действие
      marketSnapshot: {
        keyRate: 0, // заполним ниже, если понадобится
        inflation: 0,
        status: 'wait',
      },
    });

    // 3. Сообщаем родителю — он покажет toast.
    onAccepted(data.amountMinor, data.currency);
  };

  return (
    <div
      style={{
        margin: '0 0 1rem 0',
        padding: '1rem',
        background: 'var(--card-bg)',
        border: '2px solid var(--success)',
        borderRadius: 12,
        color: 'var(--text)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 14, lineHeight: 1.5 }}>
        🌳 <strong>Kapital Garden</strong> передал{' '}
        <strong style={{ color: 'var(--success)' }}>{amountText}</strong>.
      </div>
      <div style={{ fontSize: 12, color: 'var(--subtext)' }}>
        Принять — сохранить сумму и записать в Дневник. Позже — скрыть баннер.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleAccept}
          style={{
            flex: 1,
            padding: '0.6rem',
            background: 'var(--success)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Принять
        </button>
        <button
          onClick={onDismiss}
          style={{
            flex: 1,
            padding: '0.6rem',
            background: 'transparent',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Позже
        </button>
      </div>
    </div>
  );
}