import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TATPieChartProps {
  data: { status: string; count: number }[];
}

const TATPieChart: React.FC<TATPieChartProps> = ({ data }) => {
  // Status colors from old design
  const STATUS_COLORS: { [key: string]: string } = {
    'On Time': '#4caf50',
    'Delayed <15min': '#ff9800',
    'Over Delayed': '#f44336',
    'Not Uploaded': '#9e9e9e'
  };

  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percentage = totalCount > 0 ? (payload[0].value / totalCount * 100).toFixed(1) : '0';
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-bold text-main-color">{payload[0].name}</p>
          <p className="text-gray-600">Count: {payload[0].value.toLocaleString()}</p>
          <p className="text-gray-600">Percentage: {percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      <h2 className="chart-title">TAT Performance Distribution</h2>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={STATUS_COLORS[entry.status] || '#cccccc'} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              layout="vertical" 
              align="right" 
              verticalAlign="middle"
              wrapperStyle={{ color: '#21336a', fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TATPieChart;