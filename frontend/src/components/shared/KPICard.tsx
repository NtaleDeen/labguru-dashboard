// frontend/src/components/shared/KPICard.tsx
import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: string;
  prefix?: string;
  suffix?: string;
  fullWidth?: boolean;
  className?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  trend,
  icon,
  prefix = '',
  suffix = '',
  fullWidth = false,
  className = ''
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <i className="fas fa-arrow-up progress-complete-actual mr-1"></i>;
      case 'down':
        return <i className="fas fa-arrow-down progress-overdue mr-1"></i>;
      default:
        return <i className="fas fa-minus" style={{color: '#666'}}></i>;
    }
  };

  const getTrendClass = () => {
    if (!trend) return '';
    
    switch (trend.direction) {
      case 'up':
        return 'progress-complete-actual';
      case 'down':
        return 'progress-overdue';
      default:
        return '';
    }
  };

  return (
    <div className={`kpi-card ${fullWidth ? 'kpi-card-full-width' : ''} ${className}`}>
      <div className="kpi-label">
        {icon && <i className={`${icon} mr-2`}></i>}
        {title}
      </div>
      <div className="kpi-value">
        {prefix}
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix}
      </div>
      {trend && (
        <div className={`kpi-trend ${getTrendClass()}`}>
          {getTrendIcon()}
          {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
        </div>
      )}
    </div>
  );
};

export default KPICard;