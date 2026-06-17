'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { webcontainer } from '../../lib/webcontainer';
import type { WebContainer } from '@webcontainer/api';
import { getFileUpdateCounter, useFileUpdateCounter } from '../../lib/stores/fileUpdateCounter';
import { toast } from 'sonner';
import { streamOutput } from '../../utils/process';
import { SpinnerThreeDots as Spinner } from '../ui/SpinnerThreeDots';
import { CheckIcon, ExternalLinkIcon, RocketIcon, UpdateIcon } from '@radix-ui/react-icons';
import { IconButton as Button } from '../ui/IconButton';
import { useChatId } from '../../lib/stores/chatId';
import { useAuth } from '@clerk/nextjs';

interface ErrorResponse {
  error: string;
}

type DeployStatus =
  | { type: 'idle' }
  | { type: 'building' }
  | { type: 'zipping' }
  | { type: 'deploying' }
  | { type: 'error'; message: string }
  | { type: 'success'; updateCounter: number; deployedUrl?: string };

export function DeployButton() {
  const [status, setStatus] = useState<DeployStatus>({ type: 'idle' });

  // ✅ Replaced: convexProjectStore + useConvexSessionId + useMutation → Clerk
  const { userId: sessionId, getToken } = useAuth();
  const currentCounter = useFileUpdateCounter();
  const chatId = useChatId();

  const addFilesToZip = async (container: WebContainer, zip: JSZip, basePath: string, currentPath: string = '') => {
    const fullPath = currentPath ? `${basePath}/${currentPath}` : basePath;
    const entries = await container.fs.readdir(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await addFilesToZip(container, zip, basePath, entryPath);
      } else if (entry.isFile()) {
        const content = await container.fs.readFile(`${basePath}/${entryPath}`);
        zip.file(entryPath, content);
      }
    }
  };

  const handleDeploy = async () => {
    try {
      setStatus({ type: 'building' });
      const container = await webcontainer;

      // Build
      const buildProcess = await container.spawn('vite', ['build', '--mode', 'development']);
      const { output, exitCode } = await streamOutput(buildProcess);
      if (exitCode !== 0) {
        throw new Error(`Build failed: ${output}`);
      }

      // Zip
      setStatus({ type: 'zipping' });
      const zip = new JSZip();
      await addFilesToZip(container, zip, 'dist');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Deploy
      setStatus({ type: 'deploying' });
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', zipBlob, 'dist.zip');
      formData.append('chatId', chatId);
      formData.append('sessionId', sessionId ?? '');

      const response = await fetch('/api/deploy-simple', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponse | null;
        throw new Error(errorData?.error ?? 'Deployment failed');
      }

      const resp = await response.json();
      if (resp.localDevWarning) {
        toast.error(`${resp.localDevWarning}`);
      }

      // ✅ Replaced: recordDeploy convex mutation → fetch
      await fetch('/api/deploy/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatId, sessionId }),
      });

      const updateCounter = getFileUpdateCounter();
      setStatus({ type: 'success', updateCounter, deployedUrl: resp.url });
    } catch (error) {
      toast.error('Failed to deploy. Please try again.');
      console.error('Deployment error:', error);
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Deployment failed' });
    }
  };

  const isLoading = ['building', 'zipping', 'deploying'].includes(status.type);
  // ✅ Replaced: !convex check → !sessionId
  const isDisabled = isLoading || !sessionId;

  let buttonText: string;
  let icon: React.ReactNode;
  switch (status.type) {
    case 'idle':
      buttonText = 'Deploy';
      icon = <RocketIcon />;
      break;
    case 'building':
      buttonText = 'Building...';
      icon = <Spinner />;
      break;
    case 'zipping':
      buttonText = 'Creating package...';
      icon = <Spinner />;
      break;
    case 'deploying':
      buttonText = 'Deploying...';
      icon = <Spinner />;
      break;
    case 'error':
      buttonText = 'Deploy';
      icon = <RocketIcon />;
      break;
    case 'success': {
      if (status.updateCounter === currentCounter) {
        buttonText = 'Deployed';
        icon = <CheckIcon className="text-bolt-elements-icon-success" />;
      } else {
        buttonText = 'Redeploy';
        icon = <UpdateIcon />;
      }
      break;
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        disabled={isDisabled}
        onClick={handleDeploy}
        title={status.type === 'error' ? status.message : undefined}
        variant="neutral"
        size="xs"
        icon={icon}
        tip={(() => {
          switch (status.type) {
            case 'idle':
              return 'Click to deploy your application';
            case 'success':
              return 'Click to deploy again';
            default:
              return undefined;
          }
        })()}
      >
        {buttonText}
      </Button>
      {/* ✅ Replaced: convex.app URL → resp.url from API */}
      {status.type === 'success' && status.deployedUrl && (
        <Button
          href={status.deployedUrl}
          target="_blank"
          size="xs"
          icon={<ExternalLinkIcon />}
        >
          View site
        </Button>
      )}
    </div>
  );
}