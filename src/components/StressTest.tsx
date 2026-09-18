// src/components/StressTest.tsx

import type { InstrumentType } from '../types/market';
import type { MarketState } from '../data/manualMarket';
import { runStressTest, formatMoney, type StressScenario } from '../core/monteCarlo';

interface StressTestProps {
  instrument: InstrumentType;
  market: MarketState;
  horizonYears: number;
  initialAmount: number;
}

export function StressTest({
  instrument,
  market,
  horizonYears,
  initialAmount,
}: StressTestProps) {
  const result = runStressTest(instrument, market, horizonYears, initialAmount);

  const toneColor = (tone: StressScenario['tone']): string => {
    if (tone === 'positive') return 'var(--success)';
    if (tone === 'negative') return 'var(--danger)';
    return 'var(--warning)';
  };

  return (
    <div
      style={{
        marginTop: '2rem',
        padding: '1.25rem',
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, color: 'var(--heading)', fontSize: 16 }}>
          💥 Стресс-тест: 5 шоков
        </h3>
        <span style={{ fontSize: 12, color: 'var(--subtext)' }}>
          Базовый сценарий: {formatMoney(result.baseMedian)} ₽ (медиана)
        </span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--subtext)', margin: '0 0 16px 0', lineHeight: 1.55 }}>
        Это не прогноз. Это проверка: «что будет, если случится X?»
        Каждый шок — отдельный сценарий.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {result.scenarios.map((s) => (
          <div
            key={s.id}
            style={{
              padding: '10px 12px',
              background: 'var(--card-bg-soft)',
              borderLeft: `3px solid ${toneColor(s.tone)}`,
              borderRadius: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>
                {s.icon} {s.title}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: toneColor(s.tone) }}>
                {formatMoney(s.median)} ₽
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--subtext)', lineHeight: 1.5 }}>
              {s.impact}
            </div>
            <div style={{ fontSize: 11, color: 'var(--subtext-muted)', marginTop: 2 }}>
              Реально (с инфляцией): {formatMoney(s.realMedian)} ₽
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid var(--border)',
          fontSize: 11,
          fontStyle: 'italic',
          color: 'var(--subtext)',
          lineHeight: 1.5,
        }}
      >
        Стресс-тест показывает, как изменятся результаты при каждом шоке
        по отдельности. В реальности шоки могут совпадать и усиливать друг друга.
      </div>
    </div>
  );
}