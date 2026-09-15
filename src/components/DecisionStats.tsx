// src/components/DecisionStats.tsx

import type { DecisionStats as Stats } from '../core/decisionLog';

interface Props {
  stats: Stats;
}

export function DecisionStats({ stats }: Props) {
  const scoreColor =
    stats.disciplineScore >= 80 ? 'var(--success)' :
    stats.disciplineScore >= 50 ? 'var(--warning)' :
    'var(--danger)';

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '1.5rem',
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Всего решений
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--heading)' }}>{stats.total}</div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            По плану
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>{stats.inPlan}</div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Импульсивных
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)' }}>{stats.impulsive}</div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Дисциплина
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor }}>
            {stats.disciplineScore}%
          </div>
        </div>
      </div>

      {/* Прогресс-бар дисциплины */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 6 }}>
          Индекс дисциплины: сколько решений было по плану
        </div>
        <div style={{ height: 10, background: 'var(--card-bg-soft)', borderRadius: 5, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${stats.disciplineScore}%`,
              background: scoreColor,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Разбивка по инструментам */}
      {Object.keys(stats.byInstrument).length > 0 && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            По инструментам
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(stats.byInstrument).map(([inst, count]) => (
              <div
                key={inst}
                style={{
                  padding: '6px 12px',
                  background: 'var(--card-bg-soft)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: 'var(--text)',
                }}
              >
                <strong>{inst === 'ofz' ? '📈 ОФЗ' : inst === 'gold' ? '🥇 Золото' : '🏦 Вклад'}</strong>
                {' · '}
                {count}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}