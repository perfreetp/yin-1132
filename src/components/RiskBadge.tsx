import type { RiskLevel } from '../types';
import { getRiskLabel, getRiskColor } from '../utils/psqi';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md';
}

export const RiskBadge = ({ level, size = 'md' }: RiskBadgeProps) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-full border font-medium';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  const colorClasses = getRiskColor(level);

  return (
    <span className={`${baseClasses} ${sizeClasses} ${colorClasses}`}>
      {getRiskLabel(level)}
    </span>
  );
};
