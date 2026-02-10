import React, { useEffect, useRef } from 'react';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

interface HourlyNumbersChartProps {
  data: number[];
}

const HourlyNumbersChart: React.FC<HourlyNumbersChartProps> = ({ data = [] }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !Array.isArray(data) || data.length !== 24) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [
          {
            label: 'Hourly Request Volume',
            data: data,
            borderColor: '#21336a',
            backgroundColor: 'rgba(33, 51, 106, 0.2)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#21336a',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y} requests`,
            },
          },
          datalabels: { display: false },
        },
        scales: {
          x: {
            title: { display: true, text: 'Hour of Day' },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Number of Requests' },
            grid: { color: '#e0e0e0' },
          },
        },
      },
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

export default HourlyNumbersChart;