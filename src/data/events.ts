// src/data/events.ts

export type EventType = 'cb-meeting' | 'coupon' | 'dividend' | 'tax' | 'other';

export interface InvestorEvent {
  id: string;
  date: string;              // ISO: YYYY-MM-DD
  type: EventType;
  title: string;             // «Заседание ЦБ РФ»
  description?: string;      // «Решение по ключевой ставке»
}

/**
 * Типы событий — иконки и цвета.
 */
export const EVENT_META: Record<EventType, { icon: string; label: string }> = {
  'cb-meeting': { icon: '🏛', label: 'Заседание ЦБ' },
  coupon: { icon: '💰', label: 'Купон' },
  dividend: { icon: '📈', label: 'Дивиденды' },
  tax: { icon: '🧾', label: 'Налог' },
  other: { icon: '📌', label: 'Событие' },
};

/**
 * Данные по умолчанию. Пользователь может добавить/изменить.
 *
 * ВАЖНО: даты должны быть в будущем, чтобы отображались.
 * После 2026 года — обновляй вручную или позже через парсинг.
 */
export const DEFAULT_EVENTS: InvestorEvent[] = [
  {
    id: 'cb-2026-10-24',
    date: '2026-10-24',
    type: 'cb-meeting',
    title: 'Заседание ЦБ РФ',
    description: 'Решение по ключевой ставке',
  },
  {
    id: 'coupon-2026-11-15',
    date: '2026-11-15',
    type: 'coupon',
    title: 'Выплата купона по ОФЗ 26218',
    description: 'Купон 8,5% годовых (квартальный)',
  },
  {
    id: 'cb-2026-12-18',
    date: '2026-12-18',
    type: 'cb-meeting',
    title: 'Заседание ЦБ РФ',
    description: 'Последнее заседание 2026 года',
  },
  {
    id: 'year-end-2026-12-31',
    date: '2026-12-31',
    type: 'other',
    title: 'Закрытие года',
    description: 'Итоги 2026, подача декларации',
  },
  {
    id: 'cb-2027-02-14',
    date: '2027-02-14',
    type: 'cb-meeting',
    title: 'Заседание ЦБ РФ',
    description: 'Первое заседание 2027',
  },
];

const STORAGE_KEY = 'golden-investor-events';

export function loadEvents(): InvestorEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('loadEvents: ошибка чтения, используем DEFAULT_EVENTS');
  }
  return DEFAULT_EVENTS;
}

export function saveEvents(events: InvestorEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

/**
 * Сколько дней до события (округление вниз).
 * Отрицательное значение = событие в прошлом.
 */
export function daysUntil(dateISO: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateISO);
  target.setHours(0, 0, 0, 0);

  const diff = target.getTime() - today.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Возвращает только будущие события (или сегодняшние), отсортированные по дате.
 */
export function getUpcomingEvents(events: InvestorEvent[], limit = 5): InvestorEvent[] {
  return events
    .filter((e) => daysUntil(e.date) >= 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
}

/**
 * Форматирование даты «24 окт 2026».
 */
export function formatEventDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Форматирование срока: «через 2 дня», «завтра», «сегодня».
 */
export function formatDaysUntil(days: number): string {
  if (days === 0) return 'сегодня';
  if (days === 1) return 'завтра';
  if (days >= 2 && days <= 4) return `через ${days} дня`;
  if (days >= 5) return `через ${days} дней`;
  return 'прошло';
}