// src/screens/GoalScreen.tsx

import { useMemo, useState } from 'react';
import {
  calculateAllStrategies,
  formatMoney,
  formatDuration,
  type StrategyResult,
} from '../core/goalCalculator';

const STORAGE_KEY = 'golden-investor-goal';

interface GoalSettings {
  goal: number;
  years: number;
  monthlyPayment: number;
  initialAmount: number;
}

function loadGoal(): GoalSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('loadGoal: ошибка чтения');
  }
  return {
    goal: 5_000_000,
    years: 10,
    monthlyPayment: 15_000,
    initialAmount: 0,
  };
}

function saveGoal(settings: GoalSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function GoalScreen() {
  const [settings, setSettings] = useState<GoalSettings>(() => loadGoal());

  // Автосохранение
  useMemo(() => saveGoal(settings), [settings]);

  const results = useMemo(
    () =>
      calculateAllStrategies(
        settings.goal,
        settings.years,
        settings.monthlyPayment,
        settings.initialAmount
      ),
    [settings]
  );

  const update = (patch: Partial<GoalSettings>) => {
    setSettings({ ...settings, ...patch });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto', color: 'var(--text)' }}>
      <h2 style={{ marginBottom: 8, color: 'var(--heading)', fontSize: 22 }}>
        🎯 Калькулятор цели
      </h2>
      <p style={{ color: 'var(--subtext)', marginBottom: 24 }}>
        Введи цель — узнаешь, сколько нужно откладывать в месяц.
      </p>

      {/* Форма ввода */}
      <div
        style={{
          padding: '1.25rem',
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: '2rem',
        }}
      >
        <GoalField
          label="Цель, ₽"
          value={settings.goal}
          onChange={(v) => update({ goal: v })}
          step={100000}
        />
        <GoalField
          label="Срок, лет"
          value={settings.years}
          onChange={(v) => update({ years: Math.min(40, Math.max(1, v)) })}
          step={1}
        />
        <GoalField
          label="Начальная сумма, ₽"
          value={settings.initialAmount}
          onChange={(v) => update({ initialAmount: v })}
          step={50000}
        />
        <GoalField
          label="Ежемесячно, ₽"
          value={settings.monthlyPayment}
          onChange={(v) => update({ monthlyPayment: v })}
          step={1000}
        />
      </div>

      {/* Заголовок результата */}
      <h3 style={{ color: 'var(--heading)', fontSize: 16, marginBottom: 12 }}>
        Три стратегии
      </h3>

      {/* Результаты по стратегиям */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {results.map((result) => (
          <StrategyCard key={result.strategy.id} result={result} goal={settings.goal} />
        ))}
      </div>

      {/* Вывод */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1.25rem',
          background: 'var(--card-bg-soft)',
          border: '1px solid var(--border)',
          borderRadius: 12,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)', marginBottom: 8 }}>
          💡 Вывод
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.7 }}>
          {buildConclusion(results, settings)}
        </div>
      </div>
    </div>
  );
}

/* ─── Карточка стратегии ──────────────── */
function StrategyCard({ result, goal }: { result: StrategyResult; goal: number }) {
  const { strategy, monthlyPayment, finalAmount, willReach, monthsToGoal, totalInterest } = result;

  const riskColors = {
    high: 'var(--danger)',
    medium: 'var(--warning)',
    low: 'var(--success)',
  };
  const color = riskColors[strategy.risk];

  return (
    <div
      style={{
        padding: '1.25rem',
        background: 'var(--card-bg)',
        border: `2px solid ${color}`,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--heading)' }}>
            {strategy.icon} {strategy.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2 }}>
            {strategy.annualReturn}% годовых · риск: {strategy.risk === 'high' ? 'высокий' : strategy.risk === 'medium' ? 'средний' : 'низкий'}
          </div>
        </div>
        <div
          style={{
            padding: '0.3rem 0.7rem',
            borderRadius: 8,
            background: willReach ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: willReach ? 'var(--success)' : 'var(--danger)',
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {willReach ? '✅ Успеешь' : '❌ Не успеешь'}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Stat
          label="Нужно откладывать"
          value={`${formatMoney(monthlyPayment)} ₽/мес`}
          color={color}
        />
        <Stat
          label="Ты откладываешь"
          value={`${formatMoney(15000)} ₽/мес`}
          color="var(--text-soft)"
          muted
        />
        <Stat
          label="Накопишь к сроку"
          value={`${formatMoney(finalAmount)} ₽`}
          color={willReach ? 'var(--success)' : 'var(--danger)'}
        />
        <Stat
          label="Проценты"
          value={`${formatMoney(totalInterest)} ₽`}
          color="var(--primary)"
        />
      </div>

      {/* Прогресс-бар */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--subtext)',
            marginBottom: 4,
          }}
        >
          <span>Прогресс к цели</span>
          <span>{Math.min(100, Math.round((finalAmount / goal) * 100))}%</span>
        </div>
        <div
          style={{
            height: 8,
            background: 'var(--card-bg-soft)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, (finalAmount / goal) * 100)}%`,
              background: willReach ? 'var(--success)' : 'var(--danger)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {!willReach && monthlyPayment > 0 && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: 'var(--subtext)',
            fontStyle: 'italic',
          }}
        >
          ⏱ До цели: {formatDuration(monthsToGoal)} (при текущем платеже)
        </div>
      )}
    </div>
  );
}

/* ─── Мини-метрика ────────────────────── */
function Stat({
  label,
  value,
  color,
  muted,
}: {
  label: string;
  value: string;
  color: string;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        padding: '0.5rem 0.75rem',
        background: 'var(--card-bg-soft)',
        borderRadius: 8,
        opacity: muted ? 0.6 : 1,
      }}
    >
      <div style={{ fontSize: 10, color: 'var(--subtext)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

/* ─── Поле ввода ──────────────────────── */
function GoalField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
}) {
  return (
    <div>
      <label style={{ fontSize: 12, color: 'var(--subtext)', display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      <input
        type="number"
        min="0"
        step={step}
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

/* ─── Логика вывода ───────────────────── */
function buildConclusion(results: StrategyResult[], settings: GoalSettings): string {
  const reachable = results.filter((r) => r.willReach);

  if (reachable.length === 0) {
    return `При платеже ${formatMoney(settings.monthlyPayment)} ₽/мес ты не достигнешь цели ни по одной стратегии. ` +
      `Минимум нужно откладывать ${formatMoney(results[results.length - 1].monthlyPayment)} ₽/мес — но это только при 100% вкладе с минимальным риском. ` +
      `Если готов рискнуть — ОФЗ требуют всего ${formatMoney(results[0].monthlyPayment)} ₽/мес.`;
  }

  if (reachable.length === results.length) {
    return `При платеже ${formatMoney(settings.monthlyPayment)} ₽/мес ты достигнешь цели по всем стратегиям. ` +
      `Можешь выбрать самую надёжную — 100% вклад — или рискнуть ради большей доходности.`;
  }

  const best = reachable[0];
  return `При платеже ${formatMoney(settings.monthlyPayment)} ₽/мес ты успеешь только по стратегии «${best.strategy.title}». ` +
    `Это значит: если хочешь накопить ${formatMoney(settings.goal)} ₽ за ${settings.years} лет — ` +
    `нужно вкладывать деньги в ${best.strategy.title.toLowerCase()}, а не держать всё в депозите.`;
}