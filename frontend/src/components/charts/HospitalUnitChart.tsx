import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface HospitalUnitChartProps {
  data: { unit: string; revenue: number }[];
}

const COLORS = ['#00adb5', '#4ecca3', '#f39c12', '#e94560'];

const HospitalUnitChart: React.FC<HospitalUnitChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="revenue"
          nameKey="unit"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={(entry) => `${entry.unit}: ${formatCurrency(entry.revenue)}`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a2e',
            border: '1px solid #00adb5',
            borderRadius: '8px',
          }}
          formatter={(value: number) => formatCurrency(value)}
        />
        <Legend wrapperStyle={{ color: '#ffffff' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default HospitalUnitChart;