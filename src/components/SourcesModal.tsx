// src/components/SourcesModal.tsx

import { X, ExternalLink } from 'lucide-react';
import { ALL_SOURCES, openSource, type Source } from '../data/sources';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SourcesModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Все источники"
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
          maxWidth: 600,
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
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--primary-dark)',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>📚</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Все источники данных</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Официальные сайты ЦБ РФ и банков
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

        {/* Контент */}
        <div
          className="scrollbar"
          style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}
        >
          {ALL_SOURCES.map((group) => (
            <div key={group.group} style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--subtext)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                {group.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.items.map((source) => (
                  <SourceRow key={source.url} source={source} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SourceRow({ source }: { source: Source }) {
  return (
    <button
      onClick={() => openSource(source.url)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '0.75rem 1rem',
        background: 'var(--card-bg-soft)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        cursor: 'pointer',
        textAlign: 'left',
        color: 'var(--text)',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)' }}>
          {source.label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2 }}>
          {source.description}
        </div>
      </div>
      <ExternalLink size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
    </button>
  );
}