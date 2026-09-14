// src/screens/DecisionLogScreen.tsx

import { useMemo, useState } from 'react';
import { Download, Trash2, Filter } from 'lucide-react';
import { useDecisionLog } from '../hooks/useDecisionLog';
import {
  analyzeDecisions,
  filterDecisions,
  groupByMonth,
  exportDecisions,
  type DecisionFilter,
} from '../core/decisionLog';
import { DecisionCard } from '../components/DecisionCard';
import { DecisionStats } from '../components/DecisionStats';

export function DecisionLogScreen() {
  const { decisions, clear } = useDecisionLog();
  const [filter, setFilter] = useState<DecisionFilter>('all');

  const stats = useMemo(() => analyzeDecisions(decisions), [decisions]);
  const filtered = useMemo(() => filterDecisions(decisions, filter), [decisions, filter]);
  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);

  const handleClear = () => {
    if (confirm('Удалить все записи дневника? Это необратимо.')) {
      clear();
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h2 style={{ margin: 0 }}>📖 Дневник решений</h2>
          <p style={{ color: '#64748b', marginTop: 4 }}>
            Каждое действие записывается автоматически. Через год ты увидишь свой путь.
          </p>
        </div>
        {decisions.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={exportDecisions}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.5rem 0.9rem',
                background: '#0c1426',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
              }}
              title="Скачать JSON"
            >
              <Download size={14} /> Экспорт
            </button>
            <button
              onClick={handleClear}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.5rem 0.9rem',
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid #fecaca',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
              }}
              title="Удалить всё"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Пустое состояние */}
      {decisions.length === 0 && (
        <div
          style={{
            marginTop: 40,
            padding: '3rem 2rem',
            background: '#f8fafc',
            border: '2px dashed #cbd5e1',
            borderRadius: 16,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
          <h3 style={{ margin: 0, color: '#475569' }}>Дневник пока пуст</h3>
          <p style={{ color: '#94a3b8', marginTop: 8, maxWidth: 400, margin: '8px auto 0' }}>
            Каждое решение на экране «Действие» попадёт сюда автоматически. Начни с малого — попробуй
            выбрать инструмент и подтвердить действие.
          </p>
        </div>
      )}

      {/* Статистика */}
      {decisions.length > 0 && <DecisionStats stats={stats} />}

      {/* Фильтры */}
      {decisions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={16} color="#64748b" />
          {([
            ['all', `Все (${stats.total})`],
            ['in-plan', `По плану (${stats.inPlan})`],
            ['impulsive', `Импульс (${stats.impulsive})`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '0.4rem 0.8rem',
                background: filter === key ? '#0c1426' : '#fff',
                color: filter === key ? '#fff' : '#475569',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: filter === key ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Группы по месяцам */}
      {grouped.map((group) => (
        <div key={group.key} style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 10,
              paddingBottom: 6,
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            {group.month} · {group.decisions.length}
          </div>
          {group.decisions.map((d) => (
            <DecisionCard key={d.id} entry={d} />
          ))}
        </div>
      ))}

      {/* Если фильтр дал пустой результат */}
      {decisions.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
          В этой категории пока нет записей.
        </div>
      )}
    </div>
  );
}