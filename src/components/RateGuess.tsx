// src/components/RateGuess.tsx
//
// PHASE 10.1 — Блок «Угадай ставку ЦБ».
// Показывается, если заседание ЦБ близко (≤14 дней) или недавно прошло.

import { useEffect, useState } from 'react';
import type { MarketState } from '../data/manualMarket';
import {
  addGuess,
  getActiveGuess,
  getGuessStats,
  getRateOptions,
  loadGuesses,
  resolveGuesses,
  daysUntil,
  type RateGuess,
} from '../core/rateGuess';

interface RateGuessProps {
  market: MarketState;
}

export function RateGuess({ market }: RateGuessProps) {
   const [, setVersion] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  // Резолвим прогнозы при загрузке и при изменении рынка
  useEffect(() => {
    resolveGuesses(market);
    setVersion((v) => v + 1);
  }, [market]);

  const days = daysUntil(market.nextCBDate);
  const activeGuess = getActiveGuess(market.nextCBDate);
  const stats = getGuessStats();

  // Последний решённый прогноз (для показа результата)
  const allGuesses = loadGuesses();
  const lastResolved = allGuesses
    .filter((g) => g.resolved)
    .sort((a, b) => new Date(b.resolvedAt!).getTime() - new Date(a.resolvedAt!).getTime())[0];

  // Показываем блок только если:
  // - заседание в ближайшие 14 дней, ИЛИ
  // - заседание уже прошло, но есть нерешённый прогноз, ИЛИ
  // - есть последний решённый прогноз (показать результат)
  const showBlock =
    (days >= 0 && days <= 14) ||
    (days < 0 && activeGuess) ||
    (lastResolved && daysUntil(lastResolved.cbDate) < 0 && Date.now() - new Date(lastResolved.resolvedAt!).getTime() < 30 * 24 * 60 * 60 * 1000);

  if (!showBlock) return null;

  const options = getRateOptions(market.keyRate);

  const handleSubmit = () => {
    if (selected === null) return;
    addGuess(selected, market.keyRate, market.nextCBDate);
    setSelected(null);
    setVersion((v) => v + 1);
  };

  // Сценарий 1: Активный прогноз — уже сделан
  if (activeGuess) {
    return (
      <Card>
        <Header icon="🎲" title="Угадай ставку ЦБ" subtitle={`Заседание через ${days} дн.`} />
        <Paragraph>
          Твой прогноз: <strong>{activeGuess.guessRate.toFixed(2)}%</strong>
          {' '}(при текущей ставке {activeGuess.baseRate.toFixed(2)}%).
        </Paragraph>
        <Paragraph muted>
          После заседания приложение сравнит твой прогноз с фактом.
        </Paragraph>
        {stats.resolved > 0 && (
          <StatsLine stats={stats} />
        )}
      </Card>
    );
  }

  // Сценарий 2: Заседание близко, прогноза ещё нет
  if (days >= 0 && days <= 14) {
    return (
      <Card>
        <Header
          icon="🎲"
          title="Угадай ставку ЦБ"
          subtitle={`Заседание через ${days} дн.`}
        />
        <Paragraph muted>
          Текущая ставка: <strong>{market.keyRate.toFixed(2)}%</strong>.
          {' '}Как думаешь — какая будет после заседания?
        </Paragraph>

        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            marginTop: 10,
            marginBottom: 10,
          }}
        >
          {options.map((rate) => (
            <button
              key={rate}
              onClick={() => setSelected(rate)}
              style={{
                padding: '0.45rem 0.8rem',
                background:
                  selected === rate ? 'var(--primary)' : 'var(--card-bg-soft)',
                color: selected === rate ? '#fff' : 'var(--text)',
                border: '1px solid ' + (selected === rate ? 'var(--primary)' : 'var(--border)'),
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: selected === rate ? 700 : 500,
              }}
            >
              {rate.toFixed(2)}%
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleSubmit}
            disabled={selected === null}
            style={{
              padding: '0.5rem 1rem',
              background: selected === null ? 'var(--border)' : 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: selected === null ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            ✓ Записать прогноз
          </button>
          {stats.resolved > 0 && <StatsLine stats={stats} inline />}
        </div>
      </Card>
    );
  }

  // Сценарий 3: Последний прогноз — решён (показать результат)
  if (lastResolved) {
    return (
      <Card>
        <Header
          icon={lastResolved.correct ? '✅' : '❌'}
          title={lastResolved.correct ? 'Угадал!' : 'Не угадал'}
          subtitle={`Заседание ${lastResolved.cbDate}`}
        />
        <Paragraph>
          Твой прогноз: <strong>{lastResolved.guessRate.toFixed(2)}%</strong>.
          {' '}Фактическая ставка: <strong>{lastResolved.actualRate?.toFixed(2)}%</strong>.
        </Paragraph>
        {!lastResolved.correct && (
          <Paragraph muted>
            Разница: {Math.abs((lastResolved.actualRate ?? 0) - lastResolved.guessRate).toFixed(2)} п.п.
          </Paragraph>
        )}
        <StatsLine stats={stats} />
      </Card>
    );
  }

  return null;
}

/* ─── Вспомогательные компоненты ─── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--primary)',
        borderRadius: 12,
        padding: '12px 16px',
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function Header({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)' }}>
        {title}
      </span>
      {subtitle && (
        <span style={{ fontSize: 12, color: 'var(--subtext)' }}>· {subtitle}</span>
      )}
    </div>
  );
}

function Paragraph({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <p
      style={{
        margin: '4px 0',
        fontSize: 13,
        color: muted ? 'var(--subtext)' : 'var(--text-soft)',
        lineHeight: 1.5,
      }}
    >
      {children}
    </p>
  );
}

function StatsLine({ stats, inline }: { stats: ReturnType<typeof getGuessStats>; inline?: boolean }) {
  const text = `Угадал: ${stats.correct} / ${stats.resolved}${stats.accuracy !== null ? ` (${stats.accuracy}%)` : ''}`;

  if (inline) {
    return (
      <span style={{ fontSize: 12, color: 'var(--subtext)' }}>{text}</span>
    );
  }

  return (
    <p
      style={{
        margin: '8px 0 0 0',
        paddingTop: 8,
        borderTop: '1px solid var(--border)',
        fontSize: 12,
        color: 'var(--subtext)',
      }}
    >
      📊 {text}
    </p>
  );
}