// src/components/MonteCarloChart.tsx

import { useEffect, useRef } from 'react';
import type { MonteCarloResult } from '../core/monteCarlo';
import { formatMoney } from '../core/monteCarlo';

interface Props {
  result: MonteCarloResult;
  initialAmount: number;
  horizonYears: number;
}

/**
 * Гистограмма распределения финальных сумм.
 * Рисуется на <canvas>, без внешних библиотек.
 */
export function MonteCarloChart({ result, initialAmount, horizonYears }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Размер canvas с учётом DPR (чтобы не было размытия)
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    ctx.scale(dpr, dpr);

    const W = cssWidth;
    const H = cssHeight;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };

    ctx.clearRect(0, 0, W, H);

    // Данные
    const amounts = result.finalAmounts;
    const min = amounts[0];
    const max = amounts[amounts.length - 1];
    const range = max - min || 1;

    // Разбиваем на 25 корзин
    const NUM_BINS = 25;
    const bins = new Array(NUM_BINS).fill(0);
    for (const a of amounts) {
      let idx = Math.floor(((a - min) / range) * NUM_BINS);
      if (idx >= NUM_BINS) idx = NUM_BINS - 1;
      bins[idx]++;
    }

    const maxBin = Math.max(...bins);

    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;
    const barWidth = chartW / NUM_BINS;

    // Ось Y — линии
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();
    }

    // Цвета
    const getColor = (amount: number): string => {
      if (amount < initialAmount) return '#ef4444'; // убыток
      if (amount < initialAmount * 1.5) return '#eab308'; // малый рост
      return '#22c55e'; // хороший рост
    };

    // Столбцы
    for (let i = 0; i < NUM_BINS; i++) {
      const binAmount = min + (i + 0.5) * (range / NUM_BINS);
      const count = bins[i];
      const barH = (count / maxBin) * chartH;
      const x = padding.left + i * barWidth;
      const y = padding.top + chartH - barH;

      ctx.fillStyle = getColor(binAmount);
      ctx.fillRect(x + 1, y, barWidth - 2, barH);
    }

    // Линия начальной суммы
    if (initialAmount >= min && initialAmount <= max) {
      const x = padding.left + ((initialAmount - min) / range) * chartW;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Подпись
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Вложено', x, padding.top - 4);
    }

    // Ось X — подписи (min, середина, max)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(formatMoney(min), padding.left, H - padding.bottom + 16);
    ctx.fillText(formatMoney((min + max) / 2), padding.left + chartW / 2, H - padding.bottom + 16);
    ctx.fillText(formatMoney(max), W - padding.right, H - padding.bottom + 16);

    // Заголовок оси Y
    ctx.save();
    ctx.translate(14, padding.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Частота (500 симуляций)', 0, 0);
    ctx.restore();
  }, [result, initialAmount, horizonYears]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: 240,
        display: 'block',
        background: 'var(--card-bg-soft)',
        borderRadius: 8,
      }}
    />
  );
}