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

interface TopTestsChartProps {
  data: { test_name: string; count: number }[];
  unit: string;
}

const TopTestsChart: React.FC<TopTestsChartProps> = ({ data, unit }) => {
  // Take top 15 tests
  const chartData = data.slice(0, 15).map(item => ({
    name: item.test_name.length > 30 
      ? item.test_name.substring(0, 30) + '...' 
      : item.test_name,
    count: item.count,
    fullName: item.test_name
  }));

  const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const percentage = totalCount > 0 ? (payload[0].value / totalCount * 100).toFixed(1) : '0';
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-bold text-main-color">{payload[0].payload.fullName}</p>
          <p className="text-gray-600">Count: {payload[0].value.toLocaleString()}</p>
          <p className="text-gray-600">Percentage: {percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      <h2 className="chart-title">Top Tests in {unit}</h2>
      <div style={{ width: '100%', height: 500 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 200, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              type="number" 
              stroke="#21336a"
              tick={{ fill: '#21336a' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={180}
              stroke="#21336a"
              tick={{ fill: '#21336a', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="count"
              name="Test Count"
              fill="#21336a"
              radius={[0, 4, 4, 0]}
              label={{
                position: 'right',
                formatter: (value: number) => {
                  const percentage = totalCount > 0 ? (value / totalCount * 100).toFixed(0) : '0';
                  return `${percentage}%`;
                },
                fill: '#4CAF50',
                fontSize: 11,
                fontWeight: 'bold'
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopTestsChart;