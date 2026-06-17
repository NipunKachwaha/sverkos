import { useStore } from '@nanostores/react';
import { memo, useRef } from 'react';
import { dashboardPathStore } from '../../lib/stores/dashboardPath';
import { ExternalLinkIcon } from '@radix-ui/react-icons';
import { Button } from '../ui/Button';

export const Dashboard = memo(function Dashboard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const currentDashboardPath = useStore(dashboardPathStore);

  // Default Convex URL fallback (kyunki ab deploymentName nahi hai)
  const shownUrl = `https://dashboard.convex.dev/${currentDashboardPath}`;

  return (
    <div className="flex size-full flex-col">
      {/* Top Address Bar */}
      <div className="flex items-center gap-1.5 bg-bolt-elements-background-depth-2 p-2">
        <div
          className="flex grow items-center gap-1 rounded-full border bg-bolt-elements-preview-addressBar-background px-3 py-1 text-sm text-bolt-elements-preview-addressBar-text focus-within:border-border-selected focus-within:bg-bolt-elements-preview-addressBar-backgroundActive focus-within:text-bolt-elements-preview-addressBar-textActive
          hover:bg-bolt-elements-preview-addressBar-backgroundHover hover:focus-within:bg-bolt-elements-preview-addressBar-backgroundActive"
        >
          <input 
            ref={inputRef} 
            className="w-full bg-transparent outline-none" 
            type="text" 
            value={shownUrl} 
            disabled 
          />
        </div>
        <Button
          variant="neutral"
          inline
          icon={<ExternalLinkIcon />}
          onClick={() => {
            window.open(shownUrl, '_blank');
          }}
          aria-label={`Open dashboard in new tab`}
        />
      </div>

      {/* Main Content Area (Fallback UI) */}
      <div className="flex-1 border-t flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center p-6 max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Dashboard Disconnected
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Convex integration has been removed from this project, so the embedded dashboard is no longer available. 
            You can still click the external link icon above to visit the main site.
          </p>
        </div>
      </div>
    </div>
  );
});