// src/core/marketFetcher.ts

export interface MarketState {
  keyRate: number;           // Ключевая ставка %
  keyRateDate: string;
  goldPrice: number;         // Золото, руб/грамм
  goldDate: string;
  depositRate: number;       // Средняя максимальная ставка по вкладам %
  depositDate: string;
  ofz10y: number;            // Доходность 10-летних ОФЗ %
  ofzDate: string;
  updatedAt: string;
}

// CORS-прокси: обходим ограничение браузера
const PROXY = 'https://api.allorigins.win/raw?url=';
const CBR_KEY_RATE = 'https://www.cbr.ru/hd_base/KeyRate/';

/**
 * Ключевая ставка
 * У ЦБ нет прямого XML — парсим HTML
 */
async function fetchKeyRate(): Promise<{ rate: number; date: string }> {
  try {
    const url = PROXY + encodeURIComponent(CBR_KEY_RATE);
    const res = await fetch(url);
    const html = await res.text();
    
    const match = html.match(/(\d+[.,]\d+)\s*%/);
    if (match) {
      return { rate: parseFloat(match[1].replace(',', '.')), date: new Date().toISOString() };
    }
  } catch (e) {
    console.warn('[MarketFetcher] Ключевая ставка: ошибка, берём запасное значение');
  }
  
  // Запасное значение: текущая ставка на 11.09.2026
  return { rate: 14.0, date: '2026-07-24' };
}

/**
 * Цена золота
 * XML_metall.asp возвращает XML в windows-1251
 */
async function fetchGoldPrice(): Promise<{ price: number; date: string }> {
  try {
    const endDate = new Date();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const formatDate = (d: Date) => 
      `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    
    const url = PROXY + encodeURIComponent(
      `https://www.cbr.ru/scripts/XML_metall.asp?date_req1=${formatDate(startDate)}&date_req2=${formatDate(endDate)}`
    );
    
    const res = await fetch(url);
    const xml = await res.text();
    
    const goldMatch = xml.match(/CodMet="1"[^>]*price="([^"]+)"/);
    if (goldMatch) {
      return { price: parseFloat(goldMatch[1]), date: new Date().toISOString() };
    }
  } catch (e) {
    console.warn('[MarketFetcher] Золото: ошибка, берём запасное значение');
  }
  
  return { price: 7850, date: new Date().toISOString() };
}

/**
 * Главная функция: собрать все данные
 */
export async function fetchAllMarketData(): Promise<MarketState> {
  const [keyRate, gold] = await Promise.all([
    fetchKeyRate(),
    fetchGoldPrice(),
  ]);
  
  return {
    keyRate: keyRate.rate,
    keyRateDate: keyRate.date,
    goldPrice: gold.price,
    goldDate: gold.date,
    depositRate: 12.97,      // Вручную: мониторинг ЦБ
    depositDate: '2026-06-01',
    ofz10y: 15.9,            // Вручную: консенсус аналитиков
    ofzDate: '2026-09-08',
    updatedAt: new Date().toISOString(),
  };
}