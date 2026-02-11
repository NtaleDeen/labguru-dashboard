
// frontend/src/components/charts/TestRevenueChart.tsx
import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface TestRevenueChartProps {
  data: Array<{ test_name: string; revenue: number }>;
}

export const TestRevenueChart: React.FC<TestRevenueChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Get top 10 tests
    const topTests = data.slice(0, 10);

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: topTests.map(d => d.test_name),
        datasets: [
          {
            data: topTests.map(d => d.revenue),
            backgroundColor: [
              '#7c3aed', '#ec4899', '#f59e0b', '#10b981', 
              '#06b6d4', '#f43f5e', '#8b5cf6', '#14b8a6',
              '#0d9488', '#6366f1'
            ],
            borderColor: '#fff',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#666',
              padding: 15,
              font: {
                size: 12
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data]);

  return <canvas ref={canvasRef}></canvas>;
};