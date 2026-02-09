import React, { useEffect, useRef } from 'react';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import 'chartjs-adapter-moment';

interface DailyRevenueChartProps {
  data: Array<{ date: string; revenue: number }>;
}

const DailyRevenueChart: React.FC<DailyRevenueChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const chartConfig: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [{
          label: 'Daily Revenue',
          data: data.map(d => d.revenue),
          borderColor: '#21336a',
          backgroundColor: 'rgba(33, 51, 106, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#21336a',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `UGX ${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              tooltipFormat: 'MMM D, YYYY',
              displayFormats: {
                day: 'MMM D'
              }
            },
            grid: {
              display: false
            },
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `UGX ${(value as number).toLocaleString()}`
            },
            title: {
              display: true,
              text: 'Revenue'
            }
          }
        }
      }
    };

    chartInstance.current = new Chart(ctx, chartConfig);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="revenue">
      <div className="chart-title">Daily Revenue</div>
      <div className="chart-container">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default DailyRevenueChart;