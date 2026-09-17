// src/components/EventRiskBanner.tsx

import type { MarketState } from '../data/manualMarket';
import { getEventRisk } from '../core/eventRisk';

interface EventRiskBannerProps {
  market: MarketState;
}

/**
 * Баннер событийного риска.
 *
 * Показывается только если до заседания ЦБ ≤ 14 дней.
 * Не даёт приказ — информирует.
 */
export function EventRiskBanner({ market }: EventRiskBannerProps) {
  const risk = getEventRisk(market);

  // Ничего не показываем, если событие далеко
  if (risk.level === 'none') return null;

  const icon =
    risk.level === 'high' ? '🔴' :
    risk.level === 'medium' ? '🟡' :
    'ℹ️';

  return (
    <div className={`event-risk event-risk-${risk.level}`}>
      <div className="event-risk-header">
        <span className="event-risk-icon">{icon}</span>
        <span className="event-risk-title">
          Событийный риск · {risk.label}
        </span>
      </div>

      <div className="event-risk-message">{risk.message}</div>

      {risk.whatToDo && (
        <div className="event-risk-action">→ {risk.whatToDo}</div>
      )}
    </div>
  );
}