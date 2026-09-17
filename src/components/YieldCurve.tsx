// src/components/YieldCurve.tsx

import type { YieldCurvePoint } from '../data/manualMarket';
import { YIELD_CURVE_LABELS } from '../data/manualMarket';

interface YieldCurveProps {
  points: YieldCurvePoint[];
}

/**
 * Кривая доходности ОФЗ — CSS-бары.
 *
 * Идея: чем длиннее срок — тем выше доходность.
 * Показывает пользователю, что «длинные ОФЗ» = выше доходность + выше риск.
 */
export function YieldCurve({ points }: YieldCurveProps) {
  if (!points || points.length === 0) {
    return (
      <div className="yield-curve-empty">
        Нет данных кривой доходности. Обнови данные ЦБ.
      </div>
    );
  }

  const yields = points.map((p) => p.yield);
  const maxYield = Math.max(...yields);
  const minYield = Math.min(...yields);
  const spread = maxYield - minYield;

  // Нормализация ширины бара: от 40% до 100%
  const denom = maxYield - minYield;
  const widthPct = (y: number) => (denom === 0 ? 100 : 40 + ((y - minYield) / denom) * 60);

  // Форма кривой
  const first = points[0];
  const last = points[points.length - 1];
  const isNormal = last.yield > first.yield;
  const isFlat = spread < 1.5;
  const isInverted = last.yield < first.yield;

  // Текст «что это значит»
  let meaning = '';
  if (isFlat) {
    meaning =
      'Кривая почти плоская: рынок не видит большой разницы между короткими и длинными сроками.';
  } else if (isNormal) {
    meaning = `Чем длиннее срок — тем выше доходность. Разница между 3 мес и 30 лет: ${spread.toFixed(2)} п.п. Это премия за длинный срок и риск.`;
  } else if (isInverted) {
    meaning =
      'Кривая инвертирована: короткие ОФЗ доходнее длинных. Это нетипичная ситуация — сигнал неопределённости.';
  }

  return (
    <div className="yield-curve">
      <div className="yield-curve-header">
        <h3>Кривая доходности ОФЗ</h3>
        <span className="yield-curve-source">Источник: ЦБ РФ</span>
      </div>

      <div className="yield-curve-bars">
        {points.map((p) => (
          <div key={p.months} className="yield-curve-row">
            <div className="yield-curve-label">
              {YIELD_CURVE_LABELS[p.months] ?? `${p.months} мес`}
            </div>
            <div className="yield-curve-bar-wrap">
              <div
                className="yield-curve-bar"
                style={{ width: `${widthPct(p.yield)}%` }}
              />
            </div>
            <div className="yield-curve-value">{p.yield.toFixed(2)}%</div>
          </div>
        ))}
      </div>

      <div className="yield-curve-meaning">
        <strong>Что это значит?</strong> {meaning}
      </div>

      <div className="yield-curve-warning">
        Доходность ОФЗ — это не прогноз. Если ставка вырастет, цена длинных ОФЗ упадёт.
      </div>
    </div>
  );
}