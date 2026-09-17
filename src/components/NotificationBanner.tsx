// src/components/NotificationBanner.tsx

import { Bell, X } from 'lucide-react';
import type { PermissionState, NotificationResult } from '../hooks/useNotifications';

interface Props {
  permission: PermissionState;
  reminders: NotificationResult[];
  onRequestPermission: () => void;
  onDismiss: (eventId: string) => void;
}

/**
 * Два режима:
 * 1. permission === 'default' → баннер «Разрешить уведомления»
 * 2. permission !== 'granted' + есть reminders → баннеры-напоминания
 */
export function NotificationBanner({
  permission,
  reminders,
  onRequestPermission,
  onDismiss,
}: Props) {
  // Режим 1: спросить разрешение
  if (permission === 'default') {
    return (
      <div
        style={{
          marginBottom: '1rem',
          padding: '0.75rem 1rem',
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid var(--primary)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: 'var(--text)',
          flexWrap: 'wrap',
        }}
      >
        <Bell size={18} color="var(--primary)" />
        <div style={{ flex: 1, fontSize: 13, minWidth: 180 }}>
          Включить напоминания о заседаниях ЦБ и купонах?
        </div>
        <button
          onClick={onRequestPermission}
          style={{
            padding: '0.4rem 0.8rem',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          Разрешить
        </button>
      </div>
    );
  }

  // Режим 2: показываем напоминания баннером (если системные недоступны)
  if (reminders.length === 0) return null;

  return (
    <>
      {reminders.map((reminder) => (
        <div
          key={reminder.event.id}
          style={{
            marginBottom: '0.75rem',
            padding: '0.85rem 1rem',
            background: reminder.days <= 1 ? 'rgba(239,68,68,0.08)' : 'rgba(234,179,8,0.08)',
            border: `1px solid ${reminder.days <= 1 ? 'var(--danger)' : 'var(--warning)'}`,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            color: 'var(--text)',
          }}
        >
          <Bell size={18} color={reminder.days <= 1 ? 'var(--danger)' : 'var(--warning)'} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)', marginBottom: 2 }}>
              {reminder.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.5 }}>
              {reminder.body}
            </div>
          </div>
          <button
            onClick={() => onDismiss(reminder.event.id)}
            aria-label="Закрыть"
            style={{
              padding: '0.25rem',
              background: 'transparent',
              color: 'var(--subtext)',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </>
  );
}