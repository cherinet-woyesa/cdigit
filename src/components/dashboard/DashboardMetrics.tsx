import React from 'react';

export interface Metric {
  label: string;
  value: number | string;
  color: 'fuchsia' | 'green' | 'blue' | 'orange' | 'purple';
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

interface DashboardMetricsProps {
  metrics: Metric[];
  className?: string;
}

const colorClasses = {
  fuchsia: 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600',
  green: 'bg-gradient-to-br from-green-500 to-green-600',
  blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
  orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
  purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
};

const trendIcons = {
  up: '↗',
  down: '↘',
  neutral: '→'
};

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ metrics, className = '' }) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 ${className}`}>
      {metrics.map((metric, index) => (
        <div
          key={index}
          className={`${colorClasses[metric.color]} text-white p-4 rounded-xl shadow-lg transition-transform hover:scale-105`}
        >
          <div className="flex items-center justify-between mb-2">
            {metric.icon && <div className="text-white/80">{metric.icon}</div>}
            {metric.trend && (
              <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded-full">
                {trendIcons[metric.trend]}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold mb-1">{metric.value}</div>
          <div className="text-sm text-white/90 font-medium">{metric.label}</div>
        </div>
      ))}
    </div>
  );
};

export default DashboardMetrics;