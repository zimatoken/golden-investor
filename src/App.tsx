// src/App.tsx

import { useEffect, useState } from 'react';
import { Moon, Sun, Settings as SettingsIcon } from 'lucide-react';
import { StatusScreen } from './screens/StatusScreen';
import { ActionScreen } from './screens/ActionScreen';
import { MapScreen } from './screens/MapScreen';
import { DecisionLogScreen } from './screens/DecisionLogScreen';
import { GoalScreen } from './screens/GoalScreen';
import { HelpButton } from './components/HelpButton';
import { HelpModal } from './components/HelpModal';
import { SettingsModal } from './components/SettingsModal';
import { BackupIndicator } from './components/BackupIndicator';
import { NotificationBanner } from './components/NotificationBanner';
import { useTheme } from './hooks/useTheme';
import { useNotifications } from './hooks/useNotifications';
import { useKGTransfer } from './hooks/useKGTransfer';
import { KGBanner } from './components/KGBanner';
import { KGToast } from './components/KGToast';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<{ amountMinor: number; currency: string } | null>(null);

  const { theme, toggleTheme } = useTheme();
  const {
    permission,
    requestPermission,
    bannerReminders,
    dismissBanner,
  } = useNotifications();
  const { data: kgData, dismiss: dismissKG } = useKGTransfer();

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
      className="app-root"
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        transition: 'background 0.2s ease, color 0.2s ease',
      }}
    >
      {/* ─── Навигация (две строки на мобильном) ─── */}
      <nav className="app-nav">
        {/* Строка 1: 5 экранов */}
        <div className="app-nav-row app-nav-screens">
          {NAV_ITEMS.map((item) => {
            const isActive = screen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setScreen(item.id)}
                className={`app-nav-btn${isActive ? ' app-nav-btn-active' : ''}`}
              >
                <span className="app-nav-icon">{item.icon}</span>
                <span className="app-nav-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Строка 2: иконки действий */}
        <div className="app-nav-row app-nav-actions">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
            className="app-nav-icon-btn"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <BackupIndicator />

          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Настройки"
            className="app-nav-icon-btn"
          >
            <SettingsIcon size={18} />
          </button>

          <HelpButton onClick={() => setHelpOpen(true)} />
        </div>
      </nav>

      <main style={{ padding: '1rem', maxWidth: 900, margin: '0 auto' }}>
        {/* Баннер от Kapital Garden — если пришли с ?from=kg&amount=... */}
        {kgData && (
          <KGBanner
            data={kgData}
            onAccepted={(amountMinor, currency) => {
              setToast({ amountMinor, currency });
              dismissKG();
            }}
            onDismiss={dismissKG}
          />
        )}

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

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenHelp={() => {
          setSettingsOpen(false);
          setHelpOpen(true);
        }}
      />

      {/* Toast «Принято X ₽ · Куда вложить?» */}
      {toast && (
        <KGToast
          amountMinor={toast.amountMinor}
          currency={toast.currency}
          onGoToAction={() => {
            setScreen('action');
            setToast(null);
          }}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}