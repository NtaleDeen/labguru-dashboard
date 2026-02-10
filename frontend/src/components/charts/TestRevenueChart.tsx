import React, { useEffect, useRef } from 'react';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

interface TestRevenueChartProps {
  data: Record<string, number>;
}

const TestRevenueChart: React.FC<TestRevenueChartProps> = ({ data = {} }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || Object.keys(data).length === 0) return;

    // Sort and limit to top 15
    const sorted = Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    const labels = sorted.map(([test]) => test);
    const chartData = sorted.map(([, value]) => value);
    const total = chartData.reduce((a, b) => a + b, 0);
    const percentageLabels = chartData.map((val) =>
      total > 0 ? `${((val / total) * 100).toFixed(0)}%` : '0%'
    );

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
            label: 'Revenue by Test (UGX)',
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
              formatter: (value, context) => percentageLabels[context.dataIndex],
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
            ticks: {
              callback: (value) => `UGX ${Number(value).toLocaleString()}`,
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `UGX ${context.parsed.x.toLocaleString()}`,
            },
          },
          datalabels: { display: true },
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

export default TestRevenueChart;