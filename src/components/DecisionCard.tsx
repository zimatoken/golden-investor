// src/components/DecisionCard.tsx

import type { DecisionEntry } from '../types/market';
import { formatAmount } from '../core/kgTransfer';

interface Props {
  entry: DecisionEntry;
}

const INSTRUMENT_LABEL: Record<string, string> = {
  ofz: '📈 ОФЗ',
  gold: '🥇 Золото',
  deposit: '🏦 Вклад',
};

const STATUS_LABEL: Record<string, string> = {
  act: '🟢 Действовать',
  wait: '🟡 Ждать',
  'do-nothing': '🔴 Не действовать',
};

const ACTION_LABEL: Record<string, string> = {
  buy: 'Покупка',
  sell: 'Продажа',
  wait: 'Ожидание',
  'kg-received': 'Получено от Kapital Garden',
};

export function DecisionCard({ entry }: Props) {
  const date = new Date(entry.date);
  const dateStr = date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isPlan = entry.wasInPlan;
  const isKGReceived = entry.actionType === 'kg-received';

  /* ─── Отдельный рендер для «Получено от Kapital Garden» ─── */
  if (isKGReceived) {
    // Сумма: amount хранится в рублях (не в копейках).
    const amountRub = entry.amount ?? 0;
    const amountMinor = amountRub * 100;
    const amountText = formatAmount(amountMinor, 'RUB');

    return (
      <div
        style={{
          padding: '1rem 1.25rem',
          background: 'rgba(34,197,94,0.05)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderLeft: '4px solid var(--success)',
          borderRadius: 12,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--subtext)' }}>
            {dateStr} · {timeStr}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              background: 'var(--success)',
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            ✓ По плану
          </div>
        </div>

        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 4,
            color: 'var(--heading)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>📥</span>
          <span>Получено от Kapital Garden</span>
        </div>

        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--success)',
            marginBottom: 4,
            letterSpacing: '-0.01em',
          }}
        >
          {amountText}
        </div>

        <div
          style={{
            fontSize: 12,
            color: 'var(--subtext)',
            lineHeight: 1.5,
          }}
        >
          Свободные средства. Распредели через экран{' '}
          <strong style={{ color: 'var(--text-soft)' }}>⚡ Действие</strong>.
        </div>
      </div>
    );
  }

  /* ─── Обычный рендер для buy / sell / wait ─── */
  const instrumentLabel = entry.instrument
    ? INSTRUMENT_LABEL[entry.instrument]
    : null;

  // Заголовок: «📈 ОФЗ · Покупка» или «Ожидание»
  const titleParts: string[] = [];
  if (instrumentLabel) titleParts.push(instrumentLabel);
  titleParts.push(ACTION_LABEL[entry.actionType] ?? entry.actionType);
  const title = titleParts.join(' · ');

  return (
    <div
      style={{
        padding: '1rem 1.25rem',
        background: isPlan ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
        border: '1px solid',
        borderColor: isPlan ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
        borderLeft: `4px solid ${isPlan ? 'var(--success)' : 'var(--danger)'}`,
        borderRadius: 12,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--subtext)' }}>
          {dateStr} · {timeStr}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 6,
            background: isPlan ? 'var(--success)' : 'var(--danger)',
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {isPlan ? '✓ По плану' : '⚡ Импульс'}
        </div>
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 6,
          color: 'var(--heading)',
        }}
      >
        {title}
      </div>

      {entry.amount != null && entry.amount > 0 && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: 6,
          }}
        >
          {entry.amount.toLocaleString('ru-RU')} ₽
        </div>
      )}

      <div style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 6 }}>
        <strong>Причина:</strong> {entry.reason}
      </div>

      <div
        style={{
          fontSize: 12,
          color: 'var(--subtext-muted)',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <span>Ставка: {entry.marketSnapshot.keyRate}%</span>
        <span>Инфляция: {entry.marketSnapshot.inflation}%</span>
        <span>{STATUS_LABEL[entry.marketSnapshot.status]}</span>
      </div>
    </div>
  );
}