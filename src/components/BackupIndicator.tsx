// src/components/BackupIndicator.tsx

import { useState } from 'react';
import { getBackupStatus, saveLastBackup } from '../core/backupReminder';
import { downloadAsFile } from '../core/dataTransfer';

/**
 * Иконка-индикатор бэкапа для шапки.
 *
 * 🟢 — свежий
 * 🟡 — пора
 * 🔴 — просрочен / не делался
 *
 * По клику — сразу скачивает JSON.
 */
export function BackupIndicator() {
  const [status, setStatus] = useState(() => getBackupStatus());

  const color =
    status.level === 'fresh'
      ? 'var(--success)'
      : status.level === 'stale'
      ? 'var(--warning)'
      : 'var(--danger)';

  const handleClick = () => {
    downloadAsFile();
    saveLastBackup();
    setStatus(getBackupStatus());
  };

  return (
    <button
      onClick={handleClick}
      title={status.label}
      aria-label={status.label}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 8,
        cursor: 'pointer',
        color: '#f1f5f9',
      }}
    >
      <span style={{ fontSize: 16 }}>💾</span>
      <span
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          border: '1.5px solid var(--primary-dark)',
        }}
      />
    </button>
  );
}