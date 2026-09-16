// src/components/OutcomeCheck.tsx

import { useState } from 'react';
import { recordOutcome } from '../core/decisionLog';
import type { DecisionEntry, OutcomeType } from '../types/market';

interface Props {
  pending: DecisionEntry[];
  onRecorded: () => void;   // Колбэк после записи outcome
}

const INSTRUMENT_LABELS: Record<string, string> = {
  ofz: '📈 ОФЗ',
  gold: '🥇 Золото',
  deposit: '🏦 Вклад',
};

export function OutcomeCheck({ pending, onRecorded }: Props) {
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  if (pending.length === 0) return null;

  const handleOutcome = (id: string, outcome: OutcomeType, note?: string) => {
    recordOutcome(id, outcome, note);
    setExpandedNote(null);
    setNoteDraft('');
    onRecorded();
  };

  return (
    <div
      style={{
        marginBottom: '1.5rem',
        padding: '1rem 1.25rem',
        background: 'rgba(59,130,246,0.06)',
        border: '2px solid var(--primary)',
        borderRadius: 12,
        color: 'var(--text)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        🔔 Пора проверить решения ({pending.length})
      </div>

      {pending.map((entry) => (
        <PendingItem
          key={entry.id}
          entry={entry}
          expanded={expandedNote === entry.id}
          noteDraft={noteDraft}
          onExpand={() => {
            setExpandedNote(entry.id);
            setNoteDraft('');
          }}
          onCancelExpand={() => setExpandedNote(null)}
          onNoteChange={setNoteDraft}
          onOutcome={(outcome) =>
            handleOutcome(entry.id, outcome, expandedNote === entry.id ? noteDraft : undefined)
          }
        />
      ))}
    </div>
  );
}

/* ─── Карточка одного решения ─────────── */

function PendingItem({
  entry,
  expanded,
  noteDraft,
  onExpand,
  onCancelExpand,
  onNoteChange,
  onOutcome,
}: {
  entry: DecisionEntry;
  expanded: boolean;
  noteDraft: string;
  onExpand: () => void;
  onCancelExpand: () => void;
  onNoteChange: (v: string) => void;
  onOutcome: (o: OutcomeType) => void;
}) {
  const date = new Date(entry.date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const instrument = entry.instrument ? INSTRUMENT_LABELS[entry.instrument] : 'Действие';
  const amount = entry.amount ? `${entry.amount.toLocaleString('ru-RU')} ₽` : '—';

  const daysSince = Math.floor(
    (Date.now() - new Date(entry.date).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      style={{
        padding: '0.85rem 1rem',
        background: 'var(--card-bg)',
        borderRadius: 10,
        marginBottom: 8,
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: 'var(--subtext)' }}>
          📅 {date}
        </div>
        <div style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 600 }}>
          ⏱ Прошло {daysSince} дн.
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)', marginBottom: 4 }}>
        {instrument} · {amount}
      </div>

      <div style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 12 }}>
        «{entry.reason}»
      </div>

      {!expanded ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <OutcomeButton
            label="🟢 Сработало"
            color="var(--success)"
            onClick={() => onOutcome('win')}
          />
          <OutcomeButton
            label="🔴 Не сработало"
            color="var(--danger)"
            onClick={() => onOutcome('loss')}
          />
          <OutcomeButton
            label="⚪ Сложно сказать"
            color="var(--subtext)"
            onClick={() => onOutcome('unclear')}
          />
          <button
            onClick={onExpand}
            style={{
              padding: '0.4rem 0.6rem',
              background: 'transparent',
              color: 'var(--subtext)',
              border: '1px dashed var(--border)',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
            }}
            title="Добавить комментарий"
          >
            ✏️ Комментарий
          </button>
        </div>
      ) : (
        <div>
          <textarea
            value={noteDraft}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Что случилось? Заметки для себя..."
            style={{
              width: '100%',
              minHeight: 60,
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--card-bg-soft)',
              color: 'var(--text)',
              fontSize: 13,
              fontFamily: 'inherit',
              resize: 'vertical',
              marginBottom: 8,
            }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <OutcomeButton label="🟢 Сработало" color="var(--success)" onClick={() => onOutcome('win')} />
            <OutcomeButton label="🔴 Не сработало" color="var(--danger)" onClick={() => onOutcome('loss')} />
            <OutcomeButton label="⚪ Неясно" color="var(--subtext)" onClick={() => onOutcome('unclear')} />
            <button
              onClick={onCancelExpand}
              style={{
                padding: '0.4rem 0.6rem',
                background: 'transparent',
                color: 'var(--subtext)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OutcomeButton({
  label,
  color,
  onClick,
}: {
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.4rem 0.7rem',
        background: 'transparent',
        color,
        border: `1px solid ${color}`,
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}