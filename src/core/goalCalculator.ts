// src/core/goalCalculator.ts

/**
 * Стратегия накопления.
 */
export interface Strategy {
  id: 'ofz' | 'mixed' | 'deposit';
  icon: string;
  title: string;
  annualReturn: number;  // % годовых
  risk: 'high' | 'medium' | 'low';
  /**
   * true — если доходность взята как сценарное допущение (не факт).
   * Отображается в UI как пометка «сценарий».
   */
  isScenario: boolean;
}

/**
 * Результат расчёта для одной стратегии.
 */
export interface StrategyResult {
  strategy: Strategy;
  monthlyPayment: number;       // Сколько нужно откладывать в месяц
  totalContributed: number;     // Сколько всего внесёшь
  totalInterest: number;        // Сколько накапает процентами
  willReach: boolean;           // Успеет ли при текущем платеже
  monthsToGoal: number;         // Сколько месяцев до цели
  finalAmount: number;          // Сколько накопится при текущем платеже
}

/**
 * Сценарная доходность для длинных ОФЗ.
 *
 * ВАЖНО: это НЕ прогноз. Это допущение: «если ставка ЦБ будет снижаться».
 * В реальности ОФЗ могут дать и больше, и меньше.
 */
const OFZ_SCENARIO_RETURN = 20;

/**
 * Возвращает актуальные стратегии с учётом рыночных данных.
 *
 * @param market — должен содержать market.depositRate (текущая ставка вклада)
 */
export function getStrategies(market: { depositRate: number }): Strategy[] {
  const deposit = market.depositRate;
  const ofz = OFZ_SCENARIO_RETURN;
  const mixed = (ofz + deposit) / 2;

  return [
    {
      id: 'ofz',
      icon: '🟢',
      title: '100% ОФЗ',
      annualReturn: ofz,
      risk: 'high',
      isScenario: true,
    },
    {
      id: 'mixed',
      icon: '🟡',
      title: '50% ОФЗ + 50% вклад',
      annualReturn: Math.round(mixed * 10) / 10,
      risk: 'medium',
      isScenario: true,
    },
    {
      id: 'deposit',
      icon: '🔴',
      title: '100% вклад',
      annualReturn: deposit,
      risk: 'low',
      isScenario: false,
    },
  ];
}

/**
 * Legacy-константа. Оставлена для обратной совместимости с кодом,
 * который ещё использует STRATEGIES напрямую.
 *
 * @deprecated — используй getStrategies(market).
 */
export const STRATEGIES: Strategy[] = [
  { id: 'ofz', icon: '🟢', title: '100% ОФЗ', annualReturn: 20, risk: 'high', isScenario: true },
  { id: 'mixed', icon: '🟡', title: '50% ОФЗ + 50% вклад', annualReturn: 16, risk: 'medium', isScenario: true },
  { id: 'deposit', icon: '🔴', title: '100% вклад', annualReturn: 12.5, risk: 'low', isScenario: false },
];

/**
 * Сколько нужно откладывать в месяц, чтобы достичь цели.
 *
 * Формула: PMT = (FV * r) / ((1 + r)^n - 1)
 * где:
 * - FV — будущая стоимость (цель)
 * - r — месячная ставка
 * - n — количество месяцев
 *
 * Платежи — ordinary annuity (в конце каждого месяца).
 */
export function calculateMonthlyPayment(
  goal: number,
  annualReturn: number,
  years: number,
  initialAmount: number = 0
): number {
  const r = annualReturn / 100 / 12;
  const n = years * 12;

  if (r === 0) {
    return (goal - initialAmount) / n;
  }

  const goalAfterInitial = goal - initialAmount * Math.pow(1 + r, n);

  if (goalAfterInitial <= 0) {
    return 0;
  }

  const pmt = (goalAfterInitial * r) / (Math.pow(1 + r, n) - 1);

  return pmt;
}

/**
 * Сколько накопится при текущем ежемесячном платеже.
 *
 * Формула: FV = PMT * ((1 + r)^n - 1) / r + initial * (1 + r)^n
 */
export function calculateFinalAmount(
  monthlyPayment: number,
  annualReturn: number,
  years: number,
  initialAmount: number = 0
): number {
  const r = annualReturn / 100 / 12;
  const n = years * 12;

  if (r === 0) {
    return initialAmount + monthlyPayment * n;
  }

  const annuityFV = monthlyPayment * (Math.pow(1 + r, n) - 1) / r;
  const initialFV = initialAmount * Math.pow(1 + r, n);

  return annuityFV + initialFV;
}

/**
 * Расчёт всех стратегий.
 *
 * @param market — для актуальных ставок (depositRate)
 */
export function calculateAllStrategies(
  market: { depositRate: number },
  goal: number,
  years: number,
  monthlyPayment: number,
  initialAmount: number = 0
): StrategyResult[] {
  const strategies = getStrategies(market);

  return strategies.map((strategy) => {
    const requiredPayment = calculateMonthlyPayment(
      goal,
      strategy.annualReturn,
      years,
      initialAmount
    );

    const finalAmount = calculateFinalAmount(
      monthlyPayment,
      strategy.annualReturn,
      years,
      initialAmount
    );

    const willReach = finalAmount >= goal;
    const totalContributed = initialAmount + monthlyPayment * years * 12;
    const totalInterest = finalAmount - totalContributed;

    // Месяцев до цели при текущем платеже
    let monthsToGoal = years * 12;
    if (monthlyPayment > 0) {
      let balance = initialAmount;
      const r = strategy.annualReturn / 100 / 12;
      let months = 0;
      // Ограничение 30 лет — выше уже не «месяцев до цели», а «до скончания века»
      while (balance < goal && months < 360) {
        balance = balance * (1 + r) + monthlyPayment;
        months++;
      }
      monthsToGoal = months;
    }

    return {
      strategy,
      monthlyPayment: requiredPayment,
      totalContributed,
      totalInterest,
      willReach,
      monthsToGoal,
      finalAmount,
    };
  });
}

/**
 * Форматирование денег.
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Форматирование срока (месяцы → «X лет Y мес»).
 */
export function formatDuration(months: number): string {
  if (months >= 360) {
    return 'более 30 лет';
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) return `${remainingMonths} мес`;
  if (remainingMonths === 0) return `${years} лет`;
  return `${years} лет ${remainingMonths} мес`;
}