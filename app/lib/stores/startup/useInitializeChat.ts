import { selectedTeamSlugStore, waitForSelectedTeamSlug } from '../convexTeams';
import { waitForConvexSessionId } from '../sessionId'; 
import { useCallback } from 'react';
import { useChefAuth } from '../../../components/chat/ChefAuthWrapper';
import { ContainerBootState, waitForBootStepCompleted } from '../containerBootState';
import { toast } from 'sonner';
import { useAuth, useClerk } from '@clerk/nextjs'; 

const CREATE_PROJECT_TIMEOUT = 15000;
const PROVISION_HOST = process.env.NEXT_PUBLIC_PROVISION_HOST || '';

// Placeholder: Convex connection ki jagah ab naya logic aayega
async function waitForProjectConnection() {
  return new Promise(resolve => setTimeout(resolve, 2000));
}

export function useHomepageInitializeChat(chatId: string, setChatInitialized: (chatInitialized: boolean) => void) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const chefAuthState = useChefAuth();
  const isFullyLoggedIn = chefAuthState.kind === 'fullyLoggedIn';

  return useCallback(async () => {
    // Clerk Auth Check
    if (!isFullyLoggedIn || (!isLoaded || !isSignedIn)) {
      clerk.openSignIn();
      return false;
    }
    
    // FIX: Updated function call here
    const sessionId = await waitForConvexSessionId('useInitializeChat');
    const selectedTeamSlug = selectedTeamSlugStore.get();
    
    if (selectedTeamSlug === null) {
      // If the user hasn't selected a team, don't initialize the chat.
      return false;
    }

    // WorkOS/Convex token ki jagah Clerk ka token fetch kar rahe hain
    const clerkAccessToken = await getToken();
    if (!clerkAccessToken) {
      console.error('No Clerk access token');
      toast.error('Unexpected error creating chat');
      return false;
    }
    
    const teamSlug = await waitForSelectedTeamSlug('useInitializeChat');

    const projectInitParams = {
      teamSlug,
      accessToken: clerkAccessToken, // Replaced workosAccessToken with Clerk Token
    };

    try {
      // Initialize the chat and start project creation via generic REST API (Replacing Convex mutation)
      const response = await fetch(`${PROVISION_HOST}/api/messages/initializeChat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${clerkAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: chatId,
          sessionId,
          projectInitParams,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize chat backend');
      }

      // Wait for the project to be successfully created before allowing chat to start
      await Promise.race([
        waitForProjectConnection(),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Connection timeout'));
          }, CREATE_PROJECT_TIMEOUT);
        }),
      ]);
      setChatInitialized(true);
    } catch (error) {
      console.error('Failed to create project:', error);
      if (error instanceof Error && error.message === 'Connection timeout') {
        toast.error('Connection timed out. Please try again.');
      } else {
        toast.error('Failed to create project. Please try again.');
      }
      return false;
    }

    // Wait for the WebContainer to have its snapshot loaded before sending a message.
    await waitForBootStepCompleted(ContainerBootState.LOADING_SNAPSHOT);
    return true;
  }, [clerk, isLoaded, isSignedIn, isFullyLoggedIn, chatId, setChatInitialized, getToken]);
}

export function useExistingInitializeChat(chatId: string) {
  const { getToken, isSignedIn } = useAuth();

  return useCallback(async () => {
    // FIX: Updated function call here
    const sessionId = await waitForConvexSessionId('useInitializeChat');
    const teamSlug = await waitForSelectedTeamSlug('useInitializeChat');
    
    const clerkAccessToken = await getToken();
    if (!clerkAccessToken || !isSignedIn) {
      console.error('No Clerk access token');
      toast.error('Unexpected error creating chat');
      return false;
    }
    
    const projectInitParams = {
      teamSlug,
      accessToken: clerkAccessToken,
    };

    try {
      // Replaced Convex mutation with REST API fetch
      await fetch(`${PROVISION_HOST}/api/messages/initializeChat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${clerkAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: chatId,
          sessionId,
          projectInitParams,
        }),
      });
    } catch (error) {
      console.error('Failed to init existing chat:', error);
      return false;
    }

    // We don't need to wait for container boot here since we don't mount
    // the UI until it's fully ready.
    return true;
  }, [getToken, isSignedIn, chatId]);
}