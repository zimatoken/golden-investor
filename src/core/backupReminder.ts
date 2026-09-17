// src/core/backupReminder.ts

const STORAGE_KEY = 'gi_last_backup_v1';

export type BackupLevel = 'fresh' | 'stale' | 'overdue' | 'never';

export interface BackupStatus {
  level: BackupLevel;
  daysSince: number | null;
  lastBackupAt: string | null;
  icon: string;
  label: string;
  message: string;
}

export function loadLastBackup(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveLastBackup(): void {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    // ignore
  }
}

function daysSince(iso: string): number {
  const d = new Date(iso).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - d) / (1000 * 60 * 60 * 24)));
}

export function getBackupStatus(): BackupStatus {
  const last = loadLastBackup();

  if (!last) {
    return {
      level: 'never',
      daysSince: null,
      lastBackupAt: null,
      icon: '🔴',
      label: 'Бэкап не делался',
      message:
        'Ни разу не делал бэкап. Если почистишь кэш браузера — все решения и настройки исчезнут. Сохрани данные сейчас — это 1 клик.',
    };
  }

  const days = daysSince(last);

  if (days <= 14) {
    return {
      level: 'fresh',
      daysSince: days,
      lastBackupAt: last,
      icon: '🟢',
      label: `Бэкап свежий (${days} дн. назад)`,
      message: '',
    };
  }

  if (days <= 30) {
    return {
      level: 'stale',
      daysSince: days,
      lastBackupAt: last,
      icon: '🟡',
      label: `Бэкап ${days} дн. назад`,
      message: `Последний бэкап — ${days} дней назад. Пора сделать новый — 1 клик.`,
    };
  }

  return {
    level: 'overdue',
    daysSince: days,
    lastBackupAt: last,
    icon: '🔴',
    label: `Бэкап просрочен (${days} дн.)`,
    message: `Последний бэкап — ${days} дней назад. Риск потерять данные при очистке кэша. Сохрани сейчас.`,
  };
}

export function shouldShowBackupBanner(): boolean {
  return getBackupStatus().level !== 'fresh';
}