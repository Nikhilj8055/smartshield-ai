import React from 'react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = '', size = 'md' }) => {
  const getStyle = () => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INSUFFICIENT EVIDENCE':
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-3.5 py-1.5 text-sm font-semibold tracking-wide';
      case 'md':
      default:
        return 'px-2.5 py-1 text-xs font-medium';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${getStyle()} ${getSize()} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {level}
    </span>
  );
};
