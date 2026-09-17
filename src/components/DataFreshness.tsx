// src/components/DataFreshness.tsx

import type { MarketState } from '../data/manualMarket';
import { getDataQuality } from '../core/dataQuality';

interface DataFreshnessProps {
  market: MarketState;
}

/**
 * Индикатор свежести данных.
 *
 * Не показывает «Confidence: HIGH» — это оценка.
 * Показывает «5 из 6 полей актуальны» — это факт.
 */
export function DataFreshness({ market }: DataFreshnessProps) {
  const quality = getDataQuality(market);

  const levelClass =
    quality.overall === 'fresh'
      ? 'data-fresh-good'
      : quality.overall === 'warning'
      ? 'data-fresh-warn'
      : 'data-fresh-bad';

  const levelIcon =
    quality.overall === 'fresh' ? '✓' : quality.overall === 'warning' ? '⚠' : '⛔';

  return (
    <div className={`data-fresh ${levelClass}`}>
      <div className="data-fresh-row">
        <span className="data-fresh-icon">{levelIcon}</span>
        <span className="data-fresh-text">{quality.summaryText}</span>
      </div>

      <details className="data-fresh-details">
        <summary>Подробнее</summary>
        <div className="data-fresh-list">
          {quality.fields.map((f) => (
            <div key={f.key} className={`data-fresh-item data-fresh-item-${f.level}`}>
              <span className="data-fresh-item-label">{f.label}</span>
              <span className="data-fresh-item-age">
                {f.ageDays} дн. / TTL {f.ttlDays} дн.
              </span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}