// src/components/BanksTable.tsx

import { useEffect, useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { loadBanks, saveBanks, type BankRate } from '../data/banks';

interface Props {
  /** Колбэк: когда данные банков обновились. */
  onUpdate?: (banks: BankRate[]) => void;
}

export function BanksTable({ onUpdate }: Props) {
  const [banks, setBanks] = useState<BankRate[]>(() => loadBanks());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BankRate[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>(() => {
    return localStorage.getItem('golden-investor-banks-updated') || new Date().toISOString();
  });

  // Сохранение при изменении
  useEffect(() => {
    saveBanks(banks);
    localStorage.setItem('golden-investor-banks-updated', updatedAt);
    onUpdate?.(banks);
  }, [banks, updatedAt, onUpdate]);

  const startEdit = () => {
    setDraft(JSON.parse(JSON.stringify(banks)));
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft([]);
    setEditing(false);
  };

  const confirmEdit = () => {
    setBanks(draft);
    setUpdatedAt(new Date().toISOString());
    setEditing(false);
  };

  const updateField = (
    index: number,
    field: keyof BankRate,
    value: string | number | undefined
  ) => {
    const arr = [...draft];
    if (value === '' || value === undefined) {
      delete arr[index][field];
    } else {
      (arr[index] as any)[field] = value;
    }
    setDraft(arr);
  };

  const display = editing ? draft : banks;

  return (
    <div
      style={{
        marginTop: '2rem',
        padding: '1rem',
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        color: 'var(--text)',
      }}
    >
      {/* Заголовок */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--subtext)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            🏦 Банки и биржи
          </div>
          <div style={{ fontSize: 11, color: 'var(--subtext-muted)', marginTop: 2 }}>
            Обновлено: {new Date(updatedAt).toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {!editing ? (
            <button
              onClick={startEdit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '0.4rem 0.8rem',
                background: 'var(--card-bg-soft)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <Edit2 size={12} /> Обновить
            </button>
          ) : (
            <>
              <button
                onClick={confirmEdit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '0.4rem 0.8rem',
                  background: 'var(--success)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Check size={12} /> Сохранить
              </button>
              <button
                onClick={cancelEdit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '0.4rem 0.8rem',
                  background: 'transparent',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                <X size={12} /> Отмена
              </button>
            </>
          )}
        </div>
      </div>

      {/* Таблица */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle}>Источник</th>
              <th style={thStyle}>Ставка ЦБ</th>
              <th style={thStyle}>ОФЗ 10л</th>
              <th style={thStyle}>Золото</th>
              <th style={thStyle}>Вклад</th>
            </tr>
          </thead>
          <tbody>
            {display.map((bank, i) => (
              <tr
                key={bank.id}
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <td style={tdStyle}>
                  <span style={{ marginRight: 6 }}>{bank.icon}</span>
                  <strong>{bank.name}</strong>
                  {bank.note && !editing && (
                    <div style={{ fontSize: 10, color: 'var(--subtext-muted)', marginTop: 2 }}>
                      {bank.note}
                    </div>
                  )}
                </td>
                <td style={tdStyle}>
                  {editing ? (
                    <EditCell
                      value={bank.keyRate}
                      onChange={(v) => updateField(i, 'keyRate', v)}
                    />
                  ) : (
                    formatPct(bank.keyRate)
                  )}
                </td>
                <td style={tdStyle}>
                  {editing ? (
                    <EditCell
                      value={bank.ofz10y}
                      onChange={(v) => updateField(i, 'ofz10y', v)}
                    />
                  ) : (
                    formatPct(bank.ofz10y)
                  )}
                </td>
                <td style={tdStyle}>
                  {editing ? (
                    <EditCell
                      value={bank.gold}
                      onChange={(v) => updateField(i, 'gold', v)}
                    />
                  ) : (
                    bank.gold ? `${bank.gold.toLocaleString('ru-RU')} ₽` : '—'
                  )}
                </td>
                <td style={tdStyle}>
                  {editing ? (
                    <EditCell
                      value={bank.deposit}
                      onChange={(v) => updateField(i, 'deposit', v)}
                    />
                  ) : (
                    formatPct(bank.deposit)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Подсказка в режиме редактирования */}
      {editing && (
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: 'var(--subtext)',
            fontStyle: 'italic',
          }}
        >
          💡 Возьми актуальные ставки с сайтов банков. Оставь пустым, если банк не предлагает инструмент.
        </div>
      )}
    </div>
  );
}

/* ─── Стили ячеек ──────────────────────── */
const thStyle: React.CSSProperties = {
  padding: '0.6rem 0.5rem',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--subtext)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '0.6rem 0.5rem',
  verticalAlign: 'top',
};

function formatPct(v?: number): string {
  if (v === undefined || v === null) return '—';
  return `${v.toFixed(2)}%`;
}

/* ─── Поле редактирования ──────────────── */
function EditCell({
  value,
  onChange,
}: {
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <input
      type="number"
      step="0.01"
      value={value ?? ''}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '') {
          onChange(undefined);
        } else {
          const num = parseFloat(raw);
          if (!isNaN(num)) onChange(num);
        }
      }}
      style={{
        width: '100%',
        maxWidth: 90,
        padding: '0.3rem 0.4rem',
        border: '1px solid var(--border)',
        borderRadius: 6,
        background: 'var(--card-bg-soft)',
        color: 'var(--text)',
        fontSize: 13,
      }}
    />
  );
}