// src/components/ActionGuide.tsx

import type { InstrumentType } from '../types/market';
import { ACTION_GUIDES } from '../data/actionGuides';

interface ActionGuideProps {
  instrument: InstrumentType;
}

/**
 * Пошаговый гайд по покупке выбранного инструмента.
 *
 * Показывается в конце ActionScreen, под Monte Carlo.
 * Не является инвестиционной рекомендацией.
 */
export function ActionGuide({ instrument }: ActionGuideProps) {
  const guide = ACTION_GUIDES[instrument];
  if (!guide) return null;

  return (
    <div className="action-guide">
      <div className="action-guide-header">
        <h3>{guide.title}</h3>
        <p className="action-guide-subtitle">{guide.subtitle}</p>
      </div>

      <ol className="action-guide-steps">
        {guide.steps.map((step, i) => (
          <li key={i} className="action-guide-step">
            <div className="action-guide-step-number">{i + 1}</div>
            <div className="action-guide-step-content">
              <div className="action-guide-step-title">{step.title}</div>
              <div className="action-guide-step-description">{step.description}</div>
              {step.note && (
                <div className="action-guide-step-note">{step.note}</div>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="action-guide-disclaimer">{guide.disclaimer}</div>
    </div>
  );
}