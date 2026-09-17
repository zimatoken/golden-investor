// src/components/DurationRisk.tsx

import type { YieldCurvePoint } from '../data/manualMarket';
import { YIELD_CURVE_LABELS } from '../data/manualMarket';
import { buildDurationTable } from '../core/duration';

interface DurationRiskProps {
  curve: YieldCurvePoint[];
}

/**
 * Чувствительность цены ОФЗ к изменению ставки.
 *
 * Идея: длинные ОФЗ дают больше, но и теряют больше при росте ставки.
 * Показываем обе стороны — купон и риск тела.
 */
export function DurationRisk({ curve }: DurationRiskProps) {
  if (!curve || curve.length === 0) return null;

  const rows = buildDurationTable(curve, [12, 60, 120, 360], YIELD_CURVE_LABELS);

  if (rows.length === 0) return null;

  return (
    <div className="duration-risk">
      <div className="duration-risk-header">
        <h3>⚠️ Чувствительность к ставке</h3>
        <span className="duration-risk-source">
          Оценка для типичной ОФЗ
        </span>
      </div>

      <p className="duration-risk-intro">
        Если рыночная доходность изменится на 1 п.п., цена облигации изменится
        примерно на её дюрацию. Это работает в обе стороны.
      </p>

      <div className="duration-risk-table">
        <div className="duration-row duration-row-head">
          <div className="duration-cell duration-cell-label">Срок</div>
          <div className="duration-cell">+1%</div>
          <div className="duration-cell">+2%</div>
          <div className="duration-cell">−1%</div>
          <div className="duration-cell">−2%</div>
        </div>
        {rows.map((r) => (
          <div key={r.months} className="duration-row">
            <div className="duration-cell duration-cell-label">
              {r.label}
              <span className="duration-sub">
                D ≈ {r.duration.toFixed(1)}
              </span>
            </div>
            <div className="duration-cell duration-cell-neg">
              {r.plus1.toFixed(1)}%
            </div>
            <div className="duration-cell duration-cell-neg">
              {r.plus2.toFixed(1)}%
            </div>
            <div className="duration-cell duration-cell-pos">
              +{r.minus1.toFixed(1)}%
            </div>
            <div className="duration-cell duration-cell-pos">
              +{r.minus2.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      <div className="duration-risk-meaning">
        <strong>Что это значит?</strong> Если ставка вырастет на 1 п.п., 10-летние
        ОФЗ потеряют около 8% цены. Если ставка упадёт — наоборот, вырастут.
        Поэтому длинные ОФЗ — это <em>ставка на снижение ставки</em>, а не
        «просто высокая доходность».
      </div>

      <div className="duration-risk-warning">
        Точное значение зависит от конкретной облигации и её купона. Это
        приблизительная оценка, не прогноз.
      </div>
    </div>
  );
}