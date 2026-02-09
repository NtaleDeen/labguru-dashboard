// frontend/src/components/charts/NumbersProgressChart.tsx
import React from 'react';

interface NumbersProgressChartProps {
  currentValue: number;
  targetValue: number;
  title: string;
  prefix?: string;
  suffix?: string;
}

const NumbersProgressChart: React.FC<NumbersProgressChartProps> = ({
  currentValue,
  targetValue,
  title,
  prefix = '',
  suffix = ''
}) => {
  const percentage = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;

  return (
    <div className="numbers-progress-card">
      <div className="label">{title}</div>
      <div className="percentage">{percentage.toFixed(2)}%</div>
      <div className="amounts">
        <span>{prefix}{currentValue.toLocaleString()}{suffix}</span>
        <span className="target">of {prefix}{targetValue.toLocaleString()}{suffix}</span>
      </div>
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default NumbersProgressChart;