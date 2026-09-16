// src/screens/StatusScreen.tsx

import { useEffect, useState } from 'react';
import { deriveStatus } from '../core/truthEngine';
import { useDecisionLog } from '../hooks/useDecisionLog';
import { useMarketData } from '../hooks/useMarketData';
import { BanksTable } from '../components/BanksTable';
import type { MarketState } from '../data/manualMarket';

export function StatusScreen() {
  const { market, updateMarket, resetToDefault, isStale, daysSince } = useMarketData();
  const status = deriveStatus(market);
  const { monthAgo, recordStatus } = useDecisionLog();

  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<MarketState>(market);

  // Записываем текущий статус в историю (один раз в день)
  useEffect(() => {
    recordStatus(status);
  }, [status, recordStatus]);

  // При открытии формы — сбросить draft на актуальный market
  useEffect(() => {
    if (editOpen) setDraft(market);
  }, [editOpen, market]);

  const statusConfig = {
    act: { color: 'var(--success)', text: '🟢 Можно действовать' },
    wait: { color: 'var(--warning)', text: '🟡 Ждать' },
    'do-nothing': { color: 'var(--danger)', text: '🔴 Не действовать' },
  };

  const cfg = statusConfig[status];

  const statusLabel = (s: 'act' | 'wait' | 'do-nothing') =>
    s === 'act' ? '🟢 Действовать' : s === 'wait' ? '🟡 Ждать' : '🔴 Не действовать';

  const handleSave = () => {
    updateMarket(draft);
    setEditOpen(false);
  };

  const handleReset = () => {
    if (confirm('Вернуть данные к стандартным? Твои правки будут потеряны.')) {
      resetToDefault();
      setEditOpen(false);
    }
  };

  return (
    <div className="status-screen" style={{ padding: '2rem', maxWidth: 700, margin: '0 auto' }}>
      {/* Баннер устаревших данных */}
      {isStale && !editOpen && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            background: 'rgba(234,179,8,0.1)',
            border: '1px solid var(--warning)',
            borderRadius: 12,
            color: 'var(--text)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 13 }}>
            ⚠️ Данные ЦБ не обновлялись <strong>{daysSince} дн.</strong>
          </div>
          <button
            onClick={() => setEditOpen(true)}
            style={{
              padding: '0.4rem 0.8rem',
              background: 'var(--warning)',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Обновить
          </button>
        </div>
      )}

      {/* Форма редактирования ЦБ */}
      {editOpen && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'var(--card-bg)',
            border: '2px solid var(--primary)',
            borderRadius: 12,
            color: 'var(--text)',
          }}
        >
          <h3 style={{ margin: '0 0 0.75rem', color: 'var(--heading)', fontSize: 16 }}>
            📝 Обновить данные ЦБ
          </h3>
          <p style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 12 }}>
            Возьми актуальные значения с{' '}
            <a
              href="https://www.cbr.ru/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary)' }}
            >
              cbr.ru
            </a>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Field
              label="Ключевая ставка, %"
              value={draft.keyRate}
              onChange={(v) => setDraft({ ...draft, keyRate: v })}
            />
            <Field
              label="Инфляция, %"
              value={draft.inflation}
              onChange={(v) => setDraft({ ...draft, inflation: v })}
            />
            <Field
              label="10-летние ОФЗ, %"
              value={draft.ofz10y}
              onChange={(v) => setDraft({ ...draft, ofz10y: v })}
            />
            <Field
              label="Короткие ОФЗ, %"
              value={draft.ofzShort}
              onChange={(v) => setDraft({ ...draft, ofzShort: v })}
            />
            <Field
              label="Средняя ставка по вкладам, %"
              value={draft.depositRate}
              onChange={(v) => setDraft({ ...draft, depositRate: v })}
            />
            <Field
              label="Золото, руб/грамм"
              value={draft.goldPrice}
              onChange={(v) => setDraft({ ...draft, goldPrice: v })}
            />
            <div>
              <label style={{ fontSize: 12, color: 'var(--subtext)', display: 'block', marginBottom: 4 }}>
                Следующее заседание ЦБ
              </label>
              <input
                type="date"
                value={draft.nextCBDate}
                onChange={(e) => setDraft({ ...draft, nextCBDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'var(--card-bg-soft)',
                  color: 'var(--text)',
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '0.6rem',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              ✓ Сохранить
            </button>
            <button
              onClick={() => setEditOpen(false)}
              style={{
                flex: 1,
                padding: '0.6rem',
                background: 'transparent',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Отмена
            </button>
          </div>

          <button
            onClick={handleReset}
            style={{
              marginTop: 12,
              background: 'none',
              border: 'none',
              color: 'var(--subtext-muted)',
              fontSize: 12,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Вернуть стандартные значения
          </button>
        </div>
      )}

      {/* Статус-плашка */}
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

      {/* Метрики ЦБ */}
      <div style={{ marginTop: '2rem', fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)' }}>
        <p><strong>Ключевая ставка:</strong> {market.keyRate}%</p>
        <p><strong>Инфляция:</strong> {market.inflation}%</p>
        <p><strong>Следующее заседание ЦБ:</strong> {market.nextCBDate}</p>
        <p><strong>10-летние ОФЗ:</strong> {market.ofz10y}%</p>
        <p><strong>Средняя ставка по вкладам:</strong> {market.depositRate}%</p>
      </div>

      {/* Кнопка обновления ЦБ (если данные свежие) */}
      {!editOpen && !isStale && (
        <button
          onClick={() => setEditOpen(true)}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: 'transparent',
            color: 'var(--subtext)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          ✏️ Обновить данные ЦБ вручную
        </button>
      )}

      {/* ТАБЛИЦА БАНКОВ */}
      <BanksTable />

      {/* Рекомендация */}
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

      {/* История статусов */}
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
        <div
          style={{
            fontSize: 12,
            color: 'var(--subtext)',
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>🕐 Обновлено</span>
          <span>
            {new Date(market.updatedAt).toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
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

/* ─── Вспомогательный компонент поля ──────────── */
function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label style={{ fontSize: 12, color: 'var(--subtext)', display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: '1px solid var(--border)',
          borderRadius: 8,
          background: 'var(--card-bg-soft)',
          color: 'var(--text)',
          fontSize: 14,
        }}
      />
    </div>
  );
}