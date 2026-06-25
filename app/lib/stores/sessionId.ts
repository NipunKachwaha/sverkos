import { useStore } from '@nanostores/react';
import { atom } from 'nanostores';
import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';

export const sessionIdStore = atom<string | null | undefined>(undefined);
export const convexAuthTokenStore = atom<string | null>(null);

// ✅ NAYA HOOK: Yeh hook backend API call karke Session ID fetch karega
export function useInitializeSession() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    async function fetchSession() {
      if (!isLoaded) return;
      
      // Agar user logged in nahi hai, toh session null set karo
      if (!isSignedIn) {
        sessionIdStore.set(null);
        return;
      }

      try {
        const token = await getToken();
        setAuthToken(token); // Token ko bhi store mein save kar do

        // Naye backend se session fetch karo
        const res = await fetch('/api/sessions/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (res.ok) {
          const data = await res.json();
          // ✅ Store update! Ab baaki saare waiting functions aage badh jayenge
          sessionIdStore.set(data.sessionId);
        } else {
          console.error('Failed to start session');
          sessionIdStore.set(null);
        }
      } catch (error) {
        console.error('Session Fetch Error:', error);
        sessionIdStore.set(null);
      }
    }

    // Sirf tabhi call karo jab store khali (undefined) ho
    if (sessionIdStore.get() === undefined) {
      fetchSession();
    }
  }, [getToken, isLoaded, isSignedIn]);
}

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

export function getConvexAuthToken(): string | null {
  return convexAuthTokenStore.get();
}

export function setAuthToken(token: string | null) {
  convexAuthTokenStore.set(token);
}