// src/contexts/NavigationContext.tsx
//
// Мини-контекст для «отложенных действий»:
// SettingsModal ставит флаг → StatusScreen его подхватывает
// и открывает нужную модалку (PolicyEditor / InvalidationEditor и т.д.).

import { createContext, useContext, useState, type ReactNode } from 'react';

export type PendingAction =
  | { type: 'open-policy' }
  | { type: 'open-invalidation' }
  | { type: 'open-data-transfer' }
  | null;

interface NavContextValue {
  pending: PendingAction;
  dispatch: (action: PendingAction) => void;
  consume: () => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingAction>(null);

  const value: NavContextValue = {
    pending,
    dispatch: setPending,
    consume: () => setPending(null),
  };

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNavigation(): NavContextValue {
  const ctx = useContext(NavContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return ctx;
}