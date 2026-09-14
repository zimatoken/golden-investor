// src/components/DecisionCard.tsx

import type { DecisionEntry } from '../types/market';

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

  return (
    <div
      style={{
        padding: '1rem 1.25rem',
        background: isPlan ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
        border: '1px solid',
        borderColor: isPlan ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
        borderLeft: `4px solid ${isPlan ? '#22c55e' : '#ef4444'}`,
        borderRadius: 12,
        marginBottom: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: '#64748b' }}>
          {dateStr} · {timeStr}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 6,
            background: isPlan ? '#22c55e' : '#ef4444',
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {isPlan ? '✓ По плану' : '⚡ Импульс'}
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
        {entry.instrument ? INSTRUMENT_LABEL[entry.instrument] : 'Действие'}
        {entry.actionType === 'sell' && ' · Продажа'}
      </div>

      <div style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}>
        <strong>Причина:</strong> {entry.reason}
      </div>

      <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span>Ставка: {entry.marketSnapshot.keyRate}%</span>
        <span>Инфляция: {entry.marketSnapshot.inflation}%</span>
        <span>{STATUS_LABEL[entry.marketSnapshot.status]}</span>
      </div>
    </div>
  );
}