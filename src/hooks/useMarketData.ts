// src/hooks/useMarketData.ts

import { useEffect, useState } from 'react';
import { loadMarketState, saveMarketState, isStale } from '../core/marketStore';
import { fetchAllMarketData } from '../core/marketFetcher';
import type { MarketState } from '../core/marketFetcher';

export function useMarketData() {
  const [state, setState] = useState<MarketState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // 1. Сначала показываем из кэша (мгновенно)
      const cached = await loadMarketState();
      if (cached) setState(cached);
      setLoading(false);

      // 2. Проверяем: данные устарели?
      const stale = await isStale(cached);
      
      if (stale || !cached) {
        // 3. Устарели — просим Service Worker обновить
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage('UPDATE_MARKET_DATA');
        } else {
          // SW ещё не готов — обновляем напрямую
          const fresh = await fetchAllMarketData();
          await saveMarketState(fresh);
          setState(fresh);
        }
      }
    })();

    // 4. Слушаем сообщение от SW «данные обновлены»
    const handler = (event: MessageEvent) => {
      if (event.data === 'DATA_UPDATED') {
        loadMarketState().then((fresh) => {
          if (fresh) setState(fresh);
        });
      }
    };
    navigator.serviceWorker?.addEventListener('message', handler);
    return () => navigator.serviceWorker?.removeEventListener('message', handler);
  }, []);

  return { state, loading };
}