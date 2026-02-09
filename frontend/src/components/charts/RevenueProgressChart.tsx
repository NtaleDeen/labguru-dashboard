// frontend/src/components/charts/RevenueProgressChart.tsx
import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface RevenueProgressChartProps {
  currentValue: number;
  targetValue: number;
  title?: string;
  prefix?: string;
  suffix?: string;
  height?: number;
}

const RevenueProgressChart: React.FC<RevenueProgressChartProps> = ({
  currentValue,
  targetValue,
  title = 'Total Revenue',
  prefix = 'UGX ',
  suffix = '',
  height = 20
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const percentage = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [''],
        datasets: [{
          label: 'Progress',
          data: [percentage],
          backgroundColor: 'var(--hover-color)',
          borderRadius: 5,
          barPercentage: 1.0,
          categoryPercentage: 1.0,
          borderColor: '#6b7280',
          borderWidth: 1,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: {
            display: false,
            max: 100,
          },
          y: { display: false }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [percentage]);

  return (
    <div className="revenue-progress-card">
      <div className="label">{title}</div>
      <div className="percentage">{percentage.toFixed(2)}%</div>
      <div className="amounts">
        <span>{prefix}{currentValue.toLocaleString()}{suffix}</span>
        <span className="target">of {prefix}{targetValue.toLocaleString()}{suffix}</span>
      </div>
      <div style={{ height: `${height}px`, marginTop: '10px' }}>
        <canvas ref={chartRef} className="chart-bar"></canvas>
      </div>
    </div>
  );
};

export default RevenueProgressChart;