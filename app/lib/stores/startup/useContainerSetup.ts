"use client";

import { useEffect } from 'react';
import { ContainerBootState, setContainerBootState, waitForBootStepCompleted } from '../containerBootState';
import { webcontainer } from '../../webcontainer/index';
import { useStore } from '@nanostores/react';
import { sessionIdStore } from '../sessionId';
import { useAuth } from '@clerk/nextjs';
import { decompressWithLz4 } from '../../compression';
import { streamOutput } from '../../../utils/process';
import { cleanTerminalOutput } from '../../../../lib/agent/utils/shell';
import { toast } from 'sonner';
import type { WebContainer } from '@webcontainer/api';
import { workbenchStore } from '../workbench.client';
import { appendEnvVarIfNotSet } from '../../../utils/envFileUtils';
import { getFileUpdateCounter } from '../fileUpdateCounter';
import { chatSyncState } from './chatSyncState';
import { FILE_EVENTS_DEBOUNCE_MS } from '../files';
import { setChefDebugProperty } from '../../../../lib/agent/utils/chefDebug';

const TEMPLATE_URL = '/template-snapshot-342e2b07.bin';

// ✅ Replaced: useConvex() + convex setup → Clerk getToken + fetch
export function useNewChatContainerSetup() {
  const { getToken } = useAuth();

  useEffect(() => {
    const runSetup = async () => {
      try {
        await waitForBootStepCompleted(ContainerBootState.STARTING);
        const token = await getToken();
        await setupContainer({ snapshotUrl: TEMPLATE_URL, allowNpmInstallFailure: false, token });
      } catch (error: any) {
        toast.error('Failed to setup environment. Try reloading the page.');
        setContainerBootState(ContainerBootState.ERROR, error);
      }
    };
    void runSetup();
  }, [getToken]);
}

// ✅ Replaced: convex.query(api.snapshot.getSnapshotUrl) → fetch
export function useExistingChatContainerSetup(loadedChatId: string | undefined) {
  const sessionId = useStore(sessionIdStore);
  const { getToken } = useAuth();

  useEffect(() => {
    if (!sessionId) return;
    if (!loadedChatId) return;

    const runSetup = async () => {
      try {
        await waitForBootStepCompleted(ContainerBootState.STARTING);

        const token = await getToken();

        // ✅ Replaced: convex.query(api.snapshot.getSnapshotUrl) → fetch
        const res = await fetch(`/api/snapshots/url?chatId=${loadedChatId}&sessionId=${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let snapshotUrl = TEMPLATE_URL;
        if (res.ok) {
          const data = await res.json();
          snapshotUrl = data.url ?? TEMPLATE_URL;
        } else {
          console.warn(`Existing chat ${loadedChatId} has no snapshot. Loading the base template.`);
        }

        await setupContainer({ snapshotUrl, allowNpmInstallFailure: true, token });
      } catch (error: any) {
        toast.error('Failed to setup environment. Try reloading the page.');
        setContainerBootState(ContainerBootState.ERROR, error);
      }
    };
    void runSetup();
  }, [loadedChatId, sessionId, getToken]);
}

// ✅ Replaced: ConvexReactClient param → token string
async function setupContainer(options: {
  snapshotUrl: string;
  allowNpmInstallFailure: boolean;
  token: string | null;
}) {
  // Download + mount snapshot
  const resp = await fetch(options.snapshotUrl);
  if (!resp.ok) {
    throw new Error(`Failed to download snapshot (${resp.statusText})`);
  }
  const compressed = await resp.arrayBuffer();
  const decompressed = decompressWithLz4(new Uint8Array(compressed));

  const container = await webcontainer;
  await container.mount(decompressed);

  // Prewarm workdir
  await workbenchStore.prewarmWorkdir(container);
  setChefDebugProperty('webcontainer', container);

  // Install dependencies
  setContainerBootState(ContainerBootState.DOWNLOADING_DEPENDENCIES);
  const npm = await container.spawn('npm', ['install', '--no-fund', '--no-deprecated']);
  const { output, exitCode } = await streamOutput(npm);
  console.log('NPM output', cleanTerminalOutput(output));

  if (exitCode !== 0) {
    if (options.allowNpmInstallFailure) {
      toast.error('Failed to install dependencies. Fix your package.json and try again.', {
        duration: Infinity,
      });
      console.error(`npm install failed with exit code ${exitCode}: ${output}`);
    } else {
      throw new Error(`npm install failed with exit code ${exitCode}: ${output}`);
    }
  }

  // ✅ Replaced: Convex project setup → Supabase env vars setup
  setContainerBootState(ContainerBootState.SETTING_UP_CONVEX_PROJECT);
  await setupSupabaseEnvVars(container);

  // ✅ Replaced: setupOpenAIToken + setupResendToken via Convex → fetch
  setContainerBootState(ContainerBootState.SETTING_UP_CONVEX_ENV_VARS);
  await setupOpenAIToken(container, options.token);
  await setupResendToken(container, options.token);

  // Backup
  setContainerBootState(ContainerBootState.STARTING_BACKUP);
  await initializeFileSystemBackup();

  setContainerBootState(ContainerBootState.READY);
}

async function initializeFileSystemBackup() {
  await new Promise((resolve) => setTimeout(resolve, FILE_EVENTS_DEBOUNCE_MS * 2));
  const currentChatSyncState = chatSyncState.get();
  if (currentChatSyncState.savedFileUpdateCounter === null) {
    const fileUpdateCounter = getFileUpdateCounter();
    chatSyncState.set({
      ...currentChatSyncState,
      savedFileUpdateCounter: fileUpdateCounter,
    });
  }
}

// ✅ Replaced: setupConvexEnvVars → setupSupabaseEnvVars
async function setupSupabaseEnvVars(container: WebContainer) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  await appendEnvVarIfNotSet({
    envFilePath: '.env.local',
    readFile: (path) => container.fs.readFile(path, 'utf-8'),
    writeFile: (path, content) => container.fs.writeFile(path, content),
    envVarName: 'NEXT_PUBLIC_SUPABASE_URL',
    value: supabaseUrl,
  });

  await appendEnvVarIfNotSet({
    envFilePath: '.env.local',
    readFile: (path) => container.fs.readFile(path, 'utf-8'),
    writeFile: (path, content) => container.fs.writeFile(path, content),
    envVarName: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: supabaseAnonKey,
  });
}

// ✅ Replaced: convex.mutation(api.openaiProxy.issueOpenAIToken) → fetch
async function setupOpenAIToken(container: WebContainer, token: string | null) {
  try {
    const res = await fetch('/api/tokens/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) return;

    const data = await res.json();
    if (data.apiKey) {
      await appendEnvVarIfNotSet({
        envFilePath: '.env.local',
        readFile: (path) => container.fs.readFile(path, 'utf-8'),
        writeFile: (path, content) => container.fs.writeFile(path, content),
        envVarName: 'OPENAI_API_KEY',
        value: data.apiKey,
      });
    }
  } catch (error) {
    console.error('Failed to setup OpenAI token', error);
  }
}

// ✅ Replaced: convex.mutation(api.resendProxy.issueResendToken) → fetch
async function setupResendToken(container: WebContainer, token: string | null) {
  try {
    const res = await fetch('/api/tokens/resend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) return;

    const data = await res.json();
    if (data.apiKey) {
      await appendEnvVarIfNotSet({
        envFilePath: '.env.local',
        readFile: (path) => container.fs.readFile(path, 'utf-8'),
        writeFile: (path, content) => container.fs.writeFile(path, content),
        envVarName: 'RESEND_API_KEY',
        value: data.apiKey,
      });
    }
  } catch (error) {
    console.error('Failed to setup Resend token', error);
  }
}