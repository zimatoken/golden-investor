// src/components/KGBanner.tsx
// Баннер «Kapital Garden передал X ₽».

import { formatAmount } from '../core/kgTransfer';
import type { KGTransferData } from '../core/kgTransfer';

interface Props {
  data: KGTransferData;
  onAccept: () => void;
  onDismiss: () => void;
}

export function KGBanner({ data, onAccept, onDismiss }: Props) {
  const amountText = formatAmount(data.amountMinor, data.currency);

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
        Принять — сохранить сумму для расчётов. Позже — скрыть баннер.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onAccept}
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