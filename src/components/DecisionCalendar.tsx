// src/components/DecisionCalendar.tsx
//
// PHASE 10.2 — Календарь решений.
// Показывает сетку месяца, где дни с решениями отмечены.

import { useMemo, useState } from 'react';
import type { DecisionEntry } from '../types/market';

interface DecisionCalendarProps {
  decisions: DecisionEntry[];
}

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

/**
 * Возвращает ключ дня: YYYY-MM-DD.
 */
function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Календарь решений.
 *
 * Показывает:
 * - Сетку месяца с днями недели.
 * - Точку на днях, где есть решения.
 * - Клик на день → список решений.
 */
export function DecisionCalendar({ decisions }: DecisionCalendarProps) {
  // Стартовый месяц — текущий (или последний с решениями)
  const [viewDate, setViewDate] = useState(() => {
    if (decisions.length === 0) return new Date();
    const latest = decisions
      .map((d) => new Date(d.date).getTime())
      .reduce((max, t) => Math.max(max, t), 0);
    return new Date(latest);
  });

  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Группируем решения по дню
  const decisionsByDay = useMemo(() => {
    const map: Record<string, DecisionEntry[]> = {};
    for (const d of decisions) {
      const key = dayKey(d.date);
      if (!map[key]) map[key] = [];
      map[key].push(d);
    }
    return map;
  }, [decisions]);

  // Считаем сетку месяца
  const grid = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // День недели первого дня (0 = Вс, 1 = Пн). Приводим к Пн=0.
    const firstWeekday = (firstDay.getDay() + 6) % 7;

    const days: (number | null)[] = [];

    // Пустые ячейки до первого дня
    for (let i = 0; i < firstWeekday; i++) days.push(null);

    // Дни месяца
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);

    // Дополняем до полной сетки (кратной 7)
    while (days.length % 7 !== 0) days.push(null);

    return days;
  }, [year, month]);

  // Решения в этом месяце
  const monthDecisions = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return decisions.filter((d) => d.date.startsWith(prefix));
  }, [decisions, year, month]);

  // Общее количество решений в месяце
  const monthCount = monthDecisions.length;

  // Всего решений в дне (по ключу)
  const getDayCount = (day: number): number => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return decisionsByDay[key]?.length ?? 0;
  };

  const getDayKey = (day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Сегодняшний день (для подсветки)
  const todayKey = new Date().toISOString().slice(0, 10);

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const selectedDecisions = selectedDay
    ? decisionsByDay[selectedDay] ?? []
    : [];

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '16px',
        marginBottom: 20,
      }}
    >
      {/* Заголовок */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)' }}>
          📅 Календарь решений
        </div>
        <div style={{ fontSize: 12, color: 'var(--subtext)' }}>
          В месяце: {monthCount}
        </div>
      </div>

      {/* Навигация */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <button
          onClick={handlePrevMonth}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: 'pointer',
            color: 'var(--text)',
            fontSize: 13,
          }}
          aria-label="Предыдущий месяц"
        >
          ←
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)' }}>
          {MONTH_NAMES[month]} {year}
        </div>
        <button
          onClick={handleNextMonth}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: 'pointer',
            color: 'var(--text)',
            fontSize: 13,
          }}
          aria-label="Следующий месяц"
        >
          →
        </button>
      </div>

      {/* Дни недели */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 6,
        }}
      >
        {WEEKDAY_LABELS.map((wd) => (
          <div
            key={wd}
            style={{
              fontSize: 11,
              color: 'var(--subtext)',
              textAlign: 'center',
              fontWeight: 600,
              padding: '2px 0',
            }}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Сетка дней */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
        }}
      >
        {grid.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} style={{ height: 36 }} />;
          }

          const key = getDayKey(day);
          const count = getDayCount(day);
          const isToday = key === todayKey;
          const isSelected = key === selectedDay;

          return (
            <button
              key={key}
              onClick={() => setSelectedDay(isSelected ? null : key)}
              style={{
                position: 'relative',
                height: 36,
                background: isSelected ? 'var(--primary)' : 'var(--card-bg-soft)',
                color: isSelected ? '#fff' : 'var(--text)',
                border: isToday ? '2px solid var(--warning)' : '1px solid transparent',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: count > 0 ? 700 : 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={`${day} ${MONTH_NAMES[month]}`}
            >
              {day}
              {count > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isSelected ? '#fff' : 'var(--primary)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Легенда */}
      <div
        style={{
          marginTop: 10,
          fontSize: 11,
          color: 'var(--subtext)',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span>● точка = есть решения</span>
        <span style={{ color: 'var(--warning)' }}>▢ рамка = сегодня</span>
      </div>

      {/* Раскрытие дня */}
      {selectedDay && selectedDecisions.length > 0 && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: 'var(--subtext)',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {selectedDay} · {selectedDecisions.length} {selectedDecisions.length === 1 ? 'решение' : 'решений'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {selectedDecisions.map((d) => (
              <div
                key={d.id}
                style={{
                  padding: '8px 10px',
                  background: 'var(--card-bg-soft)',
                  borderRadius: 6,
                  fontSize: 12,
                  color: 'var(--text-soft)',
                  borderLeft: `3px solid ${d.wasInPlan ? 'var(--success)' : 'var(--warning)'}`,
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--heading)' }}>
                  {d.instrument === 'ofz' ? '📈 ОФЗ' :
                   d.instrument === 'gold' ? '🥇 Золото' :
                   d.instrument === 'deposit' ? '🏦 Вклад' :
                   '💼 Другое'}
                </div>
                <div style={{ fontSize: 11, marginTop: 2 }}>
                  {d.wasInPlan ? '✓ По плану' : '⚡ Импульс'} · {new Date(d.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Пустой день */}
      {selectedDay && selectedDecisions.length === 0 && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--subtext)',
            textAlign: 'center',
          }}
        >
          В этот день решений не было
        </div>
      )}

      {/* Если в месяце совсем пусто */}
      {monthCount === 0 && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--subtext)',
            textAlign: 'center',
          }}
        >
          В этом месяце решений не было
        </div>
      )}
    </div>
  );
}