// src/components/HelpModal.tsx

import { useEffect, useMemo, useState } from 'react';
import { X, Search, ChevronRight } from 'lucide-react';
import { HELP_CONTENT, type HelpBlock } from '../data/helpContent';
import { useIsMobile } from '../hooks/useIsMobile';
import { openPrintableInstructions, downloadInstructionsHTML } from '../core/helpPdf';

interface Props {
  open: boolean;
  onClose: () => void;
  initialSectionId?: string;
}

export function HelpModal({ open, onClose, initialSectionId = 'general' }: Props) {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>(initialSectionId);

  // При открытии — сброс на initialSectionId
  useEffect(() => {
    if (open) {
      setActiveId(initialSectionId);
      setQuery('');
    }
  }, [open, initialSectionId]);

  // Закрытие по Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Блокировка прокрутки страницы за модалкой
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return HELP_CONTENT;
    const q = query.toLowerCase();
    return HELP_CONTENT.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.blocks.some((b) => blockToText(b).toLowerCase().includes(q))
    );
  }, [query]);

  const active = HELP_CONTENT.find((s) => s.id === activeId) || HELP_CONTENT[0];

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Инструкция"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--modal-overlay)',
        zIndex: 1000,
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: isMobile
          ? 'max(0.5rem, env(safe-area-inset-top)) 0.5rem max(0.5rem, env(safe-area-inset-bottom)) 0.5rem'
          : 'max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left))',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 900,
          height: isMobile ? 'calc(100dvh - 1rem)' : 'min(90vh, 700px)',
          background: 'var(--card-bg)',
          color: 'var(--text)',
          borderRadius: isMobile ? 12 : 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--modal-shadow)',
        }}
      >
        {/* ─── Заголовок ─────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: isMobile ? '0.6rem 0.75rem' : '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--primary-dark)',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {/* Блок заголовка — может сжиматься */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
              flex: 1,
            }}
          >
            <span style={{ fontSize: isMobile ? 18 : 22, flexShrink: 0 }}>📘</span>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: isMobile ? 14 : 16,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Инструкция
              </div>
              {!isMobile && (
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  Курс молодого бойца по «Золотому Инвестору»
                </div>
              )}
            </div>
          </div>

          {/* Блок кнопок — не сжимается */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <button
              onClick={downloadInstructionsHTML}
              title="Скачать HTML-файл с инструкцией"
              aria-label="Скачать инструкцию"
              style={{
                padding: isMobile ? '0.35rem 0.5rem' : '0.4rem 0.7rem',
                background: 'transparent',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              📥
              {!isMobile && <span>Скачать</span>}
            </button>

            <button
              onClick={openPrintableInstructions}
              title="Открыть для печати в PDF (выбери «Сохранить как PDF»)"
              aria-label="Печать PDF"
              style={{
                padding: isMobile ? '0.35rem 0.5rem' : '0.4rem 0.7rem',
                background: 'transparent',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              🖨
              {!isMobile && <span>Печать PDF</span>}
            </button>

            <button
              onClick={onClose}
              aria-label="Закрыть"
              style={{
                padding: isMobile ? '0.35rem' : '0.4rem',
                background: 'transparent',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={isMobile ? 18 : 20} />
            </button>
          </div>
        </div>

        {/* ─── Тело ─────────────────────── */}
        {isMobile ? (
          /* ───── МОБИЛЬНАЯ ВЕРСИЯ: табы сверху ───── */
          <>
            {/* Поиск */}
            <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.4rem 0.6rem',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'var(--card-bg-soft)',
                }}
              >
                <Search size={14} color="var(--subtext)" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск..."
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontSize: 14,
                    width: '100%',
                  }}
                />
              </div>
            </div>

            {/* Горизонтальные табы */}
            <div
              className="scrollbar"
              style={{
                display: 'flex',
                gap: 6,
                padding: '0.5rem',
                overflowX: 'auto',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
                background: 'var(--card-bg-soft)',
              }}
            >
              {filtered.length === 0 && (
                <div style={{ padding: '0.5rem 1rem', color: 'var(--subtext)', fontSize: 13 }}>
                  Ничего не найдено
                </div>
              )}
              {filtered.map((s) => {
                const isActive = s.id === active.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveId(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.5rem 0.75rem',
                      border: '1px solid ' + (isActive ? 'var(--primary-dark)' : 'var(--border)'),
                      borderRadius: 20,
                      background: isActive ? 'var(--primary-dark)' : 'var(--card-bg)',
                      color: isActive ? '#fff' : 'var(--text)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{s.icon}</span>
                    <span>{s.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Контент */}
            <main
              className="scrollbar"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                minHeight: 0,
              }}
            >
              <SectionContent active={active} onGo={setActiveId} />
            </main>
          </>
        ) : (
          /* ───── ДЕСКТОПНАЯ ВЕРСИЯ: боковая колонка ───── */
          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <aside
              className="scrollbar"
              style={{
                width: 240,
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                background: 'var(--card-bg-soft)',
                flexShrink: 0,
              }}
            >
              <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '0.4rem 0.6rem',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--card-bg)',
                  }}
                >
                  <Search size={14} color="var(--subtext)" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Поиск..."
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: 'var(--text)',
                      fontSize: 13,
                      width: '100%',
                    }}
                  />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                {filtered.length === 0 && (
                  <div style={{ padding: '1rem', color: 'var(--subtext-muted)', fontSize: 13, textAlign: 'center' }}>
                    Ничего не найдено
                  </div>
                )}
                {filtered.map((s) => {
                  const isActive = s.id === active.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveId(s.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '0.6rem 0.75rem',
                        border: 'none',
                        borderRadius: 8,
                        background: isActive ? 'var(--primary-dark)' : 'transparent',
                        color: isActive ? '#fff' : 'var(--text)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        marginBottom: 2,
                        fontSize: 13,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{s.icon}</span>
                      <span style={{ flex: 1, fontWeight: isActive ? 600 : 500 }}>
                        {s.title}
                      </span>
                      {isActive && <ChevronRight size={14} />}
                    </button>
                  );
                })}
              </div>
            </aside>

            <main
              className="scrollbar"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem 2rem',
                minHeight: 0,
              }}
            >
              <SectionContent active={active} onGo={setActiveId} />
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Контент раздела (общий для обеих версий) ─── */
function SectionContent({
  active,
  onGo,
}: {
  active: typeof HELP_CONTENT[number];
  onGo: (id: string) => void;
}) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 32 }}>{active.icon}</span>
        <div>
          <h2 style={{ margin: 0, color: 'var(--heading)', fontSize: 20 }}>{active.title}</h2>
          <div style={{ color: 'var(--subtext)', fontSize: 13 }}>{active.subtitle}</div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {active.blocks.map((block, i) => (
          <HelpBlockView key={i} block={block} />
        ))}
      </div>

      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <NextSectionLink currentId={active.id} onGo={onGo} />
      </div>
    </>
  );
}

/* ─── Рендер блока ─────────────────────── */
function HelpBlockView({ block }: { block: HelpBlock }) {
  const base: React.CSSProperties = {
    fontSize: 14,
    lineHeight: 1.65,
    color: 'var(--text-soft)',
  };

  if (block.type === 'paragraph') return <p style={{ ...base, margin: 0 }}>{block.text}</p>;

  if (block.type === 'list') {
    return (
      <ul style={{ ...base, paddingLeft: 20, margin: 0 }}>
        {block.items.map((it, i) => (
          <li key={i} style={{ marginBottom: 6 }}>{it}</li>
        ))}
      </ul>
    );
  }

  if (block.type === 'steps') {
    return (
      <ol style={{ ...base, paddingLeft: 20, margin: 0 }}>
        {block.items.map((it, i) => (
          <li key={i} style={{ marginBottom: 8 }}>{it}</li>
        ))}
      </ol>
    );
  }

  if (block.type === 'warning') {
    return (
      <div
        style={{
          padding: '0.75rem 1rem',
          borderLeft: '4px solid var(--danger)',
          background: 'rgba(239,68,68,0.08)',
          borderRadius: 8,
          ...base,
        }}
      >
        ⚠️ {block.text}
      </div>
    );
  }

  if (block.type === 'tip') {
    return (
      <div
        style={{
          padding: '0.75rem 1rem',
          borderLeft: '4px solid var(--primary)',
          background: 'rgba(59,130,246,0.08)',
          borderRadius: 8,
          ...base,
        }}
      >
        💡 {block.text}
      </div>
    );
  }

  if (block.type === 'statusRow') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: '0.75rem 1rem',
          borderLeft: `4px solid ${block.color}`,
          background: 'var(--card-bg-soft)',
          borderRadius: 8,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, minWidth: 120, color: 'var(--heading)' }}>
          {block.label}
        </div>
        <div style={{ fontSize: 13, color: 'var(--subtext)', lineHeight: 1.6 }}>
          {block.description}
        </div>
      </div>
    );
  }

  return null;
}

/* ─── Следующий раздел ─────────────────── */
function NextSectionLink({
  currentId,
  onGo,
}: {
  currentId: string;
  onGo: (id: string) => void;
}) {
  const idx = HELP_CONTENT.findIndex((s) => s.id === currentId);
  const next = HELP_CONTENT[idx + 1];
  if (!next) return null;

  return (
    <button
      onClick={() => onGo(next.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0.75rem 1rem',
        background: 'var(--card-bg-soft)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13,
        color: 'var(--text)',
        gap: 8,
      }}
    >
      <span style={{ color: 'var(--subtext-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
        Далее
      </span>
      <span style={{ fontWeight: 600, color: 'var(--heading)', textAlign: 'right' }}>
        {next.icon} {next.title} →
      </span>
    </button>
  );
}

/* ─── Блок → строка (для поиска) ───────── */
function blockToText(b: HelpBlock): string {
  if (b.type === 'paragraph' || b.type === 'warning' || b.type === 'tip') return b.text;
  if (b.type === 'list' || b.type === 'steps') return b.items.join(' ');
  if (b.type === 'statusRow') return `${b.label} ${b.description}`;
  return '';
}