// src/App.tsx

import { useState } from 'react';
import { StatusScreen } from './screens/StatusScreen';
import { ActionScreen } from './screens/ActionScreen';
import { MapScreen } from './screens/MapScreen';
import { DecisionLogScreen } from './screens/DecisionLogScreen';
import { HelpButton } from './components/HelpButton';
import { HelpModal } from './components/HelpModal';

type Screen = 'status' | 'action' | 'map' | 'log';

// Соответствие экранов и разделов инструкции
const SCREEN_TO_HELP: Record<Screen, string> = {
  status: 'status',
  action: 'action',
  map: 'map',
  log: 'log',
};

export function App() {
  const [screen, setScreen] = useState<Screen>('status');
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'system-ui, sans-serif' }}>
      {/* ─── Навигация ─────────────────────── */}
      <nav
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '1rem',
          background: '#0c1426',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          alignItems: 'center',
        }}
      >
        {(['status', 'action', 'map', 'log'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScreen(s)}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: screen === s ? '#1e293b' : 'transparent',
              color: '#f1f5f9',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            {s === 'status' ? '📍 Где я'
              : s === 'action' ? '⚡ Действие'
              : s === 'map' ? '🗺 Карта'
              : '📖 Дневник'}
          </button>
        ))}

        {/* Кнопка «?» — всегда справа */}
        <HelpButton onClick={() => setHelpOpen(true)} />
      </nav>

      {/* ─── Экраны ────────────────────────── */}
      {screen === 'status' && <StatusScreen />}
      {screen === 'action' && <ActionScreen />}
      {screen === 'map' && <MapScreen />}
      {screen === 'log' && <DecisionLogScreen />}

      {/* ─── Модалка инструкции ────────────── */}
      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        initialSectionId={SCREEN_TO_HELP[screen]}
      />
    </div>
  );
}