// src/screens/ActionScreen.tsx

import { useState } from 'react';
import { calculateTruthScenarios, deriveStatus } from '../core/truthEngine';
import { MANUAL_MARKET } from '../data/manualMarket';
import { INSTRUMENTS } from '../data/instruments';
import { useDecisionLog } from '../hooks/useDecisionLog';
import {
  runMonteCarlo,
  getMonteCarloParams,
  getScenarioParams,
  formatMoney,
  type RateScenario,
} from '../core/monteCarlo';
import { MonteCarloChart } from '../components/MonteCarloChart';
import { ActionGuide } from '../components/ActionGuide';
import { StressTest } from '../components/StressTest';
import type { InstrumentType } from '../types/market';

type Step = 'choose-instrument' | 'check-plan' | 'paused' | 'scenarios';

export function ActionScreen() {
  const [step, setStep] = useState<Step>('choose-instrument');
  const [instrument, setInstrument] = useState<InstrumentType | null>(null);
  const [amount, setAmount] = useState<number>(100000);
  const [horizon, setHorizon] = useState<number>(10);
  const [pausedUntil, setPausedUntil] = useState<Date | null>(null);
  const [scenarioLabel, setScenarioLabel] = useState<RateScenario>('flat');
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
    const params = getMonteCarloParams(instrument, market);

    // Для ОФЗ — сценарная модель. Для вклада и золота — базовые параметры.
    const isScenarioMode = instrument === 'ofz';
    const scenarioParams = isScenarioMode
      ? getScenarioParams(market, horizon)
      : null;

    const activeScenario = scenarioParams?.find((s) => s.label === scenarioLabel)
      ?? scenarioParams?.[1]
      ?? null;

    const effectiveReturn = activeScenario ? activeScenario.annualReturn : params.annualReturn;
    const effectiveIsScenario = activeScenario ? true : params.isScenario;

    const mc = runMonteCarlo({
      instrument,
      annualReturn: effectiveReturn,
      volatility: params.volatility,
      horizonYears: horizon,
      initialAmount: amount,
      inflation: market.inflation,
      isScenario: effectiveIsScenario,
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, color: 'var(--heading)', fontSize: 16 }}>
              🎲 Монте-Карло: 500 симуляций
              {isScenarioMode && ' — сценарная модель'}
            </h3>
            <span style={{ fontSize: 12, color: 'var(--subtext)' }}>
              {horizon} лет · доходность {effectiveReturn}% · волатильность {params.volatility}%
              {effectiveIsScenario && (
                <span
                  style={{
                    marginLeft: 6,
                    padding: '1px 6px',
                    background: 'rgba(234,179,8,0.15)',
                    color: 'var(--warning)',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  сценарий
                </span>
              )}
            </span>
          </div>

          {/* СЕЛЕКТОР СЦЕНАРИЕВ — только для ОФЗ */}
          {isScenarioMode && scenarioParams && (
            <div
              style={{
                display: 'flex',
                gap: 6,
                marginBottom: 16,
                flexWrap: 'wrap',
              }}
            >
              {scenarioParams.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setScenarioLabel(s.label)}
                  style={{
                    padding: '0.5rem 0.9rem',
                    background: scenarioLabel === s.label ? 'var(--primary-dark)' : 'var(--card-bg-soft)',
                    color: scenarioLabel === s.label ? '#fff' : 'var(--text)',
                    border: '1px solid ' + (scenarioLabel === s.label ? 'var(--primary-dark)' : 'var(--border)'),
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: scenarioLabel === s.label ? 600 : 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.label === 'falling' ? '📉 Ставка ↓' :
                   s.label === 'flat' ? '📊 Ставка →' :
                   '📈 Ставка ↑'}
                </button>
              ))}
            </div>
          )}

          {/* ОПИСАНИЕ АКТИВНОГО СЦЕНАРИЯ */}
          {activeScenario && (
            <div
              style={{
                padding: '10px 12px',
                background: 'var(--card-bg-soft)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--text-soft)',
                marginBottom: 12,
                lineHeight: 1.55,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--heading)', marginBottom: 4 }}>
                {activeScenario.title}
              </div>
              <div>{activeScenario.description}</div>
            </div>
          )}

          {/* Метрики */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Metric label="Медиана (номинал)" value={`${formatMoney(mc.median)} ₽`} color="var(--text)" />
            <Metric label="Медиана (реально)" value={`${formatMoney(mc.realMedian)} ₽`} color="var(--primary)" />
            <Metric label="Худший (5%)" value={`${formatMoney(mc.p5)} ₽`} color="var(--danger)" />
            <Metric label="Лучший (95%)" value={`${formatMoney(mc.p95)} ₽`} color="var(--success)" />
            <Metric
              label="VaR 95% (модель)"
              value={`${mc.var95Percent.toFixed(1)}%`}
              color="var(--warning)"
            />
          </div>

          {/* Гистограмма */}
          <MonteCarloChart result={mc} initialAmount={amount} horizonYears={horizon} />

          {/* Пояснения */}
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--subtext)', lineHeight: 1.6 }}>
            <div>
              • <strong style={{ color: 'var(--danger)' }}>Убыток</strong> в {(mc.probLoss * 100).toFixed(0)}% случаев
            </div>
            <div>
              • <strong style={{ color: 'var(--warning)' }}>Хуже вклада ({mc.depositRate}%)</strong> в {(mc.probBelowDeposit * 100).toFixed(0)}% случаев
            </div>
            <div>
              • Вложено: {formatMoney(amount)} ₽ → медиана через {horizon} лет: {formatMoney(mc.median)} ₽ (номинал)
            </div>
            <div>
              • С учётом инфляции {market.inflation}%: {formatMoney(mc.realMedian)} ₽ в сегодняшних деньгах
            </div>
          </div>

          {/* СРАВНЕНИЕ ТРЁХ СЦЕНАРИЕВ — только для ОФЗ */}
          {isScenarioMode && scenarioParams && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--subtext)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                  fontWeight: 700,
                }}
              >
                Сравнение сценариев (медиана, номинал)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                {scenarioParams.map((s) => {
                  const sMc = runMonteCarlo({
                    instrument,
                    annualReturn: s.annualReturn,
                    volatility: params.volatility,
                    horizonYears: horizon,
                    initialAmount: amount,
                    inflation: market.inflation,
                    isScenario: true,
                  });
                  return (
                    <div
                      key={s.label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        background: scenarioLabel === s.label ? 'rgba(59,130,246,0.08)' : 'transparent',
                        borderRadius: 4,
                      }}
                    >
                      <span style={{ color: 'var(--text-soft)' }}>
                        {s.label === 'falling' ? '📉 Ставка ↓' :
                         s.label === 'flat' ? '📊 Ставка →' :
                         '📈 Ставка ↑'}
                        <span style={{ color: 'var(--subtext)', marginLeft: 6 }}>
                          ({s.annualReturn}%)
                        </span>
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {formatMoney(sMc.median)} ₽
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Дисклеймер */}
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
            VaR 95% — модельная оценка порогового убытка при заданных
            предположениях (доходность {effectiveReturn}%,
            волатильность {params.volatility}%, горизонт {horizon} лет).
            Это не максимальный возможный убыток.
            {effectiveIsScenario && (
              <>
                {' '}
                Доходность {effectiveReturn}% — <strong>сценарное допущение</strong>, не прогноз.
              </>
            )}
          </div>
        </div>

        {/* СТРЕСС-ТЕСТ */}
        <StressTest
          instrument={instrument}
          market={market}
          horizonYears={horizon}
          initialAmount={amount}
        />

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