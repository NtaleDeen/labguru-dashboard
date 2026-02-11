
// frontend/src/components/charts/SectionRevenueChart.tsx
import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface SectionRevenueChartProps {
  data: Array<{ section: string; revenue: number }>;
}

export const SectionRevenueChart: React.FC<SectionRevenueChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const colors = [
      '#7c3aed', '#ec4899', '#f59e0b', '#10b981', 
      '#06b6d4', '#f43f5e', '#8b5cf6', '#14b8a6'
    ];

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.section),
        datasets: [
          {
            label: 'Revenue by Section',
            data: data.map(d => d.revenue),
            backgroundColor: colors.slice(0, data.length),
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#666',
              padding: 15
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `UGX ${(value as number / 1000000).toFixed(0)}M`,
              color: '#999'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            ticks: {
              color: '#999'
            },
            grid: {
              display: false
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