// src/components/PolicySummary.tsx

import type { InvestmentPolicy } from '../types/policy';
import {
  HORIZON_LABELS,
  DRAWDOWN_LABELS,
  LIQUIDITY_LABELS,
  GOAL_LABELS,
  EXPERIENCE_LABELS,
} from '../types/policy';

interface PolicySummaryProps {
  policy: InvestmentPolicy;
  configured: boolean;
  onEdit: () => void;
}

/**
 * Сводка политики пользователя.
 *
 * Если политика не настроена — показывает приглашение.
 * Если настроена — показывает ключевые поля и кнопку «Изменить».
 */
export function PolicySummary({ policy, configured, onEdit }: PolicySummaryProps) {
  if (!configured) {
    return (
      <div className="policy-summary policy-summary-empty">
        <div className="policy-summary-header">
          <h3>📋 Ваша политика</h3>
        </div>
        <p className="policy-summary-hint">
          Ответь на 5 коротких вопросов — приложение будет учитывать
          твой горизонт, допустимую просадку и цель при анализе сценариев.
        </p>
        <button className="policy-summary-btn-primary" onClick={onEdit}>
          Настроить политику →
        </button>
      </div>
    );
  }

  return (
    <div className="policy-summary">
      <div className="policy-summary-header">
        <h3>📋 Ваша политика</h3>
        <button className="policy-summary-btn-edit" onClick={onEdit}>
          Изменить
        </button>
      </div>

      <div className="policy-summary-grid">
        <div className="policy-summary-item">
          <span className="policy-summary-item-label">Горизонт</span>
          <span className="policy-summary-item-value">
            {HORIZON_LABELS[policy.horizon]}
          </span>
        </div>
        <div className="policy-summary-item">
          <span className="policy-summary-item-label">Просадка</span>
          <span className="policy-summary-item-value">
            {DRAWDOWN_LABELS[policy.drawdownTolerance]}
          </span>
        </div>
        <div className="policy-summary-item">
          <span className="policy-summary-item-label">Ликвидность</span>
          <span className="policy-summary-item-value">
            {LIQUIDITY_LABELS[policy.liquidityNeed]}
          </span>
        </div>
        <div className="policy-summary-item">
          <span className="policy-summary-item-label">Цель</span>
          <span className="policy-summary-item-value">
            {GOAL_LABELS[policy.goal]}
          </span>
        </div>
        <div className="policy-summary-item">
          <span className="policy-summary-item-label">Опыт</span>
          <span className="policy-summary-item-value">
            {EXPERIENCE_LABELS[policy.experience]}
          </span>
        </div>
      </div>

      <p className="policy-summary-note">
        На основе политики будет формироваться оценка сценариев.
        Это не рекомендация — это фильтр для тебя.
      </p>
    </div>
  );
}