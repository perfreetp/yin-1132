import { getScoreColor } from '../utils/psqi';

interface ScoreDisplayProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

export const ScoreDisplay = ({ score, maxScore = 21, size = 'md', showLabel = true }: ScoreDisplayProps) => {
  const sizeClasses = {
    sm: 'text-lg font-semibold',
    md: 'text-2xl font-bold',
    lg: 'text-3xl font-bold',
    xl: 'text-5xl font-bold'
  };

  const colorClass = getScoreColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className={`font-mono ${sizeClasses[size]} ${colorClass}`}>
        {score}
        {showLabel && <span className="text-gray-400 text-sm font-normal">/{maxScore}</span>}
      </div>
      {showLabel && (
        <div className="text-xs text-gray-500 mt-1">PSQI总分</div>
      )}
    </div>
  );
};
