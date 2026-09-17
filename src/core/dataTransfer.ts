// src/core/dataTransfer.ts

import { saveLastBackup } from './backupReminder';

/**
 * Универсальный экспорт/импорт всех данных приложения.
 * 
 * Формат: один JSON со всеми ключами localStorage.
 * При импорте — восстановление по ключам.
 */

const PREFIX = 'golden-investor';
const LOG_KEY = 'gi_decision_log_v1';
const HISTORY_KEY = 'gi_status_history_v1';
const PLAN_KEY = 'gi_plan_map_v1';

/**
 * Все ключи, которые нужно экспортировать.
 */
const EXPORT_KEYS = [
  `${PREFIX}-theme`,
  `${PREFIX}-market`,
  `${PREFIX}-banks`,
  `${PREFIX}-banks-updated`,
  `${PREFIX}-onboarding-done`,
  `${PREFIX}-goal`,
  `${PREFIX}-events`,
  `${PREFIX}-notifications-shown`,
  LOG_KEY,
  HISTORY_KEY,
  PLAN_KEY,
  'gi_policy_v1',       // ← Policy (PHASE 3.1)
  'gi_invalidation_v1', // ← Invalidation (PHASE 3.3)
];

export interface DataSnapshot {
  version: 1;
  exportedAt: string;
  app: 'golden-investor';
  data: Record<string, string | null>;
}

/**
 * Собирает все данные из localStorage в один объект.
 */
export function exportAllData(): DataSnapshot {
  const data: Record<string, string | null> = {};

  for (const key of EXPORT_KEYS) {
    data[key] = localStorage.getItem(key);
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'golden-investor',
    data,
  };
}

/**
 * Возвращает JSON-строку со всеми данными.
 */
export function exportAsJSON(): string {
  return JSON.stringify(exportAllData(), null, 2);
}

/**
 * Имя файла для экспорта.
 */
export function exportFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  const time = new Date().toTimeString().slice(0, 5).replace(':', '-');
  return `golden-investor-backup-${date}-${time}.json`;
}

/**
 * Проверяет, что JSON валидный и это наш формат.
 */
export function validateSnapshot(json: string): { ok: boolean; error?: string; snapshot?: DataSnapshot } {
  try {
    const parsed = JSON.parse(json);

    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Это не JSON-объект' };
    }

    if (parsed.app !== 'golden-investor') {
      return { ok: false, error: 'Это не файл «Золотого Инвестора»' };
    }

    if (parsed.version !== 1) {
      return { ok: false, error: `Версия ${parsed.version} не поддерживается (нужна 1)` };
    }

    if (!parsed.data || typeof parsed.data !== 'object') {
      return { ok: false, error: 'В файле нет данных' };
    }

    return { ok: true, snapshot: parsed };
  } catch (e) {
    return { ok: false, error: `Ошибка разбора: ${(e as Error).message}` };
  }
}

/**
 * Импортирует данные из snapshot — записывает в localStorage.
 * 
 * ВАЖНО: полностью перезаписывает существующие ключи.
 */
export function importSnapshot(snapshot: DataSnapshot): { imported: number; skipped: number } {
  let imported = 0;
  let skipped = 0;

  for (const [key, value] of Object.entries(snapshot.data)) {
    if (!EXPORT_KEYS.includes(key)) {
      skipped++;
      continue;
    }

    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
    imported++;
  }

  return { imported, skipped };
}

/* ─── Методы сохранения ─────────────────────── */

/**
 * Скачать JSON-файл.
 * Работает везде, включая ПК.
 */
export function downloadAsFile(): void {
  const json = exportAsJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = exportFilename();
  a.click();
  URL.revokeObjectURL(url);

  // Обновляем дату последнего бэкапа
  saveLastBackup();
}

/**
 * Поделиться через системное меню (Web Share API).
 * Работает на Android и iOS. На ПК — fallback на скачивание.
 */
export async function shareData(): Promise<{ ok: boolean; method: 'share' | 'download' | 'failed'; error?: string }> {
  const json = exportAsJSON();
  const filename = exportFilename();

  // Проверяем поддержку Web Share API
  if (typeof navigator.share !== 'function') {
    // Fallback — скачать файл
    downloadAsFile();
    return { ok: true, method: 'download' };
  }

  try {
    const file = new File([json], filename, { type: 'application/json' });

    // Пытаемся поделиться файлом (лучший вариант — можно отправить в Telegram/почту)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Золотой Инвестор — данные',
        text: 'Резервная копия моих решений и настроек',
      });
      return { ok: true, method: 'share' };
    }

    // Fallback — поделиться текстом
    await navigator.share({
      title: 'Золотой Инвестор — данные',
      text: json.slice(0, 5000), // Ограничение на длину текста
    });
    return { ok: true, method: 'share' };
  } catch (e) {
    // Пользователь отменил share — не считаем ошибкой
    if ((e as Error).name === 'AbortError') {
      return { ok: false, method: 'failed', error: 'Отменено' };
    }

    // Другая ошибка — fallback на скачивание
    downloadAsFile();
    return { ok: true, method: 'download', error: (e as Error).message };
  }
}

/**
 * Скопировать JSON в буфер обмена.
 */
export async function copyToClipboard(): Promise<{ ok: boolean; error?: string }> {
  const json = exportAsJSON();

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(json);
      return { ok: true };
    }

    // Fallback для старых браузеров
    const ta = document.createElement('textarea');
    ta.value = json;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);

    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}