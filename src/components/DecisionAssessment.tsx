// src/components/DecisionAssessment.tsx

import { useState } from 'react';
import type { MarketState } from '../data/manualMarket';
import type { InvestmentPolicy } from '../types/policy';
import { getMarketRegime } from '../core/marketRegime';
import { getDataQuality } from '../core/dataQuality';
import { getEventRisk } from '../core/eventRisk';
import {
  assessAll,
  type DecisionAssessment as Assessment,
} from '../core/decisionEngine';

interface DecisionAssessmentProps {
  market: MarketState;
  policy: InvestmentPolicy;
  policyConfigured: boolean;
}

/**
 * Оценка сценариев для трёх инструментов:
 * • Длинные ОФЗ
 * • Золото
 * • Вклад
 *
 * Показывается ТОЛЬКО когда политика настроена.
 */
export function DecisionAssessment({
  market,
  policy,
  policyConfigured,
}: DecisionAssessmentProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!policyConfigured) return null;

  const regime = getMarketRegime(market);
  const dataQuality = getDataQuality(market);
  const eventRisk = getEventRisk(market);

  const assessments = assessAll({
    market,
    regime,
    dataQuality,
    eventRisk,
    policy,
  });

  return (
    <div style={{ marginBottom: '16px' }}>
      <h3
        style={{
          margin: '0 0 12px',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--heading)',
        }}
      >
        🎯 Оценка сценариев (с учётом твоей политики)
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {assessments.map((a) => (
          <AssessmentCard
            key={a.instrument}
            assessment={a}
            expanded={expandedId === a.instrument}
            onToggle={() =>
              setExpandedId(expandedId === a.instrument ? null : a.instrument)
            }
          />
        ))}
      </div>

      <p
        style={{
          marginTop: 10,
          fontSize: 11,
          fontStyle: 'italic',
          color: 'var(--subtext)',
          lineHeight: 1.5,
        }}
      >
        Это не рекомендация. Это оценка соответствия сценария твоей политике.
        Окончательное решение — за тобой.
      </p>
    </div>
  );
}

/* ─── Карточка одной оценки ────────────── */

function AssessmentCard({
  assessment,
  expanded,
  onToggle,
}: {
  assessment: Assessment;
  expanded: boolean;
  onToggle: () => void;
}) {
  const statusColor =
    assessment.status === 'SUPPORTED' ? 'var(--success)' :
    assessment.status === 'PARTIAL' ? 'var(--warning)' :
    assessment.status === 'INVALID' ? 'var(--danger)' :
    assessment.status === 'WAIT' ? 'var(--subtext)' :
    'var(--subtext-muted)';

  const instrumentIcon =
    assessment.instrument === 'ofz-long' ? '📈' :
    assessment.instrument === 'gold' ? '🥇' :
    '🏦';

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${statusColor}`,
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      {/* Заголовок — всегда видно */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '10px 12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--text)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>
            {instrumentIcon}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading)' }}>
              {assessment.instrumentLabel}
            </div>
            <div style={{ fontSize: '11px', color: statusColor, fontWeight: 600 }}>
              {assessment.statusIcon} {assessment.statusLabel}
            </div>
          </div>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--subtext)', flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Раскрытие — детали */}
      {expanded && (
        <div style={{ padding: '0 12px 12px' }}>
          {assessment.supports.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--subtext)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                  marginBottom: '4px',
                }}
              >
                Что поддерживает
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '16px',
                  fontSize: '12px',
                  color: 'var(--text-soft)',
                  lineHeight: 1.5,
                }}
              >
                {assessment.supports.map((f, i) => (
                  <li key={i} style={{ marginBottom: '2px' }}>{f.text}</li>
                ))}
              </ul>
            </div>
          )}

          {assessment.obstacles.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--subtext)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                  marginBottom: '4px',
                }}
              >
                Что мешает
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '16px',
                  fontSize: '12px',
                  color: 'var(--text-soft)',
                  lineHeight: 1.5,
                }}
              >
                {assessment.obstacles.map((f, i) => (
                  <li key={i} style={{ marginBottom: '2px' }}>{f.text}</li>
                ))}
              </ul>
            </div>
          )}

          {assessment.nextSteps.length > 0 && (
            <div
              style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--subtext)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                  marginBottom: '4px',
                }}
              >
                Что дальше
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '16px',
                  fontSize: '12px',
                  color: 'var(--primary)',
                  lineHeight: 1.5,
                  listStyle: 'none',
                }}
              >
                {assessment.nextSteps.map((s, i) => (
                  <li key={i} style={{ marginBottom: '2px' }}>→ {s}</li>
                ))}
              </ul>
            </div>
          )}

          <p
            style={{
              marginTop: 10,
              fontSize: 11,
              fontStyle: 'italic',
              color: 'var(--subtext)',
              lineHeight: 1.5,
            }}
          >
            {assessment.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}