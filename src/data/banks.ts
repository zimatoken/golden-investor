// src/data/banks.ts

export interface BankRate {
  id: string;                    // 'cbr' | 'sber' | 'alfa' | 'tbank' | 'vtb'
  name: string;                  // Отображаемое имя
  icon: string;                  // Emoji
  keyRate?: number;              // Ключевая ставка ЦБ, % (только для ЦБ РФ)
  ofz10y?: number;               // Доходность 10-летних ОФЗ, %
  gold?: number;                 // Золото, руб/грамм
  deposit?: number;              // Ставка по вкладу, %
  note?: string;                 // Примечание (например, "онлайн-вклад")
}

/**
 * Данные банков и бирж.
 * 
 * Обновляются вручную через UI. Позже — через парсинг сайтов.
 * 
 * Источники:
 * - ЦБ РФ: cbr.ru
 * - Сбер: sberbank.ru
 * - Альфа: alfabank.ru
 * - Т-Банк: tbank.ru
 * - ВТБ: vtb.ru
 */
export const DEFAULT_BANKS: BankRate[] = [
  {
    id: 'cbr',
    name: 'ЦБ РФ',
    icon: '🏛',
    keyRate: 14.0,
    ofz10y: 15.9,
    note: 'Официальные данные',
  },
  {
    id: 'sber',
    name: 'Сбербанк',
    icon: '🟢',
    ofz10y: 14.2,
    deposit: 13.5,
    note: 'Вклад «Лучший %»',
  },
  {
    id: 'alfa',
    name: 'Альфа-Банк',
    icon: '🔴',
    deposit: 14.0,
    note: 'Вклад «Альфа-Счёт»',
  },
  {
    id: 'tbank',
    name: 'Т-Банк',
    icon: '🟡',
    deposit: 13.8,
    note: 'Вклад «Т-Банк»',
  },
  {
    id: 'vtb',
    name: 'ВТБ',
    icon: '🟣',
    ofz10y: 15.1,
    deposit: 13.2,
    note: 'Вклад «ВТБ-Вклад»',
  },
];

/**
 * Загружает данные банков из localStorage или возвращает DEFAULT_BANKS.
 */
export function loadBanks(): BankRate[] {
  try {
    const raw = localStorage.getItem('golden-investor-banks');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('loadBanks: ошибка чтения, используем DEFAULT_BANKS');
  }
  return DEFAULT_BANKS;
}

/**
 * Сохраняет данные банков в localStorage.
 */
export function saveBanks(banks: BankRate[]): void {
  localStorage.setItem('golden-investor-banks', JSON.stringify(banks));
}