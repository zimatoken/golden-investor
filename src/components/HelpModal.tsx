// src/components/HelpModal.tsx

import { useEffect, useMemo, useState } from 'react';
import { X, Search, ChevronRight } from 'lucide-react';
import {
  HELP_CONTENT,
  type HelpBlock,
} from '../data/helpContent';

interface Props {
  open: boolean;
  onClose: () => void;
  initialSectionId?: string;
}

export function HelpModal({ open, onClose, initialSectionId = 'general' }: Props) {
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
          maxWidth: 900,
          height: 'min(90vh, 700px)',
          background: '#fff',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* ─── Заголовок ─────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #e2e8f0',
            background: '#0c1426',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>📘</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Инструкция</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Курс молодого бойца по «Золотому Инвестору»
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

        {/* ─── Тело ─────────────────────── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Левая колонка — список */}
          <aside
            style={{
              width: 240,
              borderRight: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              background: '#f8fafc',
            }}
          >
            <div style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.4rem 0.6rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  background: '#fff',
                }}
              >
                <Search size={14} color="#64748b" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск..."
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: '#0c1426',
                    fontSize: 13,
                    width: '100%',
                  }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
              {filtered.length === 0 && (
                <div style={{ padding: '1rem', color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>
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
                      background: isActive ? '#0c1426' : 'transparent',
                      color: isActive ? '#fff' : '#0c1426',
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

          {/* Правая колонка — контент */}
          <main
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem 2rem',
              minHeight: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 32 }}>{active.icon}</span>
              <div>
                <h2 style={{ margin: 0, color: '#0c1426', fontSize: 20 }}>{active.title}</h2>
                <div style={{ color: '#64748b', fontSize: 13 }}>{active.subtitle}</div>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {active.blocks.map((block, i) => (
                <HelpBlockView key={i} block={block} />
              ))}
            </div>

            <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <NextSectionLink currentId={active.id} onGo={setActiveId} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ─── Рендер блока ─────────────────────── */
function HelpBlockView({ block }: { block: HelpBlock }) {
  const base: React.CSSProperties = {
    fontSize: 14,
    lineHeight: 1.65,
    color: '#334155',
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
          borderLeft: '4px solid #ef4444',
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
          borderLeft: '4px solid #3b82f6',
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
          background: '#f8fafc',
          borderRadius: 8,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, minWidth: 140, color: '#0c1426' }}>
          {block.label}
        </div>
        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
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
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13,
      }}
    >
      <span style={{ color: '#94a3b8', fontSize: 12 }}>Следующий раздел</span>
      <span style={{ fontWeight: 600, color: '#0c1426' }}>
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