// src/core/marketRegime.ts

import type { MarketState } from '../data/manualMarket';

/**
 * Режимы рынка.
 *
 * ВАЖНО: Market Regime — это НЕ прогноз и НЕ сигнал BUY/SELL.
 * Это описание того, в какой среде мы сейчас находимся.
 */
export type MarketRegimeType =
  | 'INFLATION_SHOCK'           // Инфляция > 8% — защитные активы
  | 'HIGH_RATES_DISINFLATION'   // Ставка высокая + инфляция падает — окно ОФЗ
  | 'HIGH_RATES_STICKY'         // Ставка высокая + инфляция упрямая
  | 'LOW_RATES_STABLE'          // Ставка низкая + инфляция под контролем
  | 'CURVE_INVERTED_OR_FLAT'    // Кривая инвертирована или плоская
  | 'NEUTRAL';                  // Ничего явного

export interface MarketRegime {
  type: MarketRegimeType;
  icon: string;
  label: string;                  // «Высокие ставки, инфляция замедляется»
  shortLabel: string;             // «Высокие ставки ↓ инфляция»
  whatItMeans: string;            // Что это значит (факт)
  whatItDoesNotMean: string;      // Что это НЕ значит (честность)
  conditions: string[];           // Список условий, которые мы проверили
}

/**
 * Форма кривой доходности.
 */
type CurveShape = 'normal' | 'flat' | 'inverted' | 'unknown';

/**
 * Определяем форму кривой.
 */
function getCurveShape(market: MarketState): CurveShape {
  const curve = market.yieldCurve;
  if (!curve || curve.length < 2) return 'unknown';

  const sorted = [...curve].sort((a, b) => a.months - b.months);
  const short = sorted[0].yield;      // 3 мес
  const long = sorted[sorted.length - 1].yield;  // 30 лет
  const spread = long - short;

  if (spread < -0.5) return 'inverted';
  if (Math.abs(spread) < 1.5) return 'flat';
  return 'normal';
}

/**
 * Основная функция: определяем режим рынка.
 */
export function getMarketRegime(market: MarketState): MarketRegime {
  const realKeyRate = market.keyRate - market.inflation;
  const curveShape = getCurveShape(market);

  // ─── 1. Инфляционный шок ──────────────────────
  if (market.inflation > 8) {
    return {
      type: 'INFLATION_SHOCK',
      icon: '🔥',
      label: 'Инфляционный шок',
      shortLabel: 'Инфляция > 8%',
      whatItMeans: `Инфляция ${market.inflation}% — выше 8%. Покупательная способность денег в номинальных активах снижается быстро.`,
      whatItDoesNotMean:
        'Это не значит «срочно покупай золото». Защитные активы работают на длинном горизонте (10+ лет).',
      conditions: [
        `Инфляция ${market.inflation}% > 8%`,
        `Реальная ставка: ${realKeyRate.toFixed(2)} п.п.`,
        `Кривая доходности: ${curveShape === 'normal' ? 'нормальная' : curveShape === 'flat' ? 'плоская' : curveShape === 'inverted' ? 'инвертированная' : 'нет данных'}`,
      ],
    };
  }

  // ─── 2. Кривая инвертирована или плоская ──────
  if (curveShape === 'inverted' || curveShape === 'flat') {
    return {
      type: 'CURVE_INVERTED_OR_FLAT',
      icon: '⚠️',
      label: curveShape === 'inverted'
        ? 'Кривая доходности инвертирована'
        : 'Кривая доходности плоская',
      shortLabel: curveShape === 'inverted' ? 'Инверсия кривой' : 'Плоская кривая',
      whatItMeans:
        curveShape === 'inverted'
          ? 'Короткие ОФЗ доходнее длинных — нетипичная ситуация. Рынок не уверен в будущем.'
          : 'Разница между короткими и длинными ОФЗ небольшая. Рынок не видит явной премии за срок.',
      whatItDoesNotMean:
        'Это не значит «рынок упадёт». Инверсия — это состояние, а не предсказание.',
      conditions: [
        `Форма кривой: ${curveShape}`,
        `Ставка ${market.keyRate}%, инфляция ${market.inflation}%`,
        `Реальная ставка: ${realKeyRate.toFixed(2)} п.п.`,
      ],
    };
  }

  // ─── 3. Высокие ставки + инфляция замедляется ─
  if (market.keyRate >= 13 && market.inflation < 7 && realKeyRate > 2) {
    return {
      type: 'HIGH_RATES_DISINFLATION',
      icon: '📉',
      label: 'Высокие ставки, инфляция замедляется',
      shortLabel: 'Высокие ставки ↓ инфляция',
      whatItMeans: `Ставка ЦБ ${market.keyRate}%, инфляция ${market.inflation}% — реальная ставка ${realKeyRate.toFixed(2)} п.п. Это классическая среда, в которой длинные ОФЗ могут быть интересны.`,
      whatItDoesNotMean:
        'Это не прогноз роста ОФЗ. Если ставка не начнёт снижаться — купон останется единственным источником дохода. И если ставка вырастет — цена ОФЗ упадёт.',
      conditions: [
        `Ставка ${market.keyRate}% ≥ 13%`,
        `Инфляция ${market.inflation}% < 7%`,
        `Реальная ставка ${realKeyRate.toFixed(2)} п.п. > 2`,
        `Кривая доходности: ${curveShape === 'normal' ? 'нормальная' : curveShape}`,
      ],
    };
  }

  // ─── 4. Высокие ставки + инфляция упрямая ────
  if (market.keyRate >= 13 && market.inflation >= 7) {
    return {
      type: 'HIGH_RATES_STICKY',
      icon: '🧊',
      label: 'Высокие ставки, инфляция упрямая',
      shortLabel: 'Высокие ставки = инфляция',
      whatItMeans: `Ставка ЦБ ${market.keyRate}% — высокая, но инфляция ${market.inflation}% держится выше 7%. ЦБ пока не может снизить ставку.`,
      whatItDoesNotMean:
        'Это не значит «сиди в депозите». Это значит: ждать сигналов снижения инфляции, прежде чем принимать долгосрочные решения.',
      conditions: [
        `Ставка ${market.keyRate}% ≥ 13%`,
        `Инфляция ${market.inflation}% ≥ 7%`,
        `Реальная ставка ${realKeyRate.toFixed(2)} п.п.`,
      ],
    };
  }

  // ─── 5. Низкие ставки, стабильность ──────────
  if (market.keyRate < 10 && market.inflation < 6) {
    return {
      type: 'LOW_RATES_STABLE',
      icon: '📈',
      label: 'Низкие ставки, инфляция под контролем',
      shortLabel: 'Низкие ставки + стабильность',
      whatItMeans: `Ставка ЦБ ${market.keyRate}%, инфляция ${market.inflation}% — низкие. В такой среде классические депозиты дают низкую доходность, а активы с длинной дюрацией обычно растут.`,
      whatItDoesNotMean:
        'Это не значит «срочно покупай активы». Проверь свой Investment Policy: горизонт, допустимую просадку, ликвидность.',
      conditions: [
        `Ставка ${market.keyRate}% < 10%`,
        `Инфляция ${market.inflation}% < 6%`,
        `Реальная ставка ${realKeyRate.toFixed(2)} п.п.`,
      ],
    };
  }

  // ─── 6. Neutral (fallback) ────────────────────
  return {
    type: 'NEUTRAL',
    icon: '😴',
    label: 'Нейтральный режим',
    shortLabel: 'Ничего явного',
    whatItMeans: `Ставка ${market.keyRate}%, инфляция ${market.inflation}%. Явных сигналов нет — условия в норме.`,
    whatItDoesNotMean:
      'Это не значит «ничего не делать». Это значит: продолжай следить за данными ЦБ и не принимай импульсивных решений.',
    conditions: [
      `Ставка ${market.keyRate}%`,
      `Инфляция ${market.inflation}%`,
      `Кривая: ${curveShape}`,
    ],
  };
}