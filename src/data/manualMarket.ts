// src/data/manualMarket.ts

/**
 * Точка кривой доходности ОФЗ.
 */
export interface YieldCurvePoint {
  /** Срок в месяцах: 3, 12, 24, 36, 60, 120, 240, 360 */
  months: number;
  /** Доходность к погашению, % годовых */
  yield: number;
}

/**
 * Сроки, которые мы показываем на кривой.
 * Соответствуют публикации ЦБ РФ.
 */
export const YIELD_CURVE_TENORS = [3, 12, 24, 36, 60, 120, 240, 360] as const;

/**
 * Человеко-читаемые подписи сроков.
 */
export const YIELD_CURVE_LABELS: Record<number, string> = {
  3: '3 мес',
  12: '1 год',
  24: '2 года',
  36: '3 года',
  60: '5 лет',
  120: '10 лет',
  240: '20 лет',
  360: '30 лет',
};

/**
 * Состояние рынка. Редактируется пользователем через UI.
 */
export interface MarketState {
  keyRate: number;           // Ключевая ставка ЦБ, %
  keyRateDate: string;       // Когда ставка установлена
  inflation: number;         // Инфляция, %
  yieldCurve: YieldCurvePoint[]; // Кривая доходности ОФЗ
  ofz10y: number;            // Доходность 10-летних ОФЗ, % (синхронизируется с yieldCurve[120])
  ofzShort: number;          // Доходность коротких ОФЗ, % (синхронизируется с yieldCurve[12])
  depositRate: number;       // Средняя ставка по вкладам, %
  goldPrice: number;         // Золото, руб/грамм
  nextCBDate: string;        // Дата следующего заседания ЦБ, YYYY-MM-DD
  updatedAt: string;         // Когда обновлено (ISO)
}

/**
 * Данные по умолчанию. Используются при первом запуске.
 * Yield curve — данные ЦБ РФ на 15.09.2026.
 */
export const DEFAULT_MARKET: MarketState = {
  keyRate: 14.0,
  keyRateDate: '2026-09-16',
  inflation: 6.5,
  yieldCurve: [
    { months: 3,   yield: 12.69 },
    { months: 12,  yield: 13.81 },
    { months: 24,  yield: 14.85 },
    { months: 36,  yield: 15.45 },
    { months: 60,  yield: 16.03 },
    { months: 120, yield: 16.36 },
    { months: 240, yield: 16.52 },
    { months: 360, yield: 16.61 },
  ],
  ofz10y: 16.36,
  ofzShort: 13.81,
  depositRate: 12.97,
  goldPrice: 7850,
  nextCBDate: '2026-10-24',
  updatedAt: new Date().toISOString(),
};

/**
 * Синхронизирует ofz10y и ofzShort из yieldCurve.
 * Возвращает НОВЫЙ объект (не мутирует).
 *
 * Если в yieldCurve нет нужной точки — оставляем as-is
 * (обратная совместимость со старыми данными).
 */
export function syncOfzFromCurve(state: MarketState): MarketState {
  const curve = state.yieldCurve ?? [];
  const y10 = curve.find((p) => p.months === 120);
  const y1 = curve.find((p) => p.months === 12);

  return {
    ...state,
    ofz10y: y10 ? y10.yield : state.ofz10y,
    ofzShort: y1 ? y1.yield : state.ofzShort,
  };
}

/**
 * Гарантирует, что в MarketState есть yieldCurve.
 * Если её нет (старые данные из localStorage) — подставляет DEFAULT.
 * Если есть, но неполная — дополняет недостающие точки из DEFAULT.
 */
export function ensureYieldCurve(state: MarketState): MarketState {
  const DEFAULT_CURVE = DEFAULT_MARKET.yieldCurve;

  if (!state.yieldCurve || !Array.isArray(state.yieldCurve) || state.yieldCurve.length === 0) {
    return { ...state, yieldCurve: DEFAULT_CURVE };
  }

  // Дополняем недостающие сроки из дефолта
  const byMonths = new Map(state.yieldCurve.map((p) => [p.months, p]));
  const merged = YIELD_CURVE_TENORS.map((m) => {
    const existing = byMonths.get(m);
    if (existing) return existing;
    const fallback = DEFAULT_CURVE.find((p) => p.months === m);
    return fallback ?? { months: m, yield: 0 };
  });

  return { ...state, yieldCurve: merged };
}

/**
 * Полная нормализация: приводит MarketState к корректному виду.
 * Применяет ensureYieldCurve и syncOfzFromCurve.
 */
export function normalizeMarket(state: MarketState): MarketState {
  return syncOfzFromCurve(ensureYieldCurve(state));
}

/**
 * Демо-данные. Оставлено для совместимости со старым кодом.
 * @deprecated Используй useMarketData()
 */
export const MANUAL_MARKET = DEFAULT_MARKET;