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
import { formatCurrency, shortenTestName } from '../../utils/formatters';

interface TestRevenueChartProps {
  data: { test_name: string; revenue: number }[];
}

const TestRevenueChart: React.FC<TestRevenueChartProps> = ({ data }) => {
  // Take top 50 and format names
  const chartData = data.slice(0, 50).map(item => ({
    ...item,
    display_name: shortenTestName(item.test_name, 25),
  }));

  return (
    <ResponsiveContainer width="100%" height={800}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis
          type="number"
          stroke="#00adb5"
          tick={{ fill: '#ffffff' }}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <YAxis
          type="category"
          dataKey="display_name"
          stroke="#00adb5"
          tick={{ fill: '#ffffff', fontSize: 12 }}
          width={150}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a2e',
            border: '1px solid #00adb5',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#ffffff' }}
          formatter={(value: number, name: string, props: any) => [
            formatCurrency(value),
            props.payload.test_name,
          ]}
        />
        <Legend wrapperStyle={{ color: '#ffffff' }} />
        <Bar
          dataKey="revenue"
          fill="#4ecca3"
          name="Test Revenue"
          radius={[0, 8, 8, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TestRevenueChart;