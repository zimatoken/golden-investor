// src/components/SourceLink.tsx

import { ExternalLink } from 'lucide-react';
import { openSource } from '../data/sources';

interface Props {
  url: string;
  label?: string;
  size?: number;
}

/**
 * Маленькая иконка 🔗, которая открывает источник в новой вкладке.
 * Используется рядом с полями ввода.
 */
export function SourceLink({ url, label = 'Открыть источник', size = 14 }: Props) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openSource(url);
      }}
      title={label}
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px 4px',
        background: 'transparent',
        color: 'var(--primary)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--card-bg-soft)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <ExternalLink size={size} />
    </button>
  );
}