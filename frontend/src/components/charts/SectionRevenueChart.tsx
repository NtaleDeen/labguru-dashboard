import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface SectionRevenueChartProps {
  data: { section: string; revenue: number }[];
}

const SectionRevenueChart: React.FC<SectionRevenueChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey="section"
          stroke="#00adb5"
          tick={{ fill: '#ffffff' }}
        />
        <YAxis
          stroke="#00adb5"
          tick={{ fill: '#ffffff' }}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a2e',
            border: '1px solid #00adb5',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#ffffff' }}
          formatter={(value: number) => [formatCurrency(value), 'Revenue']}
        />
        <Legend wrapperStyle={{ color: '#ffffff' }} />
        <Bar
          dataKey="revenue"
          fill="#00adb5"
          name="Section Revenue"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SectionRevenueChart;