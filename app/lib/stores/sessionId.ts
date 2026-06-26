import { useStore } from '@nanostores/react';
import { atom } from 'nanostores';
import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';

export const sessionIdStore = atom<string | null | undefined>(undefined);

let isFetching = false; 

export function useInitializeSession() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    async function fetchSession() {
      if (!isLoaded) return;
      
      if (!isSignedIn) {
        sessionIdStore.set(null);
        return;
      }

      // Guard against React Strict Mode double execution
      if (isFetching || sessionIdStore.get() !== undefined) return;
      isFetching = true;

      try {
        const token = await getToken();

        // Backend API call (Supabase)
        const res = await fetch('/api/sessions/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (res.ok) {
          const data = await res.json();
          sessionIdStore.set(data.sessionId);
        } else {
          // ✅ FIX: Read the actual error from backend
          const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
          console.error(`Failed to start session: ${res.status}`, errorData);
          sessionIdStore.set(null);
        }
      } catch (error) {
        console.error('Session Fetch Error:', error);
        sessionIdStore.set(null);
      } finally {
        isFetching = false;
      }
    }

    fetchSession();
  }, [isLoaded, isSignedIn]);
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
  return new Promise((resolve, reject) => {
    const sessionId = sessionIdStore.get();
    
    if (sessionId !== null && sessionId !== undefined) {
      resolve(sessionId);
      return;
    }

    if (sessionId === null) {
      reject(new Error("Session ID is null. User might not be signed in or session creation failed."));
      return;
    }
    
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error("Timeout waiting for session ID"));
    }, 10000);

    if (caller) {
      console.log(`[${caller}] Waiting for session ID...`);
    }
    
    const unsubscribe = sessionIdStore.subscribe((newSessionId) => {
      if (newSessionId !== undefined) {
        clearTimeout(timeout);
        unsubscribe();
        
        if (newSessionId !== null) {
          resolve(newSessionId);
        } else {
          reject(new Error("Session ID became null during wait."));
        }
      }
    });
  });
}