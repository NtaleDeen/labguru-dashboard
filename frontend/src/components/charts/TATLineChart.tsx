import React, { useEffect, useRef } from 'react';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

interface DailyTATData {
  delayed: number;
  onTime: number;
  notUploaded: number;
}

interface TATLineChartProps {
  dailyData: Record<string, DailyTATData>;
}

const TATLineChart: React.FC<TATLineChartProps> = ({ dailyData = {} }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || Object.keys(dailyData).length === 0) return;

    const labels = Object.keys(dailyData).sort();
    const delayedData = labels.map((d) => dailyData[d]?.delayed || 0);
    const onTimeData = labels.map((d) => dailyData[d]?.onTime || 0);
    const notUploadedData = labels.map((d) => dailyData[d]?.notUploaded || 0);

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
            label: 'Delayed',
            data: delayedData,
            borderColor: '#f44336',
            backgroundColor: '#f44336',
            fill: false,
            tension: 0,
            borderWidth: 2,
            pointRadius: 0,
            pointHitRadius: 0,
          },
          {
            label: 'On Time',
            data: onTimeData,
            borderColor: '#4caf50',
            backgroundColor: '#4caf50',
            fill: false,
            tension: 0,
            borderWidth: 2,
            pointRadius: 0,
            pointHitRadius: 0,
          },
          {
            label: 'Not Uploaded',
            data: notUploadedData,
            borderColor: '#9E9E9E',
            backgroundColor: '#9E9E9E',
            fill: false,
            tension: 0,
            borderWidth: 2,
            pointRadius: 0,
            pointHitRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 10 },
        plugins: {
          legend: { position: 'bottom' },
          datalabels: { display: false },
        },
        scales: {
          x: {
            title: { display: true, text: 'Date' },
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
  }, [dailyData]);

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <canvas ref={chartRef} />
    </div>
  );
};

export default TATLineChart;