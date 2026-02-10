import React, { useEffect, useRef } from 'react';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

interface TestVolumeChartProps {
  data: Record<string, number>;
}

const TestVolumeChart: React.FC<TestVolumeChartProps> = ({ data = {} }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || Object.keys(data).length === 0) return;

    const sorted = Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    const labels = sorted.map(([test]) => test);
    const chartData = sorted.map(([, count]) => count);

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Test Count',
            data: chartData,
            backgroundColor: '#21336a',
            datalabels: {
              anchor: 'start',
              align: 'end',
              color: '#4CAF50',
              font: {
                weight: 'bold',
                size: 10,
              },
              formatter: (value) => value.toLocaleString(),
            },
          },
        ],
      },
      options: {
        responsive: true,
        indexAxis: 'y' as const,
        maintainAspectRatio: true,
        scales: {
          x: {
            position: 'top',
            beginAtZero: true,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.x.toLocaleString()} tests`,
            },
          },
          datalabels: {
            display: true,
          },
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
    <div style={{ width: '100%', height: '500px' }}>
      <canvas ref={chartRef} />
    </div>
  );
};

export default TestVolumeChart;