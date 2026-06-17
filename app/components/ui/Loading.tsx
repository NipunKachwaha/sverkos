import { Spinner } from './Spinner';
import { classNames } from '../../utils/classNames';

interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function Loading({ text = 'Loading...', fullScreen = false, className }: LoadingProps) {
  return (
    <div
      className={classNames(
        'flex flex-col items-center justify-center gap-3 text-content-secondary',
        {
          'fixed inset-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm': fullScreen,
          'p-8 w-full h-full': !fullScreen,
        },
        className
      )}
    >
      <Spinner className="w-8 h-8 text-blue-600" />
      {text && <span className="text-sm font-medium animate-pulse">{text}</span>}
    </div>
  );
}