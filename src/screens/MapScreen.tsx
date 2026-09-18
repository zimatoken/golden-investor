// src/screens/MapScreen.tsx

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';
import type { PlanRow } from '../types/market';
import { useMarketData } from '../hooks/useMarketData';
import { loadPolicy } from '../core/investmentPolicy';
import {
  groupScenarios,
  describeTarget,
  type PlanScenarioStatus,
} from '../core/planMap';
import type { InvestmentPolicy } from '../types/policy';

const STORAGE_KEY = 'gi_plan_map_v1';

const DEFAULT_PLAN: PlanRow[] = [
  {
    id: '1',
    condition: 'ЦБ снижает ставку на 1%',
    action: 'Покупаю длинные ОФЗ на 30% свободных денег',
    instrument: 'ОФЗ 26218 / 26230',
    targetField: 'keyRate',
    operator: '<=',
    targetValue: 13,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    condition: 'ЦБ оставляет ставку без изменений',
    action: 'Ничего не делаю, жду',
    instrument: '—',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    condition: 'Инфляция растёт 2 месяца подряд',
    action: 'Продаю половину длинных ОФЗ',
    instrument: '—',
    targetField: 'inflation',
    operator: '>',
    targetValue: 8,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    condition: 'Ставка падает до 10%',
    action: 'Фиксирую прибыль, выхожу',
    instrument: '—',
    targetField: 'keyRate',
    operator: '<=',
    targetValue: 10,
    createdAt: new Date().toISOString(),
  },
];

function loadPlan(): PlanRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLAN;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_PLAN;
  } catch {
    return DEFAULT_PLAN;
  }
}

function savePlan(plan: PlanRow[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

export function MapScreen() {
  const { market } = useMarketData();
  const [policy] = useState<InvestmentPolicy>(() => loadPolicy());
  const [plan, setPlan] = useState<PlanRow[]>(() => loadPlan());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlanRow | null>(null);

  // Сохранение при любом изменении
  useEffect(() => {
    savePlan(plan);
  }, [plan]);

  // Синхронизация triggeredAt при изменении рынка или политики
  useEffect(() => {
    setPlan((prev) => {
      const groups = groupScenarios(prev, market, policy);
      const triggeredIds = new Set(groups.triggered.map((s) => s.row.id));

      let changed = false;
      const next = prev.map((row) => {
        const isTriggered = triggeredIds.has(row.id);
        const wasTriggered = !!row.triggeredAt;

        if (isTriggered && !wasTriggered) {
          changed = true;
          return { ...row, triggeredAt: new Date().toISOString() };
        }
        if (!isTriggered && wasTriggered) {
          changed = true;
          return { ...row, triggeredAt: undefined };
        }
        return row;
      });

      return changed ? next : prev;
    });
  }, [market, policy]);

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
    const updated = { ...draft, updatedAt: new Date().toISOString() };
    setPlan(plan.map((r) => (r.id === draft.id ? updated : r)));
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
      createdAt: new Date().toISOString(),
    };
    setPlan([...plan, newRow]);
    startEdit(newRow);
  };

  const resetToDefault = () => {
    if (confirm('Вернуть карту к стандартной? Твои изменения будут потеряны.')) {
      setPlan(DEFAULT_PLAN);
    }
  };

  const groups = groupScenarios(plan, market, policy);

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto', color: 'var(--text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: 'var(--heading)' }}>🗺 Твоя карта</h2>
        <button
          onClick={addRow}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0.5rem 1rem',
            background: 'var(--success)',
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

      <p style={{ color: 'var(--subtext)', marginBottom: 16 }}>
        Когда событие произойдёт — ты не думаешь. Ты смотришь в карту.
      </p>

      {/* СВОДКА */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 20,
          fontSize: 13,
          color: 'var(--subtext)',
        }}
      >
        <span>Всего: {groups.total}</span>
        {groups.triggered.length > 0 && (
          <span style={{ color: 'var(--success)' }}>· ✅ Сработало: {groups.triggered.length}</span>
        )}
        {groups.near.length > 0 && (
          <span style={{ color: 'var(--warning)' }}>· 🟡 Близко: {groups.near.length}</span>
        )}
        {groups.conflicts.length > 0 && (
          <span style={{ color: 'var(--danger)' }}>· ⚠️ Конфликт: {groups.conflicts.length}</span>
        )}
        {groups.far.length > 0 && (
          <span>· ⚪ Далеко: {groups.far.length}</span>
        )}
      </div>

      {/* ГРУППЫ */}
      {groups.triggered.length > 0 && (
        <ScenarioGroup
          title="✅ СРАБОТАЛО"
          color="var(--success)"
          scenarios={groups.triggered}
          editingId={editingId}
          draft={draft}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onConfirmEdit={confirmEdit}
          onDelete={deleteRow}
          onDraftChange={setDraft}
        />
      )}

      {groups.near.length > 0 && (
        <ScenarioGroup
          title="🟡 БЛИЗКО К СРАБАТЫВАНИЮ"
          color="var(--warning)"
          scenarios={groups.near}
          editingId={editingId}
          draft={draft}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onConfirmEdit={confirmEdit}
          onDelete={deleteRow}
          onDraftChange={setDraft}
        />
      )}

      {groups.conflicts.length > 0 && (
        <ScenarioGroup
          title="⚠️ КОНФЛИКТ С ПОЛИТИКОЙ"
          color="var(--danger)"
          scenarios={groups.conflicts}
          editingId={editingId}
          draft={draft}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onConfirmEdit={confirmEdit}
          onDelete={deleteRow}
          onDraftChange={setDraft}
        />
      )}

      {groups.far.length > 0 && (
        <ScenarioGroup
          title="⚪ ДАЛЕКО"
          color="var(--subtext)"
          scenarios={groups.far}
          editingId={editingId}
          draft={draft}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onConfirmEdit={confirmEdit}
          onDelete={deleteRow}
          onDraftChange={setDraft}
        />
      )}

      {plan.length === 0 && (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--subtext)',
            background: 'var(--card-bg-soft)',
            borderRadius: 12,
          }}
        >
          Карта пуста. Нажми «+ Добавить», чтобы создать первый сценарий.
        </div>
      )}

      <button
        onClick={resetToDefault}
        style={{
          marginTop: 16,
          background: 'none',
          border: 'none',
          color: 'var(--subtext-muted)',
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

/* ─── Группа сценариев ─────────────────── */

interface ScenarioGroupProps {
  title: string;
  color: string;
  scenarios: PlanScenarioStatus[];
  editingId: string | null;
  draft: PlanRow | null;
  onStartEdit: (row: PlanRow) => void;
  onCancelEdit: () => void;
  onConfirmEdit: () => void;
  onDelete: (id: string) => void;
  onDraftChange: (draft: PlanRow) => void;
}

function ScenarioGroup({
  title,
  color,
  scenarios,
  editingId,
  draft,
  onStartEdit,
  onCancelEdit,
  onConfirmEdit,
  onDelete,
  onDraftChange,
}: ScenarioGroupProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>{title}</span>
        <span style={{ color: 'var(--subtext-muted)', fontWeight: 500 }}>
          ({scenarios.length})
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {scenarios.map((s) => (
          <ScenarioCard
            key={s.row.id}
            status={s}
            isEditing={editingId === s.row.id}
            draft={draft}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onConfirmEdit={onConfirmEdit}
            onDelete={onDelete}
            onDraftChange={onDraftChange}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Карточка сценария ────────────────── */

interface ScenarioCardProps {
  status: PlanScenarioStatus;
  isEditing: boolean;
  draft: PlanRow | null;
  onStartEdit: (row: PlanRow) => void;
  onCancelEdit: () => void;
  onConfirmEdit: () => void;
  onDelete: (id: string) => void;
  onDraftChange: (draft: PlanRow) => void;
}

function ScenarioCard({
  status,
  isEditing,
  draft,
  onStartEdit,
  onCancelEdit,
  onConfirmEdit,
  onDelete,
  onDraftChange,
}: ScenarioCardProps) {
  const { row, currentValue, distancePct, policyWarning } = status;

  const borderColor =
    status.status === 'triggered' ? 'var(--success)' :
    status.status === 'near' ? 'var(--warning)' :
    status.status === 'policy-conflict' ? 'var(--danger)' :
    'var(--border)';

  if (isEditing && draft) {
    return (
      <div
        style={{
          padding: '1rem',
          background: 'var(--card-bg)',
          border: `2px solid ${borderColor}`,
          borderRadius: 12,
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: 'var(--subtext)', display: 'block', marginBottom: 4 }}>
            ЕСЛИ (условие)
          </label>
          <input
            value={draft.condition}
            onChange={(e) => onDraftChange({ ...draft, condition: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border-strong)',
              borderRadius: 6,
              fontSize: 14,
              background: 'var(--card-bg-soft)',
              color: 'var(--text)',
            }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: 'var(--subtext)', display: 'block', marginBottom: 4 }}>
            ТО (действие)
          </label>
          <input
            value={draft.action}
            onChange={(e) => onDraftChange({ ...draft, action: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border-strong)',
              borderRadius: 6,
              fontSize: 14,
              marginBottom: 4,
              background: 'var(--card-bg-soft)',
              color: 'var(--text)',
            }}
          />
          <input
            value={draft.instrument}
            onChange={(e) => onDraftChange({ ...draft, instrument: e.target.value })}
            placeholder="Инструмент"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border-strong)',
              borderRadius: 6,
              fontSize: 13,
              color: 'var(--text-soft)',
              background: 'var(--card-bg-soft)',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onConfirmEdit}
            style={{ padding: '0.5rem 1rem', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Check size={14} /> Сохранить
          </button>
          <button
            onClick={onCancelEdit}
            style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '1rem 1.25rem',
        background: 'var(--card-bg)',
        borderLeft: `4px solid ${borderColor}`,
        border: `1px solid var(--border)`,
        borderLeftWidth: 4,
        borderLeftColor: borderColor,
        borderRadius: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            ЕСЛИ
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--heading)', marginBottom: 8 }}>
            {row.condition}
          </div>

          <div style={{ fontSize: 11, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            ТО
          </div>
          <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>
            {row.action}
          </div>
          {row.instrument && row.instrument !== '—' && (
            <div style={{ fontSize: 12, color: 'var(--subtext)' }}>
              Инструмент: {row.instrument}
            </div>
          )}

          {describeTarget(row) && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: 'var(--text-soft)',
                padding: '6px 10px',
                background: 'var(--card-bg-soft)',
                borderRadius: 6,
                display: 'inline-block',
              }}
            >
              🎯 {describeTarget(row)}
              {currentValue !== null && (
                <> · сейчас: <strong>{currentValue}%</strong></>
              )}
              {distancePct !== null && distancePct > 0 && (
                <> · до срабатывания: {distancePct.toFixed(1)}%</>
              )}
            </div>
          )}

          {policyWarning && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                background: 'rgba(239,68,68,0.08)',
                borderLeft: '3px solid var(--danger)',
                borderRadius: 6,
                fontSize: 12,
                color: 'var(--text-soft)',
                lineHeight: 1.5,
              }}
            >
              ⚠️ {policyWarning}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => onStartEdit(row)}
            style={{
              padding: '0.4rem',
              background: 'transparent',
              color: 'var(--subtext)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              cursor: 'pointer',
            }}
            aria-label="Редактировать"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(row.id)}
            style={{
              padding: '0.4rem',
              background: 'transparent',
              color: 'var(--danger)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 6,
              cursor: 'pointer',
            }}
            aria-label="Удалить"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}