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
 * Три стратегии накопления.
 */
export const STRATEGIES: Strategy[] = [
  {
    id: 'ofz',
    icon: '🟢',
    title: '100% ОФЗ',
    annualReturn: 20,
    risk: 'high',
  },
  {
    id: 'mixed',
    icon: '🟡',
    title: '50% ОФЗ + 50% вклад',
    annualReturn: 16,
    risk: 'medium',
  },
  {
    id: 'deposit',
    icon: '🔴',
    title: '100% вклад',
    annualReturn: 12.5,
    risk: 'low',
  },
];

/**
 * Сколько нужно откладывать в месяц, чтобы достичь цели.
 * 
 * Формула: PMT = (FV * r) / ((1 + r)^n - 1) / (1 + r)
 * где:
 * - FV — будущая стоимость (цель)
 * - r — месячная ставка
 * - n — количество месяцев
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
    // Простой случай — без процентов
    return (goal - initialAmount) / n;
  }

  // Учитываем начальную сумму
  const goalAfterInitial = goal - initialAmount * Math.pow(1 + r, n);

  if (goalAfterInitial <= 0) {
    // Начальной суммы достаточно
    return 0;
  }

  // Обратная формула аннуитета
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
 * Расчёт всех трёх стратегий.
 */
export function calculateAllStrategies(
  goal: number,
  years: number,
  monthlyPayment: number,
  initialAmount: number = 0
): StrategyResult[] {
  return STRATEGIES.map((strategy) => {
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

    // Сколько всего внесёшь
    const totalContributed = initialAmount + monthlyPayment * years * 12;

    // Сколько накапает процентами
    const totalInterest = finalAmount - totalContributed;

    // Месяцев до цели при текущем платеже
    let monthsToGoal = years * 12;
    if (monthlyPayment > 0) {
      let balance = initialAmount;
      const r = strategy.annualReturn / 100 / 12;
      let months = 0;
      while (balance < goal && months < 1200) {
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
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) return `${remainingMonths} мес`;
  if (remainingMonths === 0) return `${years} лет`;
  return `${years} лет ${remainingMonths} мес`;
}