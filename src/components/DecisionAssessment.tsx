// src/components/DecisionAssessment.tsx

import type { MarketState } from '../data/manualMarket';
import type { InvestmentPolicy } from '../types/policy';
import { getMarketRegime } from '../core/marketRegime';
import { getDataQuality } from '../core/dataQuality';
import { getEventRisk } from '../core/eventRisk';
import { assessLongOFZ } from '../core/decisionEngine';

interface DecisionAssessmentProps {
  market: MarketState;
  policy: InvestmentPolicy;
  policyConfigured: boolean;
}

/**
 * Оценка сценария «Длинные ОФЗ» с учётом политики.
 *
 * Показывается ТОЛЬКО когда политика настроена.
 */
export function DecisionAssessment({ market, policy, policyConfigured }: DecisionAssessmentProps) {
  if (!policyConfigured) return null;

  const regime = getMarketRegime(market);
  const dataQuality = getDataQuality(market);
  const eventRisk = getEventRisk(market);

  const assessment = assessLongOFZ({
    market,
    regime,
    dataQuality,
    eventRisk,
    policy,
  });

  const statusClass =
    assessment.status === 'SUPPORTED' ? 'decision-supported' :
    assessment.status === 'PARTIAL' ? 'decision-partial' :
    assessment.status === 'INVALID' ? 'decision-invalid' :
    assessment.status === 'WAIT' ? 'decision-wait' :
    'decision-insufficient';

  return (
    <div className={`decision-assessment ${statusClass}`}>
      <div className="decision-header">
        <div className="decision-instrument">{assessment.instrumentLabel}</div>
        <div className="decision-status">
          <span className="decision-status-icon">{assessment.statusIcon}</span>
          <span className="decision-status-label">{assessment.statusLabel}</span>
        </div>
      </div>

      {assessment.supports.length > 0 && (
        <div className="decision-block">
          <div className="decision-block-title">Что поддерживает сценарий:</div>
          <ul className="decision-list">
            {assessment.supports.map((f, i) => (
              <li key={i} className={`decision-item decision-item-${f.tone}`}>
                <span className="decision-item-dot" />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {assessment.obstacles.length > 0 && (
        <div className="decision-block">
          <div className="decision-block-title">Что мешает:</div>
          <ul className="decision-list">
            {assessment.obstacles.map((f, i) => (
              <li key={i} className={`decision-item decision-item-${f.tone}`}>
                <span className="decision-item-dot" />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {assessment.nextSteps.length > 0 && (
        <div className="decision-block decision-block-next">
          <div className="decision-block-title">Что дальше:</div>
          <ul className="decision-list">
            {assessment.nextSteps.map((s, i) => (
              <li key={i} className="decision-item decision-item-neutral">
                <span className="decision-item-arrow">→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="decision-disclaimer">{assessment.disclaimer}</div>
    </div>
  );
}