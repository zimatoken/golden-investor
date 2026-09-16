// src/screens/DecisionLogScreen.tsx

import { useMemo, useState } from 'react';
import { Download, Trash2, Filter, RefreshCw } from 'lucide-react';
import { useDecisionLog } from '../hooks/useDecisionLog';
import {
  analyzeDecisions,
  analyzeOutcomes,
  getPendingOutcomes,
  filterDecisions,
  groupByMonth,
  exportDecisions,
  type DecisionFilter,
} from '../core/decisionLog';
import { DecisionCard } from '../components/DecisionCard';
import { DecisionStats } from '../components/DecisionStats';
import { OutcomeCheck } from '../components/OutcomeCheck';
import { DataTransfer } from '../components/DataTransfer';

export function DecisionLogScreen() {
  const { decisions, clear, refresh } = useDecisionLog();
  const [filter, setFilter] = useState<DecisionFilter>('all');
  const [transferOpen, setTransferOpen] = useState(false);

  const stats = useMemo(() => analyzeDecisions(decisions), [decisions]);
  const outcomes = useMemo(() => analyzeOutcomes(decisions), [decisions]);
  const pending = useMemo(() => getPendingOutcomes(decisions), [decisions]);
  const filtered = useMemo(() => filterDecisions(decisions, filter), [decisions, filter]);
  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);

  const handleClear = () => {
    if (confirm('Удалить все записи дневника? Это необратимо.')) {
      clear();
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto', color: 'var(--text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--heading)' }}>📖 Дневник решений</h2>
          <p style={{ color: 'var(--subtext)', marginTop: 4 }}>
            Каждое действие записывается автоматически. Через год ты увидишь свой путь.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setTransferOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0.5rem 0.9rem',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
            title="Экспорт / Импорт всех данных"
          >
            <RefreshCw size={14} /> Данные
          </button>
          {decisions.length > 0 && (
            <>
              <button
                onClick={exportDecisions}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.5rem 0.9rem',
                  background: 'var(--primary-dark)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
                title="Скачать JSON решений"
              >
                <Download size={14} /> Решения
              </button>
              <button
                onClick={handleClear}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.5rem 0.9rem',
                  background: 'transparent',
                  color: 'var(--danger)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
                title="Удалить всё"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Пустое состояние */}
      {decisions.length === 0 && (
        <div
          style={{
            marginTop: 40,
            padding: '3rem 2rem',
            background: 'var(--card-bg-soft)',
            border: '2px dashed var(--border-strong)',
            borderRadius: 16,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
          <h3 style={{ margin: 0, color: 'var(--heading)' }}>Дневник пока пуст</h3>
          <p style={{ color: 'var(--subtext-muted)', marginTop: 8, maxWidth: 400, margin: '8px auto 0' }}>
            Каждое решение на экране «Действие» попадёт сюда автоматически. Начни с малого.
          </p>
        </div>
      )}

      {/* Блок «Пора проверить» */}
      {pending.length > 0 && (
        <OutcomeCheck pending={pending} onRecorded={refresh} />
      )}

      {/* Статистика */}
      {decisions.length > 0 && <DecisionStats stats={stats} />}

      {/* Метрика исходов */}
      {outcomes.checked > 0 && (
        <div
          style={{
            marginBottom: 20,
            padding: '1rem 1.25rem',
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: 'var(--subtext)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 8,
            }}
          >
            🎯 Исходы решений
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
              gap: 12,
            }}
          >
            <StatCell label="Проверено" value={outcomes.checked} color="var(--text)" />
            <StatCell label="🟢 Сработало" value={outcomes.win} color="var(--success)" />
            <StatCell label="🔴 Не сработало" value={outcomes.loss} color="var(--danger)" />
            <StatCell label="⚪ Неясно" value={outcomes.unclear} color="var(--subtext)" />
            <StatCell
              label="Win Rate"
              value={`${outcomes.winRate}%`}
              color={
                outcomes.winRate >= 60
                  ? 'var(--success)'
                  : outcomes.winRate >= 40
                  ? 'var(--warning)'
                  : 'var(--danger)'
              }
            />
          </div>
        </div>
      )}

      {/* Фильтры */}
      {decisions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={16} color="var(--subtext)" />
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
                background: filter === key ? 'var(--primary-dark)' : 'var(--card-bg)',
                color: filter === key ? '#fff' : 'var(--subtext)',
                border: '1px solid var(--border)',
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
              color: 'var(--subtext)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 10,
              paddingBottom: 6,
              borderBottom: '1px solid var(--border)',
            }}
          >
            {group.month} · {group.decisions.length}
          </div>
          {group.decisions.map((d) => (
            <DecisionCard key={d.id} entry={d} />
          ))}
        </div>
      ))}

      {decisions.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--subtext-muted)', padding: '2rem' }}>
          В этой категории пока нет записей.
        </div>
      )}

      {/* Модалка «Перенос данных» */}
      <DataTransfer
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        onImported={refresh}
      />
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: 10,
          color: 'var(--subtext)',
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
