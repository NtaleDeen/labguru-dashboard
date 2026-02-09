// frontend/src/components/charts/TATProgressChart.tsx
import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface TATProgressChartProps {
  currentValue: number;
  totalValue: number;
  title: string;
  color?: string;
  height?: number;
}

const TATProgressChart: React.FC<TATProgressChartProps> = ({
  currentValue,
  totalValue,
  title,
  color = '#f44336',
  height = 40
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const percentage = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [''],
        datasets: [
          {
            label: title,
            data: [currentValue],
            backgroundColor: color,
            borderWidth: 0,
            stack: 'overall-samples',
          },
          {
            label: 'Remaining',
            data: [totalValue - currentValue],
            backgroundColor: '#e0e0e0',
            borderWidth: 0,
            stack: 'overall-samples',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        layout: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
        plugins: { legend: { display: false } },
        scales: {
          x: {
            beginAtZero: true,
            display: false,
            stack: 'overall-samples',
            max: totalValue > 0 ? totalValue : 1,
            grid: { display: false },
          },
          y: { display: false, grid: { display: false } },
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [currentValue, totalValue, title, color]);

  return (
    <div className="tat-progress-section">
      <div className="label">{title}</div>
      <div className="percentage">{percentage.toFixed(1)}%</div>
      <div className="amounts">
        <span>{currentValue}</span>
        <span className="target">of {totalValue} requests</span>
      </div>
      <div style={{ height: `${height}px`, marginTop: '5px' }}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default TATProgressChart;