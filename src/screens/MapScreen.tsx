// src/screens/MapScreen.tsx

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { PlanRow } from '../types/market';

const STORAGE_KEY = 'gi_plan_map_v1';

const DEFAULT_PLAN: PlanRow[] = [
  {
    id: '1',
    condition: 'ЦБ снижает ставку на 1%',
    action: 'Покупаю длинные ОФЗ на 30% свободных денег',
    instrument: 'ОФЗ 26218 / 26230',
  },
  {
    id: '2',
    condition: 'ЦБ оставляет ставку без изменений',
    action: 'Ничего не делаю, жду',
    instrument: '—',
  },
  {
    id: '3',
    condition: 'Инфляция растёт 2 месяца подряд',
    action: 'Продаю половину длинных ОФЗ',
    instrument: '—',
  },
  {
    id: '4',
    condition: 'Ставка падает до 10%',
    action: 'Фиксирую прибыль, выхожу',
    instrument: '—',
  },
];

function loadPlan(): PlanRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_PLAN;
  } catch {
    return DEFAULT_PLAN;
  }
}

function savePlan(plan: PlanRow[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

export function MapScreen() {
  const [plan, setPlan] = useState<PlanRow[]>(() => loadPlan());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlanRow | null>(null);

  // Автосохранение при любом изменении
  useEffect(() => {
    savePlan(plan);
  }, [plan]);

  const startEdit = (row: PlanRow) => {
    setEditingId(row.id);
    setDraft({ ...row });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const confirmEdit = () => {
    if (!draft) return;
    setPlan(plan.map((r) => (r.id === draft.id ? draft : r)));
    cancelEdit();
  };

  const deleteRow = (id: string) => {
    setPlan(plan.filter((r) => r.id !== id));
  };

  const addRow = () => {
    const newRow: PlanRow = {
      id: crypto.randomUUID(),
      condition: 'Новое условие',
      action: 'Новое действие',
      instrument: '—',
    };
    setPlan([...plan, newRow]);
    startEdit(newRow);
  };

  const resetToDefault = () => {
    if (confirm('Вернуть карту к стандартной? Твои изменения будут потеряны.')) {
      setPlan(DEFAULT_PLAN);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Твоя карта. Написана, когда ты спокоен.</h2>
        <button
          onClick={addRow}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0.5rem 1rem',
            background: '#22c55e',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <Plus size={16} /> Добавить
        </button>
      </div>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Когда событие произойдёт — ты не думаешь. Ты смотришь в карту.
      </p>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: 13, color: '#475569' }}>
                Если это произойдёт...
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: 13, color: '#475569' }}>
                Я делаю это...
              </th>
              <th style={{ padding: '0.75rem', width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {plan.map((row) => {
              const isEditing = editingId === row.id;
              return (
                <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  {isEditing && draft ? (
                    <>
                      <td style={{ padding: '0.5rem' }}>
                        <input
                          value={draft.condition}
                          onChange={(e) => setDraft({ ...draft, condition: e.target.value })}
                          style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input
                          value={draft.action}
                          onChange={(e) => setDraft({ ...draft, action: e.target.value })}
                          style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, marginBottom: 4 }}
                        />
                        <input
                          value={draft.instrument}
                          onChange={(e) => setDraft({ ...draft, instrument: e.target.value })}
                          placeholder="Инструмент"
                          style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, color: '#64748b' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem', display: 'flex', gap: 6 }}>
                        <button
                          onClick={confirmEdit}
                          style={{ padding: '0.4rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                          aria-label="Сохранить"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{ padding: '0.4rem', background: '#94a3b8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                          aria-label="Отмена"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '0.75rem', fontSize: 14 }}>{row.condition}</td>
                      <td style={{ padding: '0.75rem', fontSize: 14 }}>
                        {row.action}
                        {row.instrument !== '—' && (
                          <span style={{ color: '#64748b', fontSize: 12 }}> ({row.instrument})</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem', display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => startEdit(row)}
                          style={{ padding: '0.4rem', background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }}
                          aria-label="Редактировать"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteRow(row.id)}
                          style={{ padding: '0.4rem', background: 'transparent', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer' }}
                          aria-label="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={resetToDefault}
        style={{
          marginTop: 16,
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          fontSize: 12,
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        Вернуть стандартную карту
      </button>
    </div>
  );
}