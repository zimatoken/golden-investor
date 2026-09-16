// src/data/sources.ts

export interface Source {
  url: string;
  label: string;
  description: string;
}

/**
 * Официальные источники данных.
 * Используются для кнопок «🔗 Открыть источник» рядом с полями.
 */
export const MARKET_SOURCES: Record<string, Source> = {
  keyRate: {
    url: 'https://www.cbr.ru/hd_base/KeyRate/',
    label: 'Ключевая ставка ЦБ',
    description: 'Официальная таблица ЦБ РФ',
  },
  inflation: {
    url: 'https://www.cbr.ru/statistics/',
    label: 'Инфляция',
    description: 'Раздел статистики ЦБ РФ',
  },
  ofz10y: {
    url: 'https://www.cbr.ru/hd_base/zcyc_params/',
    label: 'Кривая доходности ОФЗ',
    description: 'Параметры кривой бескупонной доходности',
  },
  ofzShort: {
    url: 'https://www.cbr.ru/hd_base/zcyc_params/',
    label: 'Короткие ОФЗ',
    description: 'Кривая доходности, короткий конец',
  },
  depositRate: {
    url: 'https://www.cbr.ru/statistics/bank_sector/',
    label: 'Средняя ставка по вкладам',
    description: 'Банковский сектор, мониторинг',
  },
  goldPrice: {
    url: 'https://www.cbr.ru/hd_base/metall/',
    label: 'Учётная цена золота',
    description: 'Раздел металлов ЦБ РФ',
  },
  nextCBDate: {
    url: 'https://www.cbr.ru/dkp/cal_mp/',
    label: 'Календарь заседаний ЦБ',
    description: 'Даты заседаний Совета директоров',
  },
};

/**
 * Ссылки на страницы вкладов банков.
 */
export const BANK_SOURCES: Record<string, Source> = {
  cbr: {
    url: 'https://www.cbr.ru/',
    label: 'ЦБ РФ',
    description: 'Официальный сайт',
  },
  sber: {
    url: 'https://www.sberbank.ru/ru/person/contributions',
    label: 'Сбербанк — Вклады',
    description: 'Актуальные ставки по вкладам',
  },
  alfa: {
    url: 'https://alfabank.ru/make-money/deposits/',
    label: 'Альфа-Банк — Вклады',
    description: 'Все вклады и накопительные счета',
  },
  tbank: {
    url: 'https://www.tbank.ru/savings/deposit/',
    label: 'Т-Банк — Вклады',
    description: 'Вклады и накопительные счета',
  },
  vtb: {
    url: 'https://www.vtb.ru/person/vklady/',
    label: 'ВТБ — Вклады',
    description: 'Вклады для физических лиц',
  },
};

/**
 * Общий список «Все источники».
 * Используется для модалки «📚 Все источники».
 */
export const ALL_SOURCES: { group: string; items: Source[] }[] = [
  {
    group: 'ЦБ РФ',
    items: [
      MARKET_SOURCES.keyRate,
      MARKET_SOURCES.inflation,
      MARKET_SOURCES.ofz10y,
      MARKET_SOURCES.depositRate,
      MARKET_SOURCES.goldPrice,
      MARKET_SOURCES.nextCBDate,
    ],
  },
  {
    group: 'Банки — вклады',
    items: [
      BANK_SOURCES.sber,
      BANK_SOURCES.alfa,
      BANK_SOURCES.tbank,
      BANK_SOURCES.vtb,
    ],
  },
];

/**
 * Открывает ссылку в новой вкладке.
 */
export function openSource(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}