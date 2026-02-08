// components/charts/DailyRevenueChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DailyRevenueData {
  date: string;
  revenue: number;
}

interface DailyRevenueChartProps {
  data: DailyRevenueData[];
}

const DailyRevenueChart: React.FC<DailyRevenueChartProps> = ({ data }) => {
  // Format data for Recharts
  const chartData = data.map(item => ({
    date: item.date,
    Revenue: item.revenue
  }));

  return (
    <div className="chart-container">
      <h2 className="chart-title">Daily Revenue</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis 
            tickFormatter={(value) => `UGX ${value.toLocaleString()}`}
          />
          <Tooltip 
            formatter={(value) => [`UGX ${Number(value).toLocaleString()}`, 'Revenue']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Bar 
            dataKey="Revenue" 
            fill="#21336a" 
            name="Revenue (UGX)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DailyRevenueChart;