// src/components/PocketMode.tsx

import type { MarketState } from '../data/manualMarket';
import { getMarketRegime } from '../core/marketRegime';
import { getEventRisk } from '../core/eventRisk';
import { deriveStatus } from '../core/truthEngine';

interface PocketModeProps {
  market: MarketState;
}

/**
 * Pocket Mode — сводка верхнего уровня.
 *
 * Отвечает за 30 секунд:
 * 1. Где я? (режим рынка)
 * 2. Что делать? (статус)
 * 3. Когда вернуться? (событие)
 */
export function PocketMode({ market }: PocketModeProps) {
  const regime = getMarketRegime(market);
  const eventRisk = getEventRisk(market);
  const status = deriveStatus(market);

  const statusIcon =
    status === 'act' ? '🟢' :
    status === 'wait' ? '🟡' :
    '🔴';

  const statusText =
    status === 'act' ? 'Можно действовать' :
    status === 'wait' ? 'ЖДАТЬ' :
    'Не действовать';

  const statusHint =
    status === 'act' ? 'Проверь свою Карту решений.' :
    status === 'wait' ? 'Сегодня: ничего не делать.' :
    'Сейчас — не время для решений.';

  const statusClass =
    status === 'act' ? 'pocket-act' :
    status === 'wait' ? 'pocket-wait' :
    'pocket-danger';

  return (
    <div className={`pocket-mode ${statusClass}`}>
      <div className="pocket-header">
        <div className="pocket-title">ЗОЛОТОЙ ИНВЕСТОР</div>
      </div>

      <div className="pocket-regime">
        <span className="pocket-regime-icon">{regime.icon}</span>
        <span className="pocket-regime-label">{regime.label}</span>
      </div>

      <div className="pocket-divider" />

      <div className="pocket-status">
        <span className="pocket-status-icon">{statusIcon}</span>
        <span className="pocket-status-text">{statusText}</span>
      </div>

      <div className="pocket-hint">{statusHint}</div>

      {eventRisk.level !== 'none' && (
        <div className={`pocket-event pocket-event-${eventRisk.level}`}>
          <span className="pocket-event-icon">
            {eventRisk.level === 'high' ? '🔴' :
             eventRisk.level === 'medium' ? '🟡' :
             'ℹ️'}
          </span>
          <span className="pocket-event-text">
            {eventRisk.label} — заседание ЦБ
          </span>
        </div>
      )}

      <div className="pocket-more">
        ↓ Разверни подробнее ниже
      </div>
    </div>
  );
}