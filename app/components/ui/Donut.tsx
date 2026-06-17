import { classNames } from '../../utils/classNames';

interface DonutProps {
  percentage: number; // 0 se 100 tak
  size?: number; // Pixels mein (default 40)
  strokeWidth?: number;
  colorClass?: string; // Tailwind text color class
  trackColorClass?: string;
  showLabel?: boolean;
  className?: string;
}

export function Donut({
  percentage,
  size = 40,
  strokeWidth = 4,
  colorClass = 'text-blue-600',
  trackColorClass = 'text-gray-200 dark:text-gray-700',
  showLabel = false,
  className,
}: DonutProps) {
  const safePercentage = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (safePercentage / 100) * circumference;

  return (
    <div className={classNames('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background Track */}
        <circle
          className={trackColorClass}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Ring */}
        <circle
          className={classNames('transition-all duration-500 ease-in-out', colorClass)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-medium text-content-primary">
          {Math.round(safePercentage)}%
        </span>
      )}
    </div>
  );
}