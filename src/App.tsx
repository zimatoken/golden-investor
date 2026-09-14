// src/App.tsx

import { useEffect, useState } from 'react';
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

// Иконки и подписи для кнопок навигации
const NAV_ITEMS: { id: Screen; icon: string; label: string }[] = [
  { id: 'status', icon: '📍', label: 'Где я' },
  { id: 'action', icon: '⚡', label: 'Действие' },
  { id: 'map', icon: '🗺', label: 'Карта' },
  { id: 'log', icon: '📖', label: 'Дневник' },
];

export function App() {
  const [screen, setScreen] = useState<Screen>('status');
  const [helpOpen, setHelpOpen] = useState(false);

  // Устанавливаем тему на <html>. Пока — светлая.
  // Когда добавим useTheme() — здесь будет переключение.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        transition: 'background 0.2s ease, color 0.2s ease',
      }}
    >
      {/* ─── Навигация ─────────────────────── */}
      <nav
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          background: 'var(--primary-dark)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = screen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              style={{
                flex: 1,
                padding: '0.65rem 0.5rem',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: '#f1f5f9',
                border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                transition: 'background 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Кнопка «?» — всегда справа */}
        <HelpButton onClick={() => setHelpOpen(true)} />
      </nav>

      {/* ─── Экраны ────────────────────────── */}
      <main style={{ padding: '1rem', maxWidth: 900, margin: '0 auto' }}>
        {screen === 'status' && <StatusScreen />}
        {screen === 'action' && <ActionScreen />}
        {screen === 'map' && <MapScreen />}
        {screen === 'log' && <DecisionLogScreen />}
      </main>

      {/* ─── Модалка инструкции ────────────── */}
      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        initialSectionId={SCREEN_TO_HELP[screen]}
      />
    </div>
  );
}
