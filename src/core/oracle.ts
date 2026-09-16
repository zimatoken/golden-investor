// src/core/oracle.ts

import type { MarketState } from '../data/manualMarket';
import type { PlanRow } from '../types/market';

/**
 * Уровень уверенности рекомендации.
 */
export type OracleLevel = 'act' | 'wait' | 'danger';

/**
 * Результат работы оракула.
 */
export interface OracleAdvice {
  level: OracleLevel;
  icon: string;
  title: string;           // Заголовок («Совет на сентябрь 2026»)
  headline: string;        // Главная мысль (1 предложение)
  reasoning: string[];     // Логика (2-4 пункта)
  action?: string;         // Что делать («Проверь карту →»)
  warning?: string;        // Предупреждение
}

const MONTH_NAMES = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
];

function getCurrentMonth(): string {
  const m = new Date().getMonth();
  return MONTH_NAMES[m];
}

function formatPct(v: number, signed = true): string {
  const sign = signed && v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

/**
 * Главный движок анализа. 12 правил.
 * 
 * Приоритеты (сверху вниз):
 * 1. КРИТИЧЕСКИЕ — ставка ниже инфляции, отрицательная реальная доходность
 * 2. ОКНА ВОЗМОЖНОСТЕЙ — большая разница между инструментами
 * 3. ОЖИДАНИЕ — нет явных сигналов
 */
export function getOracleAdvice(
  market: MarketState,
  plan: PlanRow[] = []
): OracleAdvice {
  const month = getCurrentMonth();

  // Производные метрики
  const realDeposit = market.depositRate - market.inflation;      // реальная ставка вклада
  const realKeyRate = market.keyRate - market.inflation;          // реальная ключевая
  const ofzSpread = market.ofz10y - market.depositRate;           // ОФЗ vs вклад      // placeholder (нет % по золоту)

  // Правило 1: Ставка ниже инфляции — деньги «горят»
  if (market.keyRate < market.inflation) {
    return {
      level: 'danger',
      icon: '🔥',
      title: `Совет на ${month} 2026`,
      headline: `Ставка (${market.keyRate}%) ниже инфляции (${market.inflation}%). Деньги сгорают.`,
      reasoning: [
        `Реальная ключевая ставка: ${formatPct(realKeyRate)} — отрицательная.`,
        `Реальная ставка вклада: ${formatPct(realDeposit)}. Депозит не защищает от инфляции.`,
        `Это состояние — сигнал: нужно уходить в защитные активы.`,
      ],
      action: `Проверь «🗺 Карта» — есть ли там сценарий на случай роста инфляции`,
      warning: `Классические депозиты и ОФЗ в такой среде проигрывают. Смотри золото, валютные активы.`,
    };
  }

  // Правило 2: Реальная ставка вклада < 0 — вклад бесполезен
  if (realDeposit < 0) {
    return {
      level: 'danger',
      icon: '🚨',
      title: `Совет на ${month} 2026`,
      headline: `Вклад (${market.depositRate}%) ниже инфляции (${market.inflation}%). Вклад не имеет смысла.`,
      reasoning: [
        `Реальная доходность вклада: ${formatPct(realDeposit)}.`,
        `Ключевая ставка: ${market.keyRate}% — реальная ${formatPct(realKeyRate)}.`,
        `ОФЗ 10л: ${market.ofz10y}% — реальная ${formatPct(market.ofz10y - market.inflation)}.`,
      ],
      action: `Рассмотри длинные ОФЗ или золото`,
      warning: `Держать деньги в депозите при такой инфляции — терять покупательную способность.`,
    };
  }

  // Правило 3: ОФЗ выгоднее вклада на 3%+ — окно возможностей
  if (ofzSpread >= 3 && realKeyRate > 0) {
    return {
      level: 'act',
      icon: '🟢',
      title: `Совет на ${month} 2026`,
      headline: `ОФЗ (${market.ofz10y}%) выгоднее вклада (${market.depositRate}%) на ${formatPct(ofzSpread)}.`,
      reasoning: [
        `Разница между ОФЗ и вкладом: ${formatPct(ofzSpread)} — существенное преимущество.`,
        `Ключевая ставка ${market.keyRate}% — реальная ${formatPct(realKeyRate)}.`,
        `Если ЦБ снизит ставку — цена длинных ОФЗ вырастет дополнительно.`,
      ],
      action: plan.length > 0
        ? `Открой «🗺 Карта» — если там записан сценарий на снижение ставки, действуй`
        : `Открой «🗺 Карта» и запиши план: «если ставка упадёт — покупаю ОФЗ»`,
      warning: `Если ставка не упадёт — получишь только купон. Это ${market.keyRate}% годовых.`,
    };
  }

  // Правило 4: ОФЗ выгоднее вклада на 1,5–3% — окно приоткрыто
  if (ofzSpread >= 1.5 && realKeyRate > 0) {
    return {
      level: 'act',
      icon: '🟢',
      title: `Совет на ${month} 2026`,
      headline: `ОФЗ (${market.ofz10y}%) немного выгоднее вклада (${market.depositRate}%).`,
      reasoning: [
        `Разница: ${formatPct(ofzSpread)} — есть смысл рассмотреть ОФЗ.`,
        `Реальная ключевая ставка: ${formatPct(realKeyRate)} — положительная.`,
        `Риск: если ставка останется высокой — тело ОФЗ не вырастет.`,
      ],
      action: `Сравни со своим планом в «🗺 Карта»`,
      warning: `Разница небольшая. Убедись, что готов держать ОФЗ долго (1-3 года).`,
    };
  }

  // Правило 5: Вклад существенно выгоднее ОФЗ — нет смысла рисковать
  if (ofzSpread <= -1 && market.depositRate > market.inflation) {
    return {
      level: 'wait',
      icon: '🟡',
      title: `Совет на ${month} 2026`,
      headline: `Вклад (${market.depositRate}%) выгоднее ОФЗ (${market.ofz10y}%). Не рискуй.`,
      reasoning: [
        `Разница: ${formatPct(ofzSpread)} — ОФЗ проигрывают.`,
        `Реальная ставка вклада: ${formatPct(realDeposit)} — деньги сохраняются.`,
        `ОФЗ имеют риск просадки при росте ставки — а это невыгодно.`,
      ],
      action: `Оставайся в депозите, жди`,
      warning: `Не перекладывай в ОФЗ только потому, что «это модно». Цифры против.`,
    };
  }

  // Правило 6: Высокая инфляция (выше 8%) + ключевая ставка растёт
  if (market.inflation > 8 && market.keyRate > market.inflation) {
    return {
      level: 'wait',
      icon: '🟡',
      title: `Совет на ${month} 2026`,
      headline: `Инфляция ${market.inflation}% — ЦБ держит ставку ${market.keyRate}% для охлаждения.`,
      reasoning: [
        `Разница ставка-инфляция: ${formatPct(market.keyRate - market.inflation)} — реальная положительная.`,
        `Это значит, что деньги в депозите не сгорают, но и не растут.`,
        `Ждём сигнала от ЦБ — возможно, снижения ставки в будущем.`,
      ],
      action: `Держи депозит, наблюдай за заседаниями ЦБ`,
      warning: `В такой среде рискованные активы (ОФЗ, акции) могут падать. Не торопись.`,
    };
  }

  // Правило 7: Низкая инфляция (< 5%) + ставка падает — окно ОФЗ
  if (market.inflation < 5 && market.keyRate <= market.ofz10y) {
    return {
      level: 'act',
      icon: '🟢',
      title: `Совет на ${month} 2026`,
      headline: `Инфляция ${market.inflation}%, ставка ${market.keyRate}% — окно для ОФЗ.`,
      reasoning: [
        `Низкая инфляция + ставка ниже доходности ОФЗ — классический сигнал для длинных ОФЗ.`,
        `Купон + возможный рост тела дают хорошую полную доходность.`,
        `Риск ограничен: инфляция контролируется.`,
      ],
      action: `Проверь «🗺 Карта» — рассмотри длинные ОФЗ`,
      warning: `Если ставка резко вырастет — цена ОФЗ упадёт. Но при инфляции ${market.inflation}% это маловероятно.`,
    };
  }

  // Правило 8: Ключевая ставка выше 15% — «пик цикла»
  if (market.keyRate >= 15) {
    return {
      level: 'act',
      icon: '🟢',
      title: `Совет на ${month} 2026`,
      headline: `Ставка ${market.keyRate}% — на пике. Время для вклада, не для ОФЗ.`,
      reasoning: [
        `Когда ставка на пике — вклад даёт максимум ${market.depositRate}%.`,
        `Длинные ОФЗ выгодно покупать, когда ставка уже начала падать.`,
        `Ждём первых сигналов снижения — тогда перекладываемся в ОФЗ.`,
      ],
      action: `Держи деньги в коротком депозите (3-6 мес), жди снижения ставки`,
      warning: `Не покупай длинные ОФЗ сейчас — если ставка упадёт, они вырастут. Но если она ещё вырастет — потеряешь.`,
    };
  }

  // Правило 9: Ключевая ставка ниже 10% — ставка на рост активов
  if (market.keyRate < 10 && market.inflation < 6) {
    return {
      level: 'act',
      icon: '🟢',
      title: `Совет на ${month} 2026`,
      headline: `Ставка ${market.keyRate}% — низкая. Депозиты невыгодны, активы растут.`,
      reasoning: [
        `При ставке ${market.keyRate}% депозит даёт реальную ${formatPct(realDeposit)}.`,
        `В такой среде растут акции, недвижимость, ОФЗ.`,
        `Инфляция ${market.inflation}% — контролируется.`,
      ],
      action: `Рассмотри длинные ОФЗ, фонды акций`,
      warning: `Депозиты теряют смысл. Если держишь деньги там — перекладывай.`,
    };
  }

  // Правило 10: Золото как защита при высокой инфляции
  if (market.inflation > 7 && market.goldPrice > 0) {
    return {
      level: 'wait',
      icon: '🥇',
      title: `Совет на ${month} 2026`,
      headline: `Инфляция ${market.inflation}% — золото может быть защитой.`,
      reasoning: [
        `Золото исторически защищает от инфляции.`,
        `Текущая цена: ${market.goldPrice.toLocaleString('ru-RU')} ₽/грамм.`,
        `Но: золото не платит купон. Только рост цены.`,
      ],
      action: `Рассмотри ОМС (от 0,1 грамма) или БПИФ золота`,
      warning: `Не вкладывай всё в золото — это страховка, а не двигатель дохода.`,
    };
  }

  // Правило 11: Расхождение вкладов между банками > 1%
  if (market.depositRate > 0) {
    // Здесь позже подтянем реальные данные из BanksTable
    return {
      level: 'wait',
      icon: '🏦',
      title: `Совет на ${month} 2026`,
      headline: `Средняя ставка по вкладам: ${market.depositRate}%. Проверь разброс между банками.`,
      reasoning: [
        `Разные банки дают разные ставки — от 13% до 14,5%.`,
        `Разница может достигать 1,5% — это ощутимая сумма за год.`,
        `Проверь таблицу банков ниже.`,
      ],
      action: `Открой таблицу банков → выбери максимальную ставку`,
      warning: `Не держи всё в одном банке. Лимит страховки АСВ — 1,4 млн ₽.`,
    };
  }

  // Правило 12 (fallback): Нет явных сигналов
  return {
    level: 'wait',
    icon: '😴',
    title: `Совет на ${month} 2026`,
    headline: `Явных сигналов нет. Продолжай наблюдать.`,
    reasoning: [
      `Ставка: ${market.keyRate}%, инфляция: ${market.inflation}%.`,
      `ОФЗ: ${market.ofz10y}%, вклад: ${market.depositRate}%.`,
      `Соотношения в норме — не время для резких решений.`,
    ],
    action: `Следующий сигнал — заседание ЦБ ${market.nextCBDate}`,
  };
}