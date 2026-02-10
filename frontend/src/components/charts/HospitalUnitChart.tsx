import React, { useEffect, useRef } from 'react';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

interface HospitalUnitChartProps {
  data: Record<string, number>;
}

const HospitalUnitChart: React.FC<HospitalUnitChartProps> = ({ data = {} }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || Object.keys(data).length === 0) return;

    // Sort data by value (descending)
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([unit]) => unit);
    const chartData = sorted.map(([, val]) => val);

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Revenue by Hospital Unit (UGX)',
            data: chartData,
            fill: true,
            borderColor: '#21336a',
            backgroundColor: 'rgba(33, 51, 106, 0.2)',
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#21336a',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            ticks: {
              callback: (value) => `UGX ${Number(value).toLocaleString()}`,
            },
          },
        },
        plugins: {
          datalabels: { display: false },
        },
      },
      plugins: [ChartDataLabels],
    };

    chartInstance.current = new Chart(ctx, config);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <canvas ref={chartRef} />
    </div>
  );
};

export default HospitalUnitChart;