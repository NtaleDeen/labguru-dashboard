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

interface TATHourlyChartProps {
  data: { 
    hour: number; 
    delayed: number; 
    onTime: number; 
    notUploaded: number 
  }[];
}

const TATHourlyChart: React.FC<TATHourlyChartProps> = ({ data }) => {
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
          {payload.map((pld: any, index: number) => (
            <p key={index} className="text-gray-600" style={{ color: pld.color }}>
              {pld.name}: {pld.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      <h2 className="chart-title">Hourly TAT Performance Trend</h2>
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
              dataKey="delayed"
              name="Delayed"
              stroke="#f44336"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="onTime"
              name="On Time"
              stroke="#4caf50"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="notUploaded"
              name="Not Uploaded"
              stroke="#9e9e9e"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TATHourlyChart;