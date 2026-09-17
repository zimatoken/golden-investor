// src/components/PolicyEditor.tsx

import { useState } from 'react';
import type {
  InvestmentPolicy,
  Horizon,
  DrawdownTolerance,
  LiquidityNeed,
  Goal,
  Experience,
} from '../types/policy';
import {
  HORIZON_LABELS,
  DRAWDOWN_LABELS,
  LIQUIDITY_LABELS,
  GOAL_LABELS,
  EXPERIENCE_LABELS,
} from '../types/policy';

interface PolicyEditorProps {
  open: boolean;
  initial: InvestmentPolicy;
  onSave: (policy: InvestmentPolicy) => void;
  onClose: () => void;
}

/**
 * Модалка редактирования политики.
 *
 * 5 вопросов. Занимает 2 минуты.
 */
export function PolicyEditor({ open, initial, onSave, onClose }: PolicyEditorProps) {
  const [draft, setDraft] = useState<InvestmentPolicy>(initial);

  if (!open) return null;

  const handleSave = () => {
    onSave({ ...draft, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="policy-editor-overlay" onClick={onClose}>
      <div className="policy-editor" onClick={(e) => e.stopPropagation()}>
        <div className="policy-editor-header">
          <h2>📋 Ваша политика</h2>
          <button className="policy-editor-close" onClick={onClose}>✕</button>
        </div>

        <p className="policy-editor-intro">
          Ответь один раз. Дальше приложение будет учитывать эти ответы
          при оценке сценариев. Руль остаётся у тебя.
        </p>

        {/* 1. Горизонт */}
        <div className="policy-editor-question">
          <label className="policy-editor-label">1. Горизонт инвестирования</label>
          <div className="policy-editor-options">
            {(Object.keys(HORIZON_LABELS) as Horizon[]).map((h) => (
              <button
                key={h}
                className={`policy-editor-option ${draft.horizon === h ? 'policy-editor-option-active' : ''}`}
                onClick={() => setDraft({ ...draft, horizon: h })}
              >
                {HORIZON_LABELS[h]}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Просадка */}
        <div className="policy-editor-question">
          <label className="policy-editor-label">2. Допустимая просадка</label>
          <div className="policy-editor-options">
            {(Object.keys(DRAWDOWN_LABELS) as DrawdownTolerance[]).map((d) => (
              <button
                key={d}
                className={`policy-editor-option ${draft.drawdownTolerance === d ? 'policy-editor-option-active' : ''}`}
                onClick={() => setDraft({ ...draft, drawdownTolerance: d })}
              >
                {DRAWDOWN_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Ликвидность */}
        <div className="policy-editor-question">
          <label className="policy-editor-label">3. Ликвидность</label>
          <div className="policy-editor-options">
            {(Object.keys(LIQUIDITY_LABELS) as LiquidityNeed[]).map((l) => (
              <button
                key={l}
                className={`policy-editor-option ${draft.liquidityNeed === l ? 'policy-editor-option-active' : ''}`}
                onClick={() => setDraft({ ...draft, liquidityNeed: l })}
              >
                {LIQUIDITY_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Цель */}
        <div className="policy-editor-question">
          <label className="policy-editor-label">4. Главная цель</label>
          <div className="policy-editor-options">
            {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
              <button
                key={g}
                className={`policy-editor-option ${draft.goal === g ? 'policy-editor-option-active' : ''}`}
                onClick={() => setDraft({ ...draft, goal: g })}
              >
                {GOAL_LABELS[g]}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Опыт */}
        <div className="policy-editor-question">
          <label className="policy-editor-label">5. Опыт</label>
          <div className="policy-editor-options">
            {(Object.keys(EXPERIENCE_LABELS) as Experience[]).map((e) => (
              <button
                key={e}
                className={`policy-editor-option ${draft.experience === e ? 'policy-editor-option-active' : ''}`}
                onClick={() => setDraft({ ...draft, experience: e })}
              >
                {EXPERIENCE_LABELS[e]}
              </button>
            ))}
          </div>
        </div>

        <div className="policy-editor-actions">
          <button className="policy-editor-btn-primary" onClick={handleSave}>
            ✓ Сохранить
          </button>
          <button className="policy-editor-btn-secondary" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}