// src/components/HelpButton.tsx

import { HelpCircle } from 'lucide-react';

interface Props {
  onClick: () => void;
  title?: string;
}

export function HelpButton({ onClick, title = 'Инструкция' }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={title}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '0.4rem 0.7rem',
        background: '#1e293b',
        color: '#f1f5f9',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <HelpCircle size={16} />
      <span>?</span>
    </button>
  );
}