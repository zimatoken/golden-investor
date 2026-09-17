// src/hooks/useNotifications.ts

import { useCallback, useEffect, useState } from 'react';
import {
  getTodayReminders,
  markAsShown,
  cleanupShown,
  formatReminderText,
} from '../core/notificationEngine';
import type { InvestorEvent } from '../data/events';

export type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface NotificationResult {
  event: InvestorEvent;
  days: number;
  title: string;
  body: string;
}

export function useNotifications() {
  const [permission, setPermission] = useState<PermissionState>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as PermissionState;
  });

  // Напоминания, которые не удалось показать системно — покажем баннером в приложении
  const [bannerReminders, setBannerReminders] = useState<NotificationResult[]>([]);

  /**
   * Запросить разрешение у пользователя.
   */
  const requestPermission = useCallback(async (): Promise<PermissionState> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return 'unsupported';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);
      return result as PermissionState;
    } catch (e) {
      console.warn('Notification permission request failed:', e);
      return 'denied';
    }
  }, []);

  /**
   * Проверить события и показать напоминания.
   * Вызывается один раз при открытии приложения.
   */
  const checkReminders = useCallback(() => {
    cleanupShown();

    const reminders = getTodayReminders();
    if (reminders.length === 0) {
      setBannerReminders([]);
      return;
    }

    const results: NotificationResult[] = [];

    for (const event of reminders) {
      const days = calculateDays(event);
      const text = formatReminderText(event, days);

      results.push({
        event,
        days,
        title: text.title,
        body: text.body,
      });

      // Пытаемся показать системное уведомление
      if (permission === 'granted' && 'Notification' in window) {
        try {
          new Notification(text.title, {
            body: text.body,
            icon: '/golden-investor/icon-192.png',
            badge: '/golden-investor/icon-192.png',
            tag: `event-${event.id}-${days}`,
          });
        } catch (e) {
          console.warn('Notification failed:', e);
        }
      }

      // Помечаем как показанное
      markAsShown(event.id, days);
    }

    // Если системные уведомления недоступны — показываем баннеры внутри приложения
    if (permission !== 'granted') {
      setBannerReminders(results);
    } else {
      setBannerReminders([]);
    }
  }, [permission]);

  /**
   * Закрыть баннер-напоминание.
   */
  const dismissBanner = useCallback((eventId: string) => {
    setBannerReminders((prev) => prev.filter((r) => r.event.id !== eventId));
  }, []);

  // При первом монтировании — проверяем напоминания
  useEffect(() => {
    checkReminders();
  }, [checkReminders]);

  return {
    permission,
    requestPermission,
    bannerReminders,
    dismissBanner,
    checkReminders,
  };
}

/* ─── Вспомогательная функция ─────────────── */

function calculateDays(event: InvestorEvent): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(event.date);
  target.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}