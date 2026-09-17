// src/components/MarketRegimeBadge.tsx

import type { MarketState } from '../data/manualMarket';
import { getMarketRegime } from '../core/marketRegime';

interface MarketRegimeBadgeProps {
  market: MarketState;
}

/**
 * Режим рынка — описание среды.
 *
 * НЕ светофор. НЕ прогноз. Описание.
 */
export function MarketRegimeBadge({ market }: MarketRegimeBadgeProps) {
  const regime = getMarketRegime(market);

  return (
    <div className="market-regime">
      <div className="market-regime-header">
        <span className="market-regime-icon">{regime.icon}</span>
        <div className="market-regime-titles">
          <div className="market-regime-label-small">Режим рынка</div>
          <div className="market-regime-label">{regime.label}</div>
        </div>
      </div>

      <div className="market-regime-block">
        <div className="market-regime-block-title">Что это значит:</div>
        <div className="market-regime-block-text">{regime.whatItMeans}</div>
      </div>

      <div className="market-regime-block market-regime-block-warning">
        <div className="market-regime-block-title">Что это НЕ значит:</div>
        <div className="market-regime-block-text">{regime.whatItDoesNotMean}</div>
      </div>

      <details className="market-regime-details">
        <summary>Условия</summary>
        <ul className="market-regime-conditions">
          {regime.conditions.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}