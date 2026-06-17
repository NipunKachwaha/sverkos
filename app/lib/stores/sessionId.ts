import type { Id } from '@convex/_generated/dataModel';
import { useStore } from '@nanostores/react';
import { atom } from 'nanostores';

// ✅ Removed: ConvexReactClient import — ab zarurat nahi

export function useConvexSessionIdOrNullOrLoading(): string | null | undefined {
  const sessionId = useStore(sessionIdStore);
  return sessionId;
}

export function useConvexSessionId(): string {
  const sessionId = useStore(sessionIdStore);
  if (sessionId === undefined || sessionId === null) {
    throw new Error('Session ID is not set');
  }
  return sessionId;
}

export async function waitForConvexSessionId(caller?: string): Promise<string> {
  return new Promise((resolve) => {
    const sessionId = sessionIdStore.get();
    if (sessionId !== null && sessionId !== undefined) {
      resolve(sessionId);
      return;
    }
    if (caller) {
      console.log(`[${caller}] Waiting for session ID...`);
    }
    const unsubscribe = sessionIdStore.subscribe((sessionId) => {
      if (sessionId !== null && sessionId !== undefined) {
        unsubscribe();
        resolve(sessionId);
      }
    });
  });
}

// ✅ Replaced: Id<'sessions'> → string (Clerk userId)
export const sessionIdStore = atom<string | null | undefined>(undefined);

export const convexAuthTokenStore = atom<string | null>(null);

/**
 * ✅ Replaced: Convex internal token extraction → cached Clerk token
 * Token is set via setAuthToken() when Clerk provides it.
 */
export function getConvexAuthToken(): string | null {
  return convexAuthTokenStore.get();
}

export function setAuthToken(token: string | null) {
  convexAuthTokenStore.set(token);
}