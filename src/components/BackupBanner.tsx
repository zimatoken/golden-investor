// src/components/BackupBanner.tsx

import { useState } from 'react';
import { getBackupStatus, saveLastBackup } from '../core/backupReminder';
import { downloadAsFile } from '../core/dataTransfer';

/**
 * Баннер напоминания о бэкапе.
 *
 * Показывается на StatusScreen, если:
 * - Никогда не делал бэкап.
 * - Прошло > 14 дней.
 *
 * Кнопка «Сохранить сейчас» → скачивает JSON с данными.
 */
export function BackupBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [status, setStatus] = useState(() => getBackupStatus());

  if (dismissed) return null;
  if (status.level === 'fresh') return null;

  const isOverdue = status.level === 'overdue' || status.level === 'never';

  const bg = isOverdue ? 'rgba(239,68,68,0.08)' : 'rgba(234,179,8,0.08)';
  const border = isOverdue ? 'var(--danger)' : 'var(--warning)';
  const titleColor = isOverdue ? 'var(--danger)' : 'var(--warning)';

  const handleBackup = () => {
    downloadAsFile();
    saveLastBackup();
    setStatus(getBackupStatus());
    setDismissed(true);
  };

  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        background: bg,
        border: `1px solid ${border}`,
        borderLeft: `4px solid ${border}`,
        borderRadius: 12,
        color: 'var(--text)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: titleColor,
              marginBottom: 4,
            }}
          >
            {status.icon} Бэкап
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-soft)',
              lineHeight: 1.5,
            }}
          >
            {status.message}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={handleBackup}
            style={{
              padding: '0.5rem 1rem',
              background: border,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              whiteSpace: 'nowrap',
            }}
          >
            📥 Сохранить
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Закрыть"
            style={{
              padding: '0.5rem 0.6rem',
              background: 'transparent',
              color: 'var(--subtext)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}