// src/screens/StatusScreen.tsx

import { useEffect } from 'react';
import { MANUAL_MARKET } from '../data/manualMarket';
import { deriveStatus } from '../core/truthEngine';
import { useDecisionLog } from '../hooks/useDecisionLog';

export function StatusScreen() {
  const market = MANUAL_MARKET;
  const status = deriveStatus(market);
  const { monthAgo, recordStatus } = useDecisionLog();

  // Записываем текущий статус в историю (один раз в день)
  useEffect(() => {
    recordStatus(status);
  }, [status, recordStatus]);

  const statusConfig = {
    act: { color: 'var(--success)', text: '🟢 Можно действовать' },
    wait: { color: 'var(--warning)', text: '🟡 Ждать' },
    'do-nothing': { color: 'var(--danger)', text: '🔴 Не действовать' },
  };

  const cfg = statusConfig[status];

  const statusLabel = (s: 'act' | 'wait' | 'do-nothing') =>
    s === 'act' ? '🟢 Действовать' : s === 'wait' ? '🟡 Ждать' : '🔴 Не действовать';

  return (
    <div className="status-screen" style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <div
        className="status-badge"
        style={{
          background: cfg.color,
          color: '#fff',
          padding: '1.5rem',
          borderRadius: 16,
          fontSize: '1.5rem',
          fontWeight: 700,
          textAlign: 'center',
        }}
      >
        {cfg.text}
      </div>

      <div style={{ marginTop: '2rem', fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)' }}>
        <p><strong>Ключевая ставка:</strong> {market.keyRate}%</p>
        <p><strong>Инфляция:</strong> {market.inflation}%</p>
        <p><strong>Следующее заседание ЦБ:</strong> {market.nextCBDate}</p>
        <p><strong>10-летние ОФЗ:</strong> {market.ofz10y}%</p>
        <p><strong>Средняя ставка по вкладам:</strong> {market.depositRate}%</p>
      </div>

      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'var(--card-bg-soft)',
          borderRadius: 12,
          color: 'var(--text)',
        }}
      >
        <p><strong>Рекомендация:</strong></p>
        <p>
          {status === 'do-nothing' && 'Дождись решения ЦБ. Сегодня ничего не делай. Приходи завтра.'}
          {status === 'wait' && 'Условия неполные. Продолжай наблюдать. Следующий сигнал — заседание ЦБ.'}
          {status === 'act' && 'Окно возможностей открыто. Проверь свой план и действуй по карте.'}
        </p>
      </div>

      {/* ─── История статусов ─────────────── */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          color: 'var(--text)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: 'var(--subtext)',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          История
        </div>
        {monthAgo ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span>📅 Месяц назад</span>
            <span>{statusLabel(monthAgo.status)}</span>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--subtext-muted)' }}>
            Пока нет истории. Возвращайся — статус сохраняется.
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 6, fontWeight: 600 }}>
          <span>📅 Сейчас</span>
          <span>{statusLabel(status)}</span>
        </div>
      </div>

      <button
        onClick={() => window.close()}
        style={{
          marginTop: '2rem',
          width: '100%',
          padding: '1rem',
          fontSize: '1rem',
          background: 'var(--primary-dark)',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          cursor: 'pointer',
        }}
      >
        Закрыть приложение
      </button>
    </div>
  );
}