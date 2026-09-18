// src/screens/ActionScreen.tsx

import { useState } from 'react';
import { calculateTruthScenarios, deriveStatus } from '../core/truthEngine';
import { MANUAL_MARKET } from '../data/manualMarket';
import { INSTRUMENTS } from '../data/instruments';
import { useDecisionLog } from '../hooks/useDecisionLog';
import { runMonteCarlo, INSTRUMENT_PARAMS, formatMoney } from '../core/monteCarlo';
import { MonteCarloChart } from '../components/MonteCarloChart';
import { ActionGuide } from '../components/ActionGuide';
import type { InstrumentType } from '../types/market';

type Step = 'choose-instrument' | 'check-plan' | 'paused' | 'scenarios';

export function ActionScreen() {
  const [step, setStep] = useState<Step>('choose-instrument');
  const [instrument, setInstrument] = useState<InstrumentType | null>(null);
  const [amount, setAmount] = useState<number>(100000);
  const [horizon, setHorizon] = useState<number>(10);
  const [pausedUntil, setPausedUntil] = useState<Date | null>(null);
  const { add } = useDecisionLog();

  const market = MANUAL_MARKET;

  /* ─── Шаг 1: выбор инструмента ─────────── */
  if (step === 'choose-instrument') {
    return (
      <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto', color: 'var(--text)' }}>
        <h2 style={{ marginBottom: 8, color: 'var(--heading)' }}>Что ты хочешь сделать?</h2>
        <p style={{ color: 'var(--subtext)', marginBottom: 24 }}>
          Выбери инструмент — приложение покажет честные сценарии.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {INSTRUMENTS.map((inst) => (
            <button
              key={inst.id}
              onClick={() => {
                setInstrument(inst.id);
                setStep('check-plan');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '1rem 1.25rem',
                background: 'var(--card-bg)',
                border: '2px solid var(--border)',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--text)',
              }}
            >
              <span style={{ fontSize: 32 }}>{inst.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--heading)' }}>{inst.title}</div>
                <div style={{ color: 'var(--subtext)', fontSize: 13 }}>{inst.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ─── Шаг 2: проверка плана ───────────── */
  if (step === 'check-plan') {
    return (
      <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto', color: 'var(--text)' }}>
        <button
          onClick={() => setStep('choose-instrument')}
          style={{ background: 'none', border: 'none', color: 'var(--subtext)', cursor: 'pointer', marginBottom: 16 }}
        >
          ← Назад
        </button>

        <h2 style={{ color: 'var(--heading)' }}>Это действие было в твоём плане?</h2>
        <p style={{ color: 'var(--subtext)' }}>
          Плане, который ты записал, когда был спокоен.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button
            onClick={() => {
              add({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                actionType: 'buy',
                instrument,
                amount,
                reason: 'По плану',
                wasInPlan: true,
                marketSnapshot: {
                  keyRate: market.keyRate,
                  inflation: market.inflation,
                  status: deriveStatus(market),
                },
              });
              setStep('scenarios');
            }}
            style={{ flex: 1, padding: '1rem', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}
          >
            Да, было
          </button>
          <button
            onClick={() => {
              add({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                actionType: 'buy',
                instrument,
                amount,
                reason: 'Импульс',
                wasInPlan: false,
                marketSnapshot: {
                  keyRate: market.keyRate,
                  inflation: market.inflation,
                  status: deriveStatus(market),
                },
              });
              setPausedUntil(new Date(Date.now() + 24 * 60 * 60 * 1000));
              setStep('paused');
            }}
            style={{ flex: 1, padding: '1rem', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}
          >
            Нет, это импульс
          </button>
        </div>
      </div>
    );
  }

  /* ─── Шаг 3: пауза 24 часа ────────────── */
  if (step === 'paused' && pausedUntil) {
    return (
      <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto', textAlign: 'center', color: 'var(--text)' }}>
        <h2 style={{ color: 'var(--heading)' }}>⏸ Пауза 24 часа</h2>
        <p>Вернись завтра. Если всё ещё захочешь — подтвердишь.</p>
        <p style={{ color: 'var(--subtext)', marginTop: '1rem' }}>
          Разблокировка: {pausedUntil.toLocaleString('ru-RU')}
        </p>
        <button
          onClick={() => setStep('choose-instrument')}
          style={{ marginTop: 24, padding: '0.75rem 1.5rem', background: 'var(--primary-dark)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer' }}
        >
          Понял, вернусь позже
        </button>
      </div>
    );
  }

  /* ─── Шаг 4: три сценария + Монте-Карло ─ */
  if (step === 'scenarios' && instrument) {
    const scenarios = calculateTruthScenarios(instrument, market);
    const inst = INSTRUMENTS.find((i) => i.id === instrument);
    const params = INSTRUMENT_PARAMS[instrument];

    const mc = runMonteCarlo({
      instrument,
      annualReturn: params.annualReturn,
      volatility: params.volatility,
      horizonYears: horizon,
      initialAmount: amount,
    });

    return (
      <div style={{ padding: '2rem', maxWidth: 700, margin: '0 auto', color: 'var(--text)' }}>
        <button
          onClick={() => setStep('choose-instrument')}
          style={{ background: 'none', border: 'none', color: 'var(--subtext)', cursor: 'pointer', marginBottom: 16 }}
        >
          ← Назад
        </button>

        <h2 style={{ color: 'var(--heading)' }}>
          {inst?.icon} {inst?.title}: анализ
        </h2>

        {/* Поля ввода суммы и горизонта */}
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          <div>
            <label style={{ fontSize: 12, color: 'var(--subtext)', display: 'block', marginBottom: 4 }}>
              Сумма, ₽
            </label>
            <input
              type="number"
              min="0"
              step="10000"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
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
          <div>
            <label style={{ fontSize: 12, color: 'var(--subtext)', display: 'block', marginBottom: 4 }}>
              Горизонт, лет
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={horizon}
              onChange={(e) => setHorizon(Math.min(30, Math.max(1, parseInt(e.target.value) || 10)))}
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

        {/* Три сценария */}
        <h3 style={{ marginTop: '1.5rem', color: 'var(--heading)' }}>Три сценария</h3>
        {scenarios.map((s) => (
          <div
            key={s.label}
            style={{
              margin: '1rem 0',
              padding: '1.25rem',
              borderRadius: 12,
              border: '2px solid',
              borderColor:
                s.label === 'optimistic' ? 'var(--success)' : s.label === 'base' ? 'var(--warning)' : 'var(--danger)',
              background: 'var(--card-bg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: 'var(--heading)' }}>{s.title}</strong>
              <span
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: s.totalReturn >= 0 ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {s.totalReturn > 0 ? '+' : ''}{s.totalReturn}%
              </span>
            </div>
            <p style={{ color: 'var(--subtext)', marginTop: '0.5rem' }}>{s.outcome}</p>
          </div>
        ))}

        {/* Монте-Карло */}
        <div
          style={{
            marginTop: '2rem',
            padding: '1.25rem',
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: 'var(--heading)', fontSize: 16 }}>
              🎲 Монте-Карло: 500 симуляций
            </h3>
            <span style={{ fontSize: 12, color: 'var(--subtext)' }}>
              {horizon} лет, доходность {params.annualReturn}%, волатильность {params.volatility}%
            </span>
          </div>

          {/* Метрики */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Metric label="Медиана" value={`${formatMoney(mc.median)} ₽`} color="var(--text)" />
            <Metric label="Худший (5%)" value={`${formatMoney(mc.p5)} ₽`} color="var(--danger)" />
            <Metric label="Лучший (95%)" value={`${formatMoney(mc.p95)} ₽`} color="var(--success)" />
            <Metric
              label="VaR 95% (модель)"
              value={`${mc.var95Percent.toFixed(1)}%`}
              color="var(--warning)"
            />
          </div>

          <div
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: '1px solid var(--border)',
              fontSize: 11,
              fontStyle: 'italic',
              color: 'var(--subtext)',
            }}
          >
            VaR 95% — модельная оценка порогового убытка при заданных предположениях
            (доходность {params.annualReturn}%, волатильность {params.volatility}%,
            горизонт {horizon} лет). Это не максимальный возможный убыток.
          </div>

          {/* Гистограмма */}
          <MonteCarloChart result={mc} initialAmount={amount} horizonYears={horizon} />

          {/* Пояснения */}
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--subtext)', lineHeight: 1.6 }}>
            <div>
              • <strong style={{ color: 'var(--danger)' }}>Убыток</strong> в {(mc.probLoss * 100).toFixed(0)}% случаев
            </div>
            <div>
              • <strong style={{ color: 'var(--warning)' }}>Хуже вклада (12,5%)</strong> в {(mc.probBelowDeposit * 100).toFixed(0)}% случаев
            </div>
            <div>
              • Вложено: {formatMoney(amount)} ₽ → медиана через {horizon} лет: {formatMoney(mc.median)} ₽
            </div>
          </div>
        </div>

        {/* ГАЙД ПО ПОКУПКЕ */}
        <ActionGuide instrument={instrument} />
      </div>
    );
  }

  return null;
}

/* ─── Вспомогательный компонент метрики ─── */
function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        padding: '0.5rem 0.75rem',
        background: 'var(--card-bg-soft)',
        borderRadius: 8,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--subtext)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
