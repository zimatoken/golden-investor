// src/components/KGToast.tsx
// Всплывающее уведомление «Принято X ₽ · [Куда вложить?]»

import { useEffect } from 'react';
import { formatAmount } from '../core/kgTransfer';

interface Props {
  amountMinor: number;
  currency: string;
  /** Клик по «Куда вложить?» — переход на экран «Действие» */
  onGoToAction: () => void;
  /** Авто-закрытие через N мс (по умолчанию 6000) */
  autoCloseMs?: number;
  onClose: () => void;
}

export function KGToast({
  amountMinor,
  currency,
  onGoToAction,
  autoCloseMs = 6000,
  onClose,
}: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(t);
  }, [autoCloseMs, onClose]);

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 20,
        transform: 'translateX(-50%)',
        zIndex: 1000,
        maxWidth: 460,
        width: 'calc(100% - 32px)',
        padding: '12px 14px',
        background: 'var(--card-bg)',
        border: '2px solid var(--success)',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        color: 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        animation: 'kgToastIn 0.2s ease',
      }}
    >
      <style>{`
        @keyframes kgToastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <span style={{ fontSize: 22 }}>✅</span>

      <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>
        Принято{' '}
        <strong style={{ color: 'var(--success)' }}>
          {formatAmount(amountMinor, currency)}
        </strong>{' '}
        от Kapital Garden
      </div>

      <button
        onClick={onGoToAction}
        style={{
          padding: '6px 10px',
          background: 'var(--primary)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        Куда вложить?
      </button>

      <button
        onClick={onClose}
        aria-label="Закрыть"
        style={{
          padding: '4px 8px',
          background: 'transparent',
          color: 'var(--subtext)',
          border: 'none',
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}