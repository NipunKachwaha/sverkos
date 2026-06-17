import { DownloadIcon } from '@radix-ui/react-icons';
import { workbenchStore } from '../../lib/stores/workbench.client';
import { Button } from '../ui/Button';

export function DownloadButton() {
  const handleDownload = async () => {
    workbenchStore.downloadZip({
      convexProject: null,
    });
  };

  return (
    <Button onClick={handleDownload} variant="neutral" size="xs">
      <DownloadIcon />
      <span>Download Code</span>
    </Button>
  );
}
