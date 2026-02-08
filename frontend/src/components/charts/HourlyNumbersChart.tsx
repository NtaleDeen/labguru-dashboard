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

interface HourlyNumbersChartProps {
  data: { hour: number; count: number }[];
}

const HourlyNumbersChart: React.FC<HourlyNumbersChartProps> = ({ data }) => {
  // Format hour labels
  const formattedData = data.map(item => ({
    ...item,
    hourLabel: `${item.hour}:00`
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-bold text-main-color">{label}</p>
          <p className="text-gray-600">Requests: {payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      <h2 className="chart-title">Hourly Request Volume</h2>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart
            data={formattedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="hourLabel" 
              stroke="#21336a"
              tick={{ fill: '#21336a' }}
            />
            <YAxis 
              stroke="#21336a"
              tick={{ fill: '#21336a' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              name="Requests"
              stroke="#21336a"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HourlyNumbersChart;