import { WebContainer } from '@webcontainer/api';
import { WORK_DIR_NAME } from '../../../lib/agent/constants';
import { cleanStackTrace } from '../../utils/stacktrace';
import { createScopedLogger } from '../../../lib/agent/utils/logger';
import { setContainerBootState, ContainerBootState } from '../stores/containerBootState';
import { workbenchStore } from '../stores/workbench.client';
import { chooseExperience } from '../../utils/experienceChooser';

interface WebContainerContext {
  loaded: boolean;
}

// Next.js mein HMR caching ke liye globalThis ka safe use
const globalContext = globalThis as any;

const webcontainerContext: WebContainerContext = globalContext.__webcontainerContext ?? {
  loaded: false,
};
globalContext.__webcontainerContext = webcontainerContext;

export let webcontainer: Promise<WebContainer> = new Promise(() => {
  // noop for ssr
});

const logger = createScopedLogger('webcontainer');

let shouldBootWebcontainer = false;

// FIX: Vite ke import.meta.env.SSR ki jagah Next.js ka standard window check
if (typeof window !== 'undefined') {
  const experience = chooseExperience(navigator.userAgent, window.crossOriginIsolated);

  shouldBootWebcontainer = experience === 'the-real-thing' || experience === 'mobile-warning';
  if (!shouldBootWebcontainer) {
    console.error('Not attempting to boot webcontainer because window.crossOriginIsolated is not true');
  }
}

if (shouldBootWebcontainer) {
  webcontainer =
    globalContext.__webcontainer ??
    Promise.resolve()
      .then(() => {
        setContainerBootState(ContainerBootState.STARTING);
        return WebContainer.boot({
          coep: 'credentialless',
          workdirName: WORK_DIR_NAME,
          forwardPreviewErrors: true, // Enable error forwarding from iframes
        });
      })
      .then(async (webcontainerInstance) => {
        // Listen for preview errors
        webcontainerInstance.on('preview-message', (message) => {
          logger.info('WebContainer preview message:', JSON.stringify(message));

          // Handle both uncaught exceptions and unhandled promise rejections
          if (message.type === 'PREVIEW_UNCAUGHT_EXCEPTION' || message.type === 'PREVIEW_UNHANDLED_REJECTION') {
            const isPromise = message.type === 'PREVIEW_UNHANDLED_REJECTION';
            workbenchStore.actionAlert.set({
              type: 'preview',
              title: isPromise ? 'Unhandled Promise Rejection' : 'Uncaught Exception',
              description: message.message,
              content: `Error occurred at ${message.pathname}${message.search}${message.hash}\nPort: ${message.port}\n\nStack trace:\n${cleanStackTrace(message.stack || '')}`,
              source: 'preview',
            });
          }
        });
        // Set the container boot state to LOADING_SNAPSHOT to hand off control
        // to the container setup code.
        setContainerBootState(ContainerBootState.LOADING_SNAPSHOT);
        globalContext.webcontainer = webcontainerInstance;
        return webcontainerInstance;
      })
      .catch((error) => {
        setContainerBootState(ContainerBootState.ERROR, error);
        throw error;
      });

  globalContext.__webcontainer = webcontainer;
}