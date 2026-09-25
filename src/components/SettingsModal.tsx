// src/components/SettingsModal.tsx
//
// Единая точка входа в настройки.
// Каждая строка делает реальный переход или действие — никаких alert().

import type { PendingAction } from '../contexts/NavigationContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenHelp: () => void;
  onToggleTheme: () => void;
  /** Перейти на «Где я» и опционально открыть модалку (политика / инвалидации / data-transfer). */
  onGoToStatus: (action?: PendingAction) => void;
}

export function SettingsModal({
  open,
  onClose,
  onOpenHelp,
  onToggleTheme,
  onGoToStatus,
}: Props) {
  if (!open) return null;

  const Row = ({
    icon,
    title,
    subtitle,
    action,
  }: {
    icon: string;
    title: string;
    subtitle: string;
    action: () => void;
  }) => (
    <button
      onClick={action}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: 'var(--card-bg-soft)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        cursor: 'pointer',
        textAlign: 'left',
        color: 'var(--text)',
        width: '100%',
        transition: 'border-color 0.15s ease, background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--heading)',
            marginBottom: 2,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--subtext)',
            lineHeight: 1.45,
          }}
        >
          {subtitle}
        </div>
      </div>
      <span style={{ color: 'var(--subtext)', fontSize: 16 }}>›</span>
    </button>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--modal-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card-bg)',
          borderRadius: 16,
          padding: 20,
          maxWidth: 480,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--modal-shadow)',
          color: 'var(--text)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              color: 'var(--heading)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>⚙️</span>
            <span>Настройки</span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 20,
              color: 'var(--subtext)',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>

        <p
          style={{
            fontSize: 13,
            color: 'var(--text-soft)',
            lineHeight: 1.5,
            margin: '0 0 16px 0',
          }}
        >
          Быстрые ссылки на всё, что можно настроить.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Row
            icon="📋"
            title="Политика"
            subtitle="Горизонт, просадка, ликвидность, цель, опыт"
            action={() => onGoToStatus({ type: 'open-policy' })}
          />

          <Row
            icon="⚠️"
            title="Что изменит моё мнение?"
            subtitle="Условия, при которых пересматриваешь решения"
            action={() => onGoToStatus({ type: 'open-invalidation' })}
          />

          <Row
            icon="💾"
            title="Бэкап / Перенос данных"
            subtitle="Экспорт и импорт всех данных (JSON)"
            action={() => onGoToStatus({ type: 'open-data-transfer' })}
          />

          <Row
            icon="📘"
            title="Инструкция"
            subtitle="Курс молодого бойца по ЗИ"
            action={onOpenHelp}
          />

          <Row
            icon="🌗"
            title="Тема"
            subtitle="Светлая ↔ тёмная"
            action={onToggleTheme}
          />
        </div>

        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
            fontSize: 11,
            color: 'var(--subtext)',
            textAlign: 'center',
          }}
        >
          v4.0 · Турбо ZX
        </div>
      </div>
    </div>
  );
}