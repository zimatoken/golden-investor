// src/components/TrustIndicator.tsx
// PHASE 6.2 — блок «Доверие плану» на StatusScreen.

import { useMemo, type CSSProperties } from 'react';
import type { PlanRow, DecisionEntry } from '../types/market';
import type { MarketState } from '../data/manualMarket';
import type { InvestmentPolicy } from '../types/policy';
import { computeTrust, MIN_TRIGGERED_FOR_SCORE } from '../core/trustSystem';

interface TrustIndicatorProps {
  market: MarketState;
  plan: PlanRow[];
  decisions: DecisionEntry[];
  policy: InvestmentPolicy;
}

function scoreColor(score: number): string {
  if (score >= 60) return 'var(--success)';
  if (score >= 40) return 'var(--warning)';
  return 'var(--danger)';
}

export function TrustIndicator({
  market,
  plan,
  decisions,
  policy,
}: TrustIndicatorProps) {
  const report = useMemo(
    () => computeTrust(plan, market, policy, decisions),
    [plan, market, policy, decisions]
  );

  // Нет сценариев в Карте — блок не показываем
  if (report.total === 0) return null;

  const card: CSSProperties = {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
  };

  const title: CSSProperties = {
    margin: '0 0 10px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--heading)',
  };

  const muted: CSSProperties = {
    fontSize: '13px',
    color: 'var(--subtext)',
    margin: 0,
  };

  // Локальная переменная вместо non-null assertion
  const score = report.trustScore ?? 0;

  return (
    <section style={card} aria-label="Доверие плану">
      <h3 style={title}>🎯 Доверие плану</h3>

      {!report.hasEnoughData ? (
        <p style={muted}>
          Сработало сценариев: {report.triggered} из минимум{' '}
          {MIN_TRIGGERED_FOR_SCORE}. Пока мало данных — продолжай записывать
          решения в Дневник.
        </p>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: scoreColor(score),
              }}
            >
              {score}%
            </span>
            <span style={muted}>решений по сработавшим сценариям</span>
          </div>

          <div
            style={{
              height: '6px',
              borderRadius: '3px',
              background: 'var(--border)',
              overflow: 'hidden',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                width: `${score}%`,
                height: '100%',
                background: scoreColor(score),
              }}
            />
          </div>

          <p style={{ ...muted, marginBottom: '4px' }}>
            Сработало: {report.triggered} · Выполнено: {report.completed} ·
            Ждут: {report.pending}
          </p>
        </>
      )}

      {report.ignored.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          {report.ignored.map((ig) => (
            <p
              key={ig.row.id}
              style={{
                fontSize: '13px',
                color: 'var(--text-soft)',
                margin: '4px 0',
                padding: '8px 10px',
                background: 'var(--card-bg-soft)',
                borderRadius: '8px',
                borderLeft: '3px solid var(--warning)',
              }}
            >
              ⚠️ «{ig.row.condition}» — сработал {ig.triggeredDaysAgo}{' '}
              {ig.triggeredDaysAgo === 1
                ? 'день'
                : ig.triggeredDaysAgo < 5
                  ? 'дня'
                  : 'дней'}{' '}
              назад. Решения в Дневнике нет.
            </p>
          ))}
          <p style={{ ...muted, marginTop: '6px' }}>
            Это не приказ. Если решил не действовать — запиши причину в
            Дневник, и статус станет честным.
          </p>
        </div>
      )}
    </section>
  );
}