import { useStoreMessageHistory } from './useStoreMessageHistory';
import { useExistingInitializeChat, useHomepageInitializeChat } from './useInitializeChat';
import { useInitialMessages } from './useInitialMessages';
import { useProjectInitializer } from './useProjectInitializer';
import { useTeamsInitializer } from './useTeamsInitializer';
import { useExistingChatContainerSetup, useNewChatContainerSetup } from './useContainerSetup';
import { useBackupSyncState } from './history';
import { useState, useEffect } from 'react';
import { useConvexSessionIdOrNullOrLoading } from '../sessionId';
import { useAuth } from '@clerk/nextjs'; // <-- Clerk import added

const PROVISION_HOST = process.env.NEXT_PUBLIC_PROVISION_HOST || '';

// Custom hook to replace Convex's useQuery for fetching subchats
function useFetchSubchats(chatId: string, sessionId: string | null | undefined, skip: boolean) {
  const [subchats, setSubchats] = useState<any[] | undefined>(undefined);
  const { getToken } = useAuth();

  useEffect(() => {
    if (skip || !sessionId) return;

    let isMounted = true;
    const fetchSubchats = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${PROVISION_HOST}/api/subchats/get`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ chatId, sessionId }),
        });

        if (response.ok && isMounted) {
          const data = await response.json();
          setSubchats(data);
        }
      } catch (e) {
        console.error('Failed to fetch subchats:', e);
      }
    };

    fetchSubchats();

    return () => {
      isMounted = false;
    };
  }, [chatId, sessionId, skip, getToken]);

  return subchats;
}

export function useConvexChatHomepage(chatId: string) {
  useTeamsInitializer();
  useProjectInitializer(chatId);
  const [chatInitialized, setChatInitialized] = useState(false);
  const initializeChat = useHomepageInitializeChat(chatId, setChatInitialized);
  const storeMessageHistory = useStoreMessageHistory();
  useNewChatContainerSetup();
  const initialMessages = useInitialMessages(chatInitialized ? chatId : undefined);
  useBackupSyncState(chatId, initialMessages?.loadedSubchatIndex, initialMessages?.deserialized);
  const sessionId = useConvexSessionIdOrNullOrLoading();
  
  // Replaced Convex useQuery with our custom fetch hook
  const subchats = useFetchSubchats(chatId, sessionId, !(sessionId && chatInitialized));

  return {
    initializeChat,
    storeMessageHistory,
    initialMessages: !initialMessages ? initialMessages : initialMessages?.deserialized,
    subchats,
  };
}

export function useConvexChatExisting(chatId: string) {
  useTeamsInitializer();
  useProjectInitializer(chatId);
  const initializeChat = useExistingInitializeChat(chatId);
  const initialMessages = useInitialMessages(chatId);
  useBackupSyncState(chatId, initialMessages?.loadedSubchatIndex, initialMessages?.deserialized);
  const storeMessageHistory = useStoreMessageHistory();
  useExistingChatContainerSetup(initialMessages?.loadedChatId);
  const sessionId = useConvexSessionIdOrNullOrLoading();
  
  // Replaced Convex useQuery with our custom fetch hook
  const subchats = useFetchSubchats(chatId, sessionId, !sessionId);

  return {
    initialMessages: !initialMessages ? initialMessages : initialMessages?.deserialized,
    initializeChat,
    storeMessageHistory,
    subchats,
  };
}