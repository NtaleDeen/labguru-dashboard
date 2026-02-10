import React, { useEffect, useRef } from 'react';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

interface TATPieChartProps {
  data: Record<string, number>;
}

const TATPieChart: React.FC<TATPieChartProps> = ({ data = {} }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || Object.keys(data).length === 0) return;

    const labels = Object.keys(data);
    const dataValues = Object.values(data);
    const total = dataValues.reduce((sum, val) => sum + val, 0);

    const backgroundColors = labels.map((label) => {
      switch (label) {
        case 'On Time':
          return '#4CAF50';
        case 'Delayed <15min':
          return '#FFC107';
        case 'Over Delayed':
          return '#F44336';
        case 'Not Uploaded':
          return '#9E9E9E';
        default:
          return '#CCCCCC';
      }
    });

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: dataValues,
            backgroundColor: backgroundColors,
            borderColor: '#fff',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { boxWidth: 20, padding: 10, font: { size: 12 } },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.label || '';
                if (label) label += ': ';
                if (context.parsed !== null) {
                  label += new Intl.NumberFormat('en-US').format(context.parsed);
                }
                const percentage = ((context.parsed / total) * 100).toFixed(2);
                return label + ` (${percentage}%)`;
              },
            },
          },
          datalabels: {
            formatter: (value: number) => ((value / total) * 100).toFixed(1) + '%',
            color: '#fff',
            font: { weight: 'bold', size: 12 },
          },
        },
        cutout: '60%',
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

export default TATPieChart;