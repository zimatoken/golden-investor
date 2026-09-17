// src/screens/StatusScreen.tsx

import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { deriveStatus } from '../core/truthEngine';
import { useDecisionLog } from '../hooks/useDecisionLog';
import { useMarketData } from '../hooks/useMarketData';
import { BanksTable } from '../components/BanksTable';
import { EventsCalendar } from '../components/EventsCalendar';
import { SourcesModal } from '../components/SourcesModal';
import { SourceLink } from '../components/SourceLink';
import { YieldCurve } from '../components/YieldCurve';
import { DurationRisk } from '../components/DurationRisk';
import { MARKET_SOURCES } from '../data/sources';
import { getOracleAdvice } from '../core/oracle';
import {
  YIELD_CURVE_TENORS,
  YIELD_CURVE_LABELS,
  type MarketState,
} from '../data/manualMarket';
import type { PlanRow } from '../types/market';

export function StatusScreen() {
  const { market, updateMarket, resetToDefault, isStale, daysSince } =
    useMarketData();
  const status = deriveStatus(market);
  const { monthAgo, recordStatus } = useDecisionLog();

  const [editOpen, setEditOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [draft, setDraft] = useState<MarketState>(market);

  const [plan] = useState<PlanRow[]>(() => {
    try {
      const raw = localStorage.getItem('gi_plan_map_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    recordStatus(status);
  }, [status, recordStatus]);

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

  /**
   * Обновление точки кривой прямо в draft (для формы редактирования).
   */
  const handleCurveChange = (months: number, value: number) => {
    setDraft((prev) => {
      const curve = prev.yieldCurve ?? [];
      const idx = curve.findIndex((p) => p.months === months);
      const newCurve =
        idx >= 0
          ? curve.map((p) => (p.months === months ? { ...p, yield: value } : p))
          : [...curve, { months, yield: value }].sort((a, b) => a.months - b.months);
      return { ...prev, yieldCurve: newCurve };
    });
  };

  const advice = getOracleAdvice(market, plan);

  const levelColors: Record<string, { bg: string; border: string; color: string }> = {
    act: { bg: 'rgba(34,197,94,0.08)', border: 'var(--success)', color: 'var(--success)' },
    wait: { bg: 'rgba(234,179,8,0.08)', border: 'var(--warning)', color: 'var(--warning)' },
    danger: { bg: 'rgba(239,68,68,0.08)', border: 'var(--danger)', color: 'var(--danger)' },
  };
  const advColor = levelColors[advice.level];

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

      {/* КРИВАЯ ДОХОДНОСТИ ОФЗ */}
      {!editOpen && <YieldCurve points={market.yieldCurve} />}

      {/* ЧУВСТВИТЕЛЬНОСТЬ К СТАВКЕ (DURATION) */}
      {!editOpen && <DurationRisk curve={market.yieldCurve} />}

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0, color: 'var(--heading)', fontSize: 16 }}>
              📝 Обновить данные ЦБ
            </h3>
            <button
              onClick={() => setSourcesOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.35rem 0.7rem',
                background: 'transparent',
                color: 'var(--primary)',
                border: '1px solid var(--primary)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <BookOpen size={14} /> Все источники
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 12 }}>
            Нажми 🔗 рядом с полем — откроется официальный источник. Возьми цифру, впиши сюда.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Field
              label="Ключевая ставка, %"
              value={draft.keyRate}
              onChange={(v) => setDraft({ ...draft, keyRate: v })}
              sourceUrl={MARKET_SOURCES.keyRate.url}
            />
            <Field
              label="Инфляция, %"
              value={draft.inflation}
              onChange={(v) => setDraft({ ...draft, inflation: v })}
              sourceUrl={MARKET_SOURCES.inflation.url}
            />

            {/* ─── КРИВАЯ ДОХОДНОСТИ ─── */}
            <div style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <label style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 600 }}>
                  Кривая доходности ОФЗ, %
                </label>
                <SourceLink url={MARKET_SOURCES.ofz10y.url} label="Кривая ЦБ" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {YIELD_CURVE_TENORS.map((m) => {
                  const point = draft.yieldCurve?.find((p) => p.months === m);
                  const val = point?.yield ?? 0;
                  return (
                    <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label style={{ fontSize: 11, color: 'var(--subtext)', width: 50, textAlign: 'right' }}>
                        {YIELD_CURVE_LABELS[m]}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={val}
                        onChange={(e) =>
                          handleCurveChange(m, Math.max(0, parseFloat(e.target.value) || 0))
                        }
                        style={{
                          flex: 1,
                          padding: '0.4rem',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          background: 'var(--card-bg-soft)',
                          color: 'var(--text)',
                          fontSize: 13,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: 'var(--subtext-muted)', marginTop: 6, lineHeight: 1.5 }}>
                ofz10y и ofzShort обновятся автоматически из 10-летней и 1-летней точек.
              </p>
            </div>

            <Field
              label="Средняя ставка по вкладам, %"
              value={draft.depositRate}
              onChange={(v) => setDraft({ ...draft, depositRate: v })}
              sourceUrl={MARKET_SOURCES.depositRate.url}
            />
            <Field
              label="Золото, руб/грамм"
              value={draft.goldPrice}
              onChange={(v) => setDraft({ ...draft, goldPrice: v })}
              sourceUrl={MARKET_SOURCES.goldPrice.url}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <label style={{ fontSize: 12, color: 'var(--subtext)' }}>
                  Следующее заседание ЦБ
                </label>
                <SourceLink url={MARKET_SOURCES.nextCBDate.url} label="Календарь ЦБ" />
              </div>
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
              style={{ flex: 1, padding: '0.6rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
            >
              ✓ Сохранить
            </button>
            <button
              onClick={() => setEditOpen(false)}
              style={{ flex: 1, padding: '0.6rem', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}
            >
              Отмена
            </button>
          </div>

          <button
            onClick={handleReset}
            style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--subtext-muted)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
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

      {/* ОРАКУЛ */}
      <div
        style={{
          marginTop: '1.5rem',
          padding: '1.25rem',
          background: advColor.bg,
          border: `2px solid ${advColor.border}`,
          borderRadius: 12,
          color: 'var(--text)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
            fontSize: 12,
            color: advColor.color,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 700,
          }}
        >
          <span>{advice.icon}</span>
          <span>{advice.title}</span>
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--heading)',
            marginBottom: 12,
            lineHeight: 1.4,
          }}
        >
          {advice.headline}
        </div>

        <ul
          style={{
            margin: 0,
            paddingLeft: 20,
            fontSize: 13,
            color: 'var(--text-soft)',
            lineHeight: 1.7,
          }}
        >
          {advice.reasoning.map((r, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{r}</li>
          ))}
        </ul>

        {advice.action && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
              fontSize: 13,
              color: advColor.color,
              fontWeight: 600,
            }}
          >
            🎯 {advice.action}
          </div>
        )}

        {advice.warning && (
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: 'var(--subtext)',
              fontStyle: 'italic',
              lineHeight: 1.6,
            }}
          >
            ⚠️ {advice.warning}
          </div>
        )}
      </div>

      {/* КАЛЕНДАРЬ ИНВЕСТОРА */}
      <EventsCalendar />

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

      {/* МОДАЛКА «ВСЕ ИСТОЧНИКИ» */}
      <SourcesModal open={sourcesOpen} onClose={() => setSourcesOpen(false)} />
    </div>
  );
}

/* ─── Поле с кнопкой «🔗 Источник» ─────────── */
function Field({
  label,
  value,
  onChange,
  sourceUrl,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  sourceUrl?: string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <label style={{ fontSize: 12, color: 'var(--subtext)' }}>{label}</label>
        {sourceUrl && <SourceLink url={sourceUrl} label={`Источник: ${label}`} />}
      </div>
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