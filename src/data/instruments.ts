// src/data/instruments.ts

import type { InstrumentOption } from '../types/market';

export const INSTRUMENTS: InstrumentOption[] = [
  {
    id: 'ofz',
    icon: '📈',
    title: 'ОФЗ',
    subtitle: 'Гособлигации. Длинные выпуски сильнее реагируют на ставку',
  },
  {
    id: 'gold',
    icon: '🥇',
    title: 'Золото',
    subtitle: 'Защита от девальвации',
  },
  {
    id: 'deposit',
    icon: '🏦',
    title: 'Вклад',
    subtitle: 'Короткий, до 3 месяцев',
  },
];