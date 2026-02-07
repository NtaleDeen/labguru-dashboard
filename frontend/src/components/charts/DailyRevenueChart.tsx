import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface DailyRevenueChartProps {
  data: { date: string; revenue: number }[];
}

const DailyRevenueChart: React.FC<DailyRevenueChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey="date"
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
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#00d4ff"
          strokeWidth={2}
          dot={{ fill: '#00d4ff', r: 4 }}
          activeDot={{ r: 6 }}
          name="Daily Revenue"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default DailyRevenueChart;