// components/charts/SectionRevenueChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SectionRevenueData {
  section: string;
  revenue: number;
}

interface SectionRevenueChartProps {
  data: SectionRevenueData[];
}

const SectionRevenueChart: React.FC<SectionRevenueChartProps> = ({ data }) => {
  const COLORS = ['#21336a', '#4CAF50', '#795548', '#9C27B0', '#FA270B', '#00BCD4', '#607D8B', '#deab5f', '#E91E63', '#FFC107'];

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  const chartData = data.map(item => ({
    name: item.section,
    value: item.revenue,
    percentage: totalRevenue > 0 ? (item.revenue / totalRevenue * 100).toFixed(1) : '0'
  }));

  return (
    <div className="chart-container">
      <h2 className="chart-title">Revenue by Laboratory Section</h2>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: ${entry.percentage}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`UGX ${Number(value).toLocaleString()}`, 'Revenue']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SectionRevenueChart;