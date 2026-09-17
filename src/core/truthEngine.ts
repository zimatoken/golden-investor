// src/core/truthEngine.ts

import type { MarketState, Scenario } from '../types/market';

/**
 * Три сценария — всегда три. Никогда один.
 * Никаких «25-30%» крупным шрифтом. Только честные цифры.
 */
export function calculateTruthScenarios(
  instrument: 'ofz' | 'gold' | 'deposit',
  market: MarketState
): Scenario[] {
  
  if (instrument === 'ofz') {
    return [
      {
        label: 'optimistic',
        title: 'Ставка падает до 12,5%',
        probability: 35,
        outcome: 'Цена ОФЗ растёт, купон + рост тела',
        totalReturn: 26.0,
        isWorseThanDeposit: false,
      },
      {
        label: 'base',
        title: 'Ставка падает до 13,5%',
        probability: 40,
        outcome: 'Умеренный рост тела облигации',
        totalReturn: 16.0,
        isWorseThanDeposit: false,
      },
      {
        label: 'pessimistic',
        title: 'Ставка остаётся 14%',
        probability: 25,
        outcome: 'Только купон, тело стоит на месте',
        totalReturn: 8.5,
        isWorseThanDeposit: 8.5 < market.depositRate, // ← вот это главное
      },
    ];
  }

  if (instrument === 'gold') {
    return [
      {
        label: 'optimistic',
        title: 'Геополитика ухудшается, ЦБ покупают золото',
        probability: 30,
        outcome: 'Цена растёт до 16 000 руб/грамм',
        totalReturn: 45.0,
        isWorseThanDeposit: false,
      },
      {
        label: 'base',
        title: 'Умеренный рост',
        probability: 45,
        outcome: 'Цена растёт до 10 000 руб/грамм',
        totalReturn: 27.0,
        isWorseThanDeposit: false,
      },
      {
        label: 'pessimistic',
        title: 'Геополитика стабилизируется',
        probability: 25,
        outcome: 'Цена падает до 6 500 руб/грамм',
        totalReturn: -17.0,
        isWorseThanDeposit: true, // ← золото может упасть
      },
    ];
  }

  // Депозит — скучный, но честный
  return [
    {
      label: 'base',
      title: 'Депозит 3 месяца, потом продление',
      probability: 100,
      outcome: 'Ставка фиксирована на короткий срок',
      totalReturn: market.depositRate,
      isWorseThanDeposit: false,
    },
  ];
}

/**
 * Определяем статус: можно действовать или нет
 */
export function deriveStatus(market: MarketState): 'act' | 'wait' | 'do-nothing' {
  const today = new Date().toISOString().slice(0, 10);

/**
 * Определяет статус: можно действовать или нет.
 *
 * ВАЖНО: это упрощённая логика. В PHASE 2 будет заменена на Market Regime
 * (см. AUDIT_V4.md). Сейчас статус — это агрегат трёх условий:
 *   1. День заседания ЦБ — не действуем.
 *   2. Инфляция > 7% — не действуем.
 *   3. Ставка 13%+ и инфляция < 6.5% — потенциальное окно.
 */  

  // День заседания ЦБ — никогда не действуем
  if (today === market.nextCBDate) {
    return 'do-nothing';
  }

  // Инфляция высокая — ждём
  if (market.inflation > 7) {
    return 'do-nothing';
  }

  // Ставка высокая, но инфляция падает — окно возможностей
  if (market.keyRate >= 13 && market.inflation < 6.5) {
    return 'act';
  }

  return 'wait';
}