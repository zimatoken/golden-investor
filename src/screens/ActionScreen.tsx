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
        <h2 style={{ marginBottom: 8 }}>Что ты хочешь сделать?</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>
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
                background: '#fff',
                border: '2px solid #e2e8f0',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 32 }}>{inst.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{inst.title}</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>{inst.subtitle}</div>
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
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 16 }}
        >
          ← Назад
        </button>

        <h2>Это действие было в твоём плане?</h2>
        <p style={{ color: '#64748b' }}>
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
            style={{ flex: 1, padding: '1rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}
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
            style={{ flex: 1, padding: '1rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}
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
      <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <h2>⏸ Пауза 24 часа</h2>
        <p>Вернись завтра. Если всё ещё захочешь — подтвердишь.</p>
        <p style={{ color: '#64748b', marginTop: '1rem' }}>
          Разблокировка: {pausedUntil.toLocaleString('ru-RU')}
        </p>
        <button
          onClick={() => setStep('choose-instrument')}
          style={{ marginTop: 24, padding: '0.75rem 1.5rem', background: '#0c1426', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer' }}
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
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 16 }}
        >
          ← Назад
        </button>

        <h2>
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
                s.label === 'optimistic' ? '#22c55e' : s.label === 'base' ? '#eab308' : '#ef4444',
              background: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{s.title}</strong>
              <span
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: s.totalReturn >= 0 ? '#22c55e' : '#ef4444',
                }}
              >
                {s.totalReturn > 0 ? '+' : ''}
                {s.totalReturn}%
              </span>
            </div>
            <p style={{ color: '#64748b', marginTop: '0.5rem' }}>{s.outcome}</p>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Вероятность: {s.probability}%</p>
          </div>
        ))}

        {scenarios.some((s) => s.isWorseThanDeposit) && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#fef2f2',
              border: '2px solid #ef4444',
              borderRadius: 12,
              color: '#991b1b',
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