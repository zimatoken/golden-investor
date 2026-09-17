// src/App.tsx

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { StatusScreen } from './screens/StatusScreen';
import { ActionScreen } from './screens/ActionScreen';
import { MapScreen } from './screens/MapScreen';
import { DecisionLogScreen } from './screens/DecisionLogScreen';
import { GoalScreen } from './screens/GoalScreen';
import { HelpButton } from './components/HelpButton';
import { HelpModal } from './components/HelpModal';
import { NotificationBanner } from './components/NotificationBanner';
import { useTheme } from './hooks/useTheme';
import { useNotifications } from './hooks/useNotifications';

type Screen = 'status' | 'action' | 'goal' | 'map' | 'log';

const SCREEN_TO_HELP: Record<Screen, string> = {
  status: 'status',
  action: 'action',
  goal: 'general',
  map: 'map',
  log: 'log',
};

const NAV_ITEMS: { id: Screen; icon: string; label: string }[] = [
  { id: 'status', icon: '📍', label: 'Где я' },
  { id: 'action', icon: '⚡', label: 'Действие' },
  { id: 'goal', icon: '🎯', label: 'Цель' },
  { id: 'map', icon: '🗺', label: 'Карта' },
  { id: 'log', icon: '📖', label: 'Дневник' },
];

const ONBOARDING_KEY = 'golden-investor-onboarding-done';

export function App() {
  const [screen, setScreen] = useState<Screen>('status');
  const [helpOpen, setHelpOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const {
    permission,
    requestPermission,
    bannerReminders,
    dismissBanner,
  } = useNotifications();

  // Онбординг: при первом заходе — открыть инструкцию
  useEffect(() => {
    const isOnboardingDone = localStorage.getItem(ONBOARDING_KEY) === '1';
    if (!isOnboardingDone) {
      setHelpOpen(true);
    }
  }, []);

  const handleCloseHelp = () => {
    setHelpOpen(false);
    localStorage.setItem(ONBOARDING_KEY, '1');
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

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
          gap: '0.4rem',
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
                padding: '0.6rem 0.4rem',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: '#f1f5f9',
                border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: isActive ? 600 : 500,
                transition: 'background 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
          style={{
            padding: '0.5rem 0.6rem',
            background: 'rgba(255,255,255,0.08)',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <HelpButton onClick={() => setHelpOpen(true)} />
      </nav>

      <main style={{ padding: '1rem', maxWidth: 900, margin: '0 auto' }}>
        {/* Баннер уведомлений / напоминаний */}
        <NotificationBanner
          permission={permission}
          reminders={bannerReminders}
          onRequestPermission={handleRequestPermission}
          onDismiss={dismissBanner}
        />

        {screen === 'status' && <StatusScreen />}
        {screen === 'action' && <ActionScreen />}
        {screen === 'goal' && <GoalScreen />}
        {screen === 'map' && <MapScreen />}
        {screen === 'log' && <DecisionLogScreen />}
      </main>

      <HelpModal
        open={helpOpen}
        onClose={handleCloseHelp}
        initialSectionId={SCREEN_TO_HELP[screen]}
      />
    </div>
  );
}