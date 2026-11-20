import React from 'react';
import { RiskLevel } from '../types';

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
  confidence: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, level, confidence }) => {
  const getColor = () => {
    if (score >= 80) return '#AF52DE'; // Critical
    if (score >= 60) return '#FF3B30'; // High
    if (score >= 35) return '#FF9500'; // Medium
    return '#34C759'; // Low
  };

  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-surface rounded-apple border border-border shadow-subtle">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            className="stroke-gray-100"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke={getColor()}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold tracking-tight text-foreground">{score}</span>
          <span className="text-xs uppercase tracking-wider text-muted font-medium">/ 100</span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="text-sm font-semibold text-foreground tracking-tight">{level} RISK</div>
        <div className="text-xs text-muted mt-0.5">
          Confidence: <span className="font-medium text-foreground">{confidence}%</span> (Deterministic)
        </div>
      </div>
    </div>
  );
};
