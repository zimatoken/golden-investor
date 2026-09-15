// src/screens/ActionScreen.tsx

import { useState } from 'react';
import { calculateTruthScenarios, deriveStatus } from '../core/truthEngine';
import { MANUAL_MARKET } from '../data/manualMarket';
import { INSTRUMENTS } from '../data/instruments';
import { useDecisionLog } from '../hooks/useDecisionLog';
import type { InstrumentType } from '../types/market';

type Step = 'choose-instrument' | 'check-plan' | 'paused' | 'scenarios';

export function ActionScreen() {
  const [step, setStep] = useState<Step>('choose-instrument');
  const [instrument, setInstrument] = useState<InstrumentType | null>(null);
  const [pausedUntil, setPausedUntil] = useState<Date | null>(null);
  const { add } = useDecisionLog();

  const market = MANUAL_MARKET;

  /* ─── Шаг 1: выбор инструмента ─────────── */
  if (step === 'choose-instrument') {
    return (
      <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
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
      <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
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
              // Записываем решение «по плану»
              add({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                actionType: 'buy',
                instrument,
                amount: null,
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
              // Записываем импульсивное решение
              add({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                actionType: 'buy',
                instrument,
                amount: null,
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

  /* ─── Шаг 4: три сценария ─────────────── */
  if (step === 'scenarios' && instrument) {
    const scenarios = calculateTruthScenarios(instrument, market);
    const inst = INSTRUMENTS.find((i) => i.id === instrument);

    return (
      <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
        <button
          onClick={() => setStep('choose-instrument')}
          style={{ background: 'none', border: 'none', color: 'var(--subtext)', cursor: 'pointer', marginBottom: 16 }}
        >
          ← Назад
        </button>

        <h2 style={{ color: 'var(--heading)' }}>
          {inst?.icon} {inst?.title}: три сценария
        </h2>

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
              color: 'var(--text)',
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
                {s.totalReturn > 0 ? '+' : ''}
                {s.totalReturn}%
              </span>
            </div>
            <p style={{ color: 'var(--subtext)', marginTop: '0.5rem' }}>{s.outcome}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--subtext-muted)' }}>Вероятность: {s.probability}%</p>
          </div>
        ))}

        {scenarios.some((s) => s.isWorseThanDeposit) && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(239,68,68,0.08)',
              border: '2px solid var(--danger)',
              borderRadius: 12,
              color: 'var(--danger)',
            }}
          >
            ⚠️ В пессимистичном сценарии твоя доходность ниже, чем депозит (
            {market.depositRate}%). Ты готов ждать год и получить меньше, чем в банке?
          </div>
        )}
      </div>
    );
  }

  return null;
}