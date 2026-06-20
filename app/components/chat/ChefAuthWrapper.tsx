'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { setChefDebugProperty } from '../../../lib/agent/utils/chefDebug';

// ─── Types ────────────────────────────────────────────────────────────────────
// Replaced Convex Id<'sessions'> with plain string (Clerk userId)

type ChefAuthState =
  | {
      kind: 'loading';
    }
  | {
      kind: 'unauthenticated';
    }
  | {
      kind: 'fullyLoggedIn';
      sessionId: string; // was: Id<'sessions'> — now Clerk userId
    };

// ─── Context ──────────────────────────────────────────────────────────────────

const ChefAuthContext = createContext<{
  state: ChefAuthState;
}>(null as unknown as { state: ChefAuthState });

export function useChefAuth() {
  const state = useContext(ChefAuthContext);
  if (state === null) {
    throw new Error('useChefAuth must be used within a ChefAuthProvider');
  }
  return state.state;
}

export function useChefAuthContext() {
  const state = useContext(ChefAuthContext);
  if (state === null) {
    throw new Error('useChefAuth must be used within a ChefAuthProvider');
  }
  return state;
}

export const SESSION_ID_KEY = 'sessionIdForClerk';

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ChefAuthProvider = ({
  children,
  redirectIfUnauthenticated,
}: {
  children: React.ReactNode;
  redirectIfUnauthenticated: boolean;
}) => {
  // Replaced: useConvex() + useConvexAuth() + useAuth(WorkOS) → Clerk hooks
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();

  const isAuthenticated = !!isSignedIn;
  const isAuthLoading = !isLoaded;

  // FIX 1: Removed @uidotdev/usehooks and implemented an SSR-safe localStorage hook
  const [sessionIdFromLocalStorage, setSessionIdState] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(SESSION_ID_KEY);
        if (item) {
          setSessionIdState(JSON.parse(item));
        }
      } catch (error) {
        console.warn('Error reading localStorage', error);
      }
    }
  }, []);

  const setSessionIdFromLocalStorage = useCallback((value: string | null) => {
    try {
      setSessionIdState(value);
      if (typeof window !== 'undefined') {
        if (value === null) {
          window.localStorage.removeItem(SESSION_ID_KEY);
        } else {
          window.localStorage.setItem(SESSION_ID_KEY, JSON.stringify(value));
        }
      }
    } catch (error) {
      console.warn('Error setting localStorage', error);
    }
  }, []);

  const hasAlertedAboutOptIns = useRef(false);
  const authRetries = useRef(0);

  // Replaced: useConvexSessionIdOrNullOrLoading() → derived from Clerk
  const sessionId: string | null | undefined = !isLoaded
    ? undefined        // still loading
    : !isSignedIn
      ? null           // unauthenticated
      : user?.id ?? null; // logged in — use Clerk userId as sessionId

  useEffect(() => {
    function setSession(id: string | null) {
      setSessionIdFromLocalStorage(id);
      // Replaced: sessionIdStore.set(id) → localStorage only (via useLocalStorage above)
      if (id) {
        setChefDebugProperty('sessionId', id);
      }
    }

    const isUnauthenticated = !isAuthenticated && !isAuthLoading;

    if (sessionId === undefined && isUnauthenticated) {
      setSession(null);
      return undefined;
    }

    if (sessionId !== null && isUnauthenticated) {
      setSession(null);
      return undefined;
    }

    let verifySessionTimeout: ReturnType<typeof setTimeout> | null = null;

    async function verifySession() {
      if (sessionIdFromLocalStorage) {
        // Replaced: WorkOS getAccessToken({}) → Clerk getToken()
        try {
          const token = await getToken();
          if (!token) throw new Error('No Clerk token available');
          authRetries.current = 0;
        } catch (_e) {
          console.error('Unable to fetch access token from Clerk');
          if (authRetries.current < 3 && verifySessionTimeout === null) {
            authRetries.current++;
            verifySessionTimeout = setTimeout(() => {
              void verifySession();
            }, 1000);
          }
          return;
        }

        if (!isAuthenticated) {
          // Wait until Clerk auth is fully propagated
          return;
        }

        // Replaced: convex.query(api.sessions.verifySession) 
        // → Clerk handles session validity automatically
        const isValid = isAuthenticated && !!user?.id;

        if (isValid) {
          // Replaced: fetchOptIns(convex) 
          // → No Convex opt-ins needed; Clerk + your own TOS flow handles this
          if (!hasAlertedAboutOptIns.current) {
            // If you add your own TOS/opt-in check via Supabase, do it here
            hasAlertedAboutOptIns.current = true;
          }
          setSession(user!.id);
        } else {
          setSession(null);
        }
      }

      if (isAuthenticated && user?.id) {
        try {
          // Replaced: convex.mutation(api.sessions.startSession)
          // → Clerk userId IS the session — no separate session creation needed
          setSession(user.id);
        } catch (error) {
          console.error('Error setting session', error);
          toast.error('Unexpected error verifying credentials');
          setSession(null);
        }
      }

      return;
    }

    void verifySession();

    return () => {
      if (verifySessionTimeout) {
        clearTimeout(verifySessionTimeout);
      }
    };
  }, [
    sessionId,
    isAuthenticated,
    isAuthLoading,
    sessionIdFromLocalStorage,
    setSessionIdFromLocalStorage,
    getToken,
    user,
  ]);

  // State shape same as original — only type changed from Id<'sessions'> to string
  const isLoading = sessionId === undefined || isAuthLoading;
  const isUnauthenticated = sessionId === null || !isAuthenticated;

  const state: ChefAuthState = isLoading
    ? { kind: 'loading' }
    : isUnauthenticated
      ? { kind: 'unauthenticated' }
      : { kind: 'fullyLoggedIn', sessionId: sessionId as string };

  // FIX 2: Wrapped redirect in useEffect for SSR safety
  useEffect(() => {
    if (redirectIfUnauthenticated && state.kind === 'unauthenticated') {
      console.log('redirecting to /');
      window.location.href = '/';
    }
  }, [redirectIfUnauthenticated, state.kind]);

  return (
    <ChefAuthContext.Provider value={{ state }}>
      {children}
    </ChefAuthContext.Provider>
  );
};