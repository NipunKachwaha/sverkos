'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { createContext, useContext, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ChefAuthState =
  | {
      kind: 'loading';
    }
  | {
      kind: 'unauthenticated';
    }
  | {
      kind: 'fullyLoggedIn';
      sessionId: string; 
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
  // Clerk handles all the heavy lifting automatically
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  // Calculate the state directly from Clerk's hooks
  const state: ChefAuthState = !isLoaded
    ? { kind: 'loading' }
    : !isSignedIn
      ? { kind: 'unauthenticated' }
      : { kind: 'fullyLoggedIn', sessionId: user?.id || '' };

  // Redirect if the user is logged out and the page requires auth
  useEffect(() => {
    if (redirectIfUnauthenticated && state.kind === 'unauthenticated') {
      console.log('Redirecting to / (unauthenticated)');
      window.location.href = '/';
    }
  }, [redirectIfUnauthenticated, state.kind]);

  return (
    <ChefAuthContext.Provider value={{ state }}>
      {children}
    </ChefAuthContext.Provider>
  );
};