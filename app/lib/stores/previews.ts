'use client';

import type { WebContainer } from '@webcontainer/api';
import { atom } from 'nanostores';
import { createScopedLogger } from '../../../lib/agent/utils/logger';
import { withResolvers } from '../../utils/promises';

export interface PreviewInfo {
  port: number;
  ready: boolean;
  baseUrl: string;
  iframe: HTMLIFrameElement | null;
}

const PROXY_PORT_RANGE_START = 0xc4ef;

// Vite ka ?raw import Next.js mein kaam nahi karta, isliye usko yahan se hata diya gaya hai.
// Ab hum is file ko fetch() ke zariye runtime par layenge.

type ProxyState = { sourcePort: number; start: (arg: { proxyUrl: string }) => void; stop: () => void };

export class PreviewsStore {
  #availablePreviews = new Map<number, PreviewInfo>();
  #webcontainer: Promise<WebContainer>;

  previews = atom<PreviewInfo[]>([]);

  #proxies = new Map<number, ProxyState>();

  constructor(webcontainerPromise: Promise<WebContainer>) {
    this.#webcontainer = webcontainerPromise;
    this.#init();
  }

  async #init() {
    const webcontainer = await this.#webcontainer;

    // Listen for server ready events
    webcontainer.on('server-ready', (port, url) => {
      console.log('[Preview] Server ready on port:', port, url);
    });

    // Listen for port events
    webcontainer.on('port', (port, type, url) => {
      if (this.#proxies.has(port)) {
        if (type === 'open') {
          this.#proxies.get(port)?.start({ proxyUrl: url });
        }
        return;
      }

      let previewInfo = this.#availablePreviews.get(port);

      if (type === 'close' && previewInfo) {
        this.#availablePreviews.delete(port);
        this.previews.set(this.previews.get().filter((preview) => preview.port !== port));
        return;
      }

      const previews = this.previews.get();

      if (!previewInfo) {
        previewInfo = { port, ready: type === 'open', baseUrl: url, iframe: null };
        this.#availablePreviews.set(port, previewInfo);
        previews.push(previewInfo);
      }

      previewInfo.ready = type === 'open';
      previewInfo.baseUrl = url;

      this.previews.set([...previews]);
    });
  }

  /**
   * Starts a proxy server for the given source port.
   */
  async startProxy(sourcePort: number): Promise<{ proxyPort: number; proxyUrl: string }> {
    const targetPort = PROXY_PORT_RANGE_START + this.#proxies.size;
    const { promise: onStart, resolve: start } = withResolvers<{ proxyUrl: string }>();

    const proxyLogger = createScopedLogger(`Proxy ${targetPort} → ${sourcePort}`);

    const proxyState: ProxyState = {
      sourcePort,
      start,
      stop() {
        throw new Error('Proxy not started');
      },
    };
    this.#proxies.set(targetPort, proxyState);

    const webcontainer = await this.#webcontainer;

    // NAYA LOGIC: Public folder se proxy script fetch kar rahe hain
    const proxyRes = await fetch('/proxy.bundled.cjs');
    if (!proxyRes.ok) {
      throw new Error('Failed to load proxy.bundled.cjs. Please make sure it is inside the "public" folder.');
    }
    const PROXY_SERVER_SOURCE = await proxyRes.text();

    const proxyScriptLocation = '/tmp/previewProxy.cjs';
    
    // webcontainer.writeFile seems incapable of writing to /tmp/foo
    // so use sh instead. It's important that this string has no
    // single quote characters ' in it so this naive escaping works.
    const writeProxyProcess = await webcontainer.spawn('sh', [
      '-c',
      `echo '${PROXY_SERVER_SOURCE}' > ${proxyScriptLocation}`,
    ]);
    await writeProxyProcess.exit;
    const proxyProcess = await webcontainer.spawn('node', [
      proxyScriptLocation,
      sourcePort.toString(),
      targetPort.toString(),
    ]);

    proxyState.stop = () => {
      proxyLogger.info('Stopping proxy');
      proxyProcess.kill();
    };

    proxyProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          proxyLogger.info(data);
        },
      }),
    );

    const { proxyUrl } = await onStart;
    return { proxyPort: targetPort, proxyUrl };
  }

  /**
   * Called when a proxy server is no longer used and it can be released.
   */
  stopProxy(proxyPort: number) {
    const proxy = this.#proxies.get(proxyPort);
    if (!proxy) {
      throw new Error(`Proxy for port ${proxyPort} not found`);
    }

    proxy.stop();
  }

  async requestAnyScreenshot(timeout = 30000): Promise<string> {
    const t0 = performance.now();
    let previewIndex;
    do {
      previewIndex = this.previews.get().findIndex((preview) => preview.iframe);
      if (previewIndex !== -1) {
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    } while (performance.now() < t0 + timeout);

    return this.requestScreenshot(previewIndex);
  }

  async requestScreenshot(previewIndex: number): Promise<string> {
    const iframe = this.previews.get()[previewIndex].iframe;
    if (!iframe) {
      throw new Error('No preview yet');
    }
    if (!iframe?.contentWindow) {
      throw new Error('No preview yet');
    }

    const targetOrigin = new URL(iframe.src).origin;
    let cleanup: (() => void) | undefined;

    const getScreenshotData = (): Promise<string> =>
      new Promise<string>((resolve) => {
        const handleMessage = (e: MessageEvent) => {
          if (e.origin !== targetOrigin || !('type' in e.data) || e.data.type !== 'screenshot') {
            return;
          }
          resolve(e.data.data as string);
        };
        window.addEventListener('message', handleMessage);
        cleanup = () => window.removeEventListener('message', handleMessage);
      });
    try {
      iframe.contentWindow?.postMessage(
        {
          type: 'chefPreviewRequest',
          request: 'screenshot',
        },
        targetOrigin,
      );
      return await Promise.race([
        getScreenshotData(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Screenshot timeout')), 1000)),
      ]);
    } finally {
      cleanup?.();
    }
  }
}