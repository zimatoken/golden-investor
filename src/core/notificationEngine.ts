// src/core/notificationEngine.ts

import { loadEvents, daysUntil, type InvestorEvent } from '../data/events';

const SHOWN_KEY = 'golden-investor-notifications-shown';

/**
 * Сколько дней до события — включаем напоминание.
 */
const REMIND_DAYS = [3, 1]; // за 3 дня и за 1 день

/**
 * Возвращает события, о которых надо напомнить СЕГОДНЯ.
 * Каждое событие напоминается один раз в день.
 */
export function getTodayReminders(): InvestorEvent[] {
  const events = loadEvents();
  const shownToday = getShownToday();

  const reminders: InvestorEvent[] = [];

  for (const event of events) {
    const days = daysUntil(event.date);

    if (REMIND_DAYS.includes(days)) {
      const key = `${event.id}::${days}`;
      if (!shownToday.includes(key)) {
        reminders.push(event);
      }
    }
  }

  return reminders;
}

/**
 * Помечает напоминание как показанное.
 */
export function markAsShown(eventId: string, days: number): void {
  const shown = getShownToday();
  shown.push(`${eventId}::${days}`);

  const all = loadShown();
  all.push({
    date: new Date().toISOString().slice(0, 10),
    keys: shown,
  });

  // Оставляем только последние 7 дней
  const recent = all.slice(-7);
  localStorage.setItem(SHOWN_KEY, JSON.stringify(recent));
}

/**
 * Очищает старые записи.
 */
export function cleanupShown(): void {
  const all = loadShown();
  const recent = all.slice(-7);
  localStorage.setItem(SHOWN_KEY, JSON.stringify(recent));
}

/* ─── Внутренние функции ────────────────── */

interface ShownRecord {
  date: string;
  keys: string[];
}

function loadShown(): ShownRecord[] {
  try {
    const raw = localStorage.getItem(SHOWN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getShownToday(): string[] {
  const today = new Date().toISOString().slice(0, 10);
  const all = loadShown();
  const record = all.find((r) => r.date === today);
  return record?.keys || [];
}

/**
 * Форматирует текст напоминания.
 */
export function formatReminderText(event: InvestorEvent, days: number): { title: string; body: string } {
  const icon = event.type === 'cb-meeting' ? '🏛' : event.type === 'coupon' ? '💰' : '📌';
  const daysLabel = days === 0 ? 'Сегодня' : days === 1 ? 'Завтра' : `Через ${days} дня`;

  return {
    title: `${icon} ${event.title}`,
    body: `${daysLabel} — ${event.date}. ${event.description || 'Проверь свой план в «🗺 Карта»'}`,
  };
}