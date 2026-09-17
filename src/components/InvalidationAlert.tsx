// src/components/InvalidationAlert.tsx

import type { MarketState } from '../data/manualMarket';
import { checkInvalidations, describeCondition } from '../core/invalidationEngine';

interface InvalidationAlertProps {
  market: MarketState;
}

/**
 * Баннер сработавших условий.
 *
 * Показывается ТОЛЬКО если есть активные срабатывания.
 */
export function InvalidationAlert({ market }: InvalidationAlertProps) {
  const checks = checkInvalidations(market);
  const triggered = checks.filter((c) => c.triggered);

  if (triggered.length === 0) return null;

  return (
    <div className="invalidation-alert">
      <div className="invalidation-alert-header">
        <span className="invalidation-alert-icon">⚠️</span>
        <span className="invalidation-alert-title">
          Условия пересмотра сработали
        </span>
      </div>

      <ul className="invalidation-alert-list">
        {triggered.map((c) => (
          <li key={c.condition.id} className="invalidation-alert-item">
            <div className="invalidation-alert-rule">
              {describeCondition(c.condition)}
            </div>
            <div className="invalidation-alert-current">
              Сейчас: {c.currentValue}%
            </div>
            {c.condition.note && (
              <div className="invalidation-alert-note">{c.condition.note}</div>
            )}
          </li>
        ))}
      </ul>

      <div className="invalidation-alert-action">
        → Пересмотри записанный сценарий. Возможно, твоё мнение изменилось.
      </div>
    </div>
  );
}