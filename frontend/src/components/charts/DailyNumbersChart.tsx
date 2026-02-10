import React, { useEffect, useRef } from 'react';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

interface DailyNumbersChartProps {
  data: Record<string, number>;
}

const DailyNumbersChart: React.FC<DailyNumbersChartProps> = ({ data = {} }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || Object.keys(data).length === 0) return;

    const sortedDates = Object.keys(data).sort();
    const chartData = sortedDates.map((date) => data[date]);

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: sortedDates,
        datasets: [
          {
            label: 'Daily Request Volume',
            data: chartData,
            backgroundColor: '#21336a',
            borderColor: '#21336a',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y} requests`,
            },
          },
          datalabels: { display: false },
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              tooltipFormat: 'MMM D, YYYY',
              displayFormats: { day: 'MMM D' },
            },
            grid: { display: false },
            title: { display: true, text: 'Date' },
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Number of Requests' },
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

export default DailyNumbersChart;