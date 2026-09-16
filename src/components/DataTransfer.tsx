// src/components/DataTransfer.tsx

import { useRef, useState } from 'react';
import { X, Share2, Copy, Download, Upload, Clipboard, AlertCircle, CheckCircle } from 'lucide-react';
import {
  shareData,
  copyToClipboard,
  downloadAsFile,
  validateSnapshot,
  importSnapshot,
} from '../core/dataTransfer';

interface Props {
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
}

type Tab = 'export' | 'import';

export function DataTransfer({ open, onClose, onImported }: Props) {
  const [tab, setTab] = useState<Tab>('export');
  const [status, setStatus] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [importText, setImportText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const showStatus = (type: 'ok' | 'error', text: string) => {
    setStatus({ type, text });
    setTimeout(() => setStatus(null), 4000);
  };

  /* ─── Экспорт ─────────────────────── */
  const handleShare = async () => {
    const result = await shareData();
    if (result.ok) {
      showStatus('ok', result.method === 'share' ? '✅ Меню «Поделиться» открыто' : '✅ Файл скачан');
    } else if (result.error === 'Отменено') {
      showStatus('error', 'Отменено пользователем');
    } else {
      showStatus('error', `Ошибка: ${result.error}`);
    }
  };

  const handleCopy = async () => {
    const result = await copyToClipboard();
    if (result.ok) {
      showStatus('ok', '✅ JSON скопирован в буфер');
    } else {
      showStatus('error', `Ошибка: ${result.error}`);
    }
  };

  const handleDownload = () => {
    downloadAsFile();
    showStatus('ok', '✅ Файл скачан');
  };

  /* ─── Импорт ──────────────────────── */
  const handleImportFromText = () => {
    if (!importText.trim()) {
      showStatus('error', 'Вставь JSON в поле');
      return;
    }

    const validation = validateSnapshot(importText);
    if (!validation.ok || !validation.snapshot) {
      showStatus('error', validation.error || 'Неверный формат');
      return;
    }

    if (!confirm('Импорт перезапишет все текущие данные. Продолжить?')) return;

    const result = importSnapshot(validation.snapshot);
    showStatus('ok', `✅ Импортировано: ${result.imported} ключей`);
    setImportText('');
    onImported?.();

    setTimeout(() => {
      if (confirm('Данные загружены. Перезагрузить приложение?')) {
        location.reload();
      }
    }, 800);
  };

  const handleImportFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const validation = validateSnapshot(text);
      if (!validation.ok || !validation.snapshot) {
        showStatus('error', validation.error || 'Неверный формат');
        return;
      }

      if (!confirm(`Импортировать данные из «${file.name}»? Текущие данные будут перезаписаны.`)) {
        return;
      }

      const result = importSnapshot(validation.snapshot);
      showStatus('ok', `✅ Импортировано: ${result.imported} ключей`);
      onImported?.();

      setTimeout(() => {
        if (confirm('Данные загружены. Перезагрузить приложение?')) {
          location.reload();
        }
      }, 800);
    };
    reader.readAsText(file);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setImportText(text);
      showStatus('ok', '✅ JSON вставлен');
    } catch (e) {
      showStatus('error', 'Не удалось прочитать буфер — вставь вручную (Ctrl+V)');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: 'min(90vh, 700px)',
          background: 'var(--card-bg)',
          color: 'var(--text)',
          borderRadius: 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Заголовок */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--primary-dark)',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🔄</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Перенос данных</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Сохрани на одном устройстве — загрузи на другом
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            style={{
              padding: '0.4rem',
              background: 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Табы */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          <TabButton active={tab === 'export'} onClick={() => setTab('export')}>
            📤 Экспорт
          </TabButton>
          <TabButton active={tab === 'import'} onClick={() => setTab('import')}>
            📥 Импорт
          </TabButton>
        </div>

        {/* Контент */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {tab === 'export' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, color: 'var(--subtext)', margin: 0, marginBottom: 6 }}>
                Выбери, как сохранить данные:
              </p>

              <ActionButton
                icon={<Share2 size={18} />}
                title="Поделиться"
                subtitle="Откроется меню Android/iOS — можно отправить в Telegram, на почту, в облако"
                onClick={handleShare}
                primary
              />
              <ActionButton
                icon={<Copy size={18} />}
                title="Скопировать JSON"
                subtitle="JSON в буфере — вставь в любой мессенджер или заметки"
                onClick={handleCopy}
              />
              <ActionButton
                icon={<Download size={18} />}
                title="Скачать файл"
                subtitle="Сохранится в «Загрузки». Для ПК — самый удобный способ"
                onClick={handleDownload}
              />
            </div>
          )}

          {tab === 'import' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--subtext)', margin: 0 }}>
                Загрузи данные, сохранённые ранее:
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <SmallButton onClick={handlePasteFromClipboard} icon={<Clipboard size={14} />}>
                  Вставить из буфера
                </SmallButton>
                <SmallButton onClick={() => fileRef.current?.click()} icon={<Upload size={14} />}>
                  Загрузить из файла
                </SmallButton>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFromFile}
                  style={{ display: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--subtext)', display: 'block', marginBottom: 4 }}>
                  Или вставь JSON вручную:
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder='{"version":1,"app":"golden-investor","data":{...}}'
                  style={{
                    width: '100%',
                    minHeight: 140,
                    padding: '0.6rem',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--card-bg-soft)',
                    color: 'var(--text)',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    resize: 'vertical',
                  }}
                />
              </div>

              <button
                onClick={handleImportFromText}
                disabled={!importText.trim()}
                style={{
                  padding: '0.75rem',
                  background: importText.trim() ? 'var(--primary)' : 'var(--border)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  cursor: importText.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                📥 Загрузить данные
              </button>

              <div
                style={{
                  padding: '0.75rem',
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--text-soft)',
                  lineHeight: 1.6,
                }}
              >
                ⚠️ <strong>Внимание:</strong> импорт перезапишет все текущие данные. Если у тебя уже есть решения — сначала экспортируй их.
              </div>
            </div>
          )}

          {/* Статус */}
          {status && (
            <div
              style={{
                marginTop: 16,
                padding: '0.75rem 1rem',
                background: status.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${status.type === 'ok' ? 'var(--success)' : 'var(--danger)'}`,
                borderRadius: 8,
                fontSize: 13,
                color: status.type === 'ok' ? 'var(--success)' : 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {status.type === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {status.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Компоненты ─────────────────────── */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '0.75rem',
        background: active ? 'var(--card-bg-soft)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--subtext)',
        border: 'none',
        borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: active ? 700 : 500,
      }}
    >
      {children}
    </button>
  );
}

function ActionButton({
  icon,
  title,
  subtitle,
  onClick,
  primary,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0.9rem 1rem',
        background: primary ? 'var(--primary)' : 'var(--card-bg-soft)',
        color: primary ? '#fff' : 'var(--text)',
        border: primary ? 'none' : '1px solid var(--border)',
        borderRadius: 10,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
      }}
    >
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2, lineHeight: 1.4 }}>{subtitle}</div>
      </div>
    </button>
  );
}

function SmallButton({
  icon,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0.45rem 0.75rem',
        background: 'var(--card-bg-soft)',
        color: 'var(--text)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {icon}
      {children}
    </button>
  );
}