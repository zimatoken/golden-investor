// src/components/EventsCalendar.tsx

import {
  loadEvents,
  getUpcomingEvents,
  daysUntil,
  formatEventDate,
  formatDaysUntil,
  EVENT_META,
  type InvestorEvent,
} from '../data/events';

export function EventsCalendar() {
  const events = loadEvents();
  const upcoming = getUpcomingEvents(events, 5);

  // Проверка: есть ли событие ≤ 3 дней
  const hasUrgent = upcoming.some((e) => {
    const d = daysUntil(e.date);
    return d >= 0 && d <= 3;
  });

  return (
    <div
      style={{
        marginTop: '1.5rem',
        padding: '1.25rem',
        background: 'var(--card-bg)',
        border: `2px solid ${hasUrgent ? 'var(--danger)' : 'var(--border)'}`,
        borderRadius: 12,
        color: 'var(--text)',
      }}
    >
      {/* Заголовок */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: hasUrgent ? 'var(--danger)' : 'var(--subtext)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 700,
          }}
        >
          📅 Календарь инвестора
        </div>
        {hasUrgent && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              background: 'var(--danger)',
              color: '#fff',
            }}
          >
            ⚠️ Ближайшее событие
          </span>
        )}
      </div>

      {/* Пустое состояние */}
      {upcoming.length === 0 && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--subtext-muted)',
            textAlign: 'center',
            padding: '0.5rem',
          }}
        >
          В ближайшее время событий нет
        </div>
      )}

      {/* Список событий */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {upcoming.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>

      {/* Подсказка */}
      {upcoming.length > 0 && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid var(--border)',
            fontSize: 11,
            color: 'var(--subtext-muted)',
            fontStyle: 'italic',
          }}
        >
          Заседания ЦБ влияют на длинные ОФЗ. Купоны — на кэш-флоу.
        </div>
      )}
    </div>
  );
}

/* ─── Одно событие ─────────────────────── */
function EventRow({ event }: { event: InvestorEvent }) {
  const days = daysUntil(event.date);
  const meta = EVENT_META[event.type];

  // Цвет по срочности
  let urgencyColor: string | null = null;
  let urgencyLabel = '';

  if (days === 0) {
    urgencyColor = 'var(--danger)';
    urgencyLabel = '🔴 СЕГОДНЯ';
  } else if (days <= 3) {
    urgencyColor = 'var(--danger)';
    urgencyLabel = `🔴 ${formatDaysUntil(days)}`;
  } else if (days <= 7) {
    urgencyColor = 'var(--warning)';
    urgencyLabel = `🟡 ${formatDaysUntil(days)}`;
  } else {
    urgencyLabel = formatDaysUntil(days);
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '0.6rem 0.75rem',
        background: 'var(--card-bg-soft)',
        borderRadius: 8,
        border: urgencyColor ? `1px solid ${urgencyColor}` : '1px solid transparent',
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>{meta.icon}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--heading)',
            marginBottom: 2,
          }}
        >
          {event.title}
        </div>
        {event.description && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--subtext)',
              marginBottom: 4,
            }}
          >
            {event.description}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--subtext-muted)' }}>
            {formatEventDate(event.date)}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: urgencyColor ? 700 : 500,
              color: urgencyColor || 'var(--subtext)',
            }}
          >
            {urgencyLabel}
          </span>
        </div>
      </div>
    </div>
  );
}