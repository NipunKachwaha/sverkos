import { useConvex, useMutation, useQuery } from 'convex/react';
import { useQueries as useReactQueries } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CoreMessage } from 'ai';
import { decompressWithLz4 } from '@/app/lib/compression.client';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

async function fetchPromptData(url: string): Promise<CoreMessage[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch prompt data: ${response.statusText}`);
  }

  const compressedData = await response.arrayBuffer();
  const decompressedData = decompressWithLz4(new Uint8Array(compressedData));
  const textDecoder = new TextDecoder();
  const jsonString = textDecoder.decode(decompressedData);
  return JSON.parse(jsonString) as CoreMessage[];
}

export function useAuthToken() {
  const { getToken, isLoaded, isSignedIn } = useAuth(); // ✅ Clerk auth
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function grabAuthToken() {
      if (!isLoaded || !isSignedIn) return; // ✅ Wait for Clerk to be ready
      const token = await getToken();
      if (mounted && token !== authToken) {
        setAuthToken(token ?? null);
      }
    }
    grabAuthToken();

    const intervalId = setInterval(
      () => {
        grabAuthToken();
      },
      authToken ? 10 * 60 * 1000 : 100,
    );

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [getToken, isLoaded, isSignedIn, authToken]);

  return authToken;
}

export function useIsAdmin() {
  const authToken = useAuthToken();
  const requestAdminCheck = useMutation(api.admin.requestAdminCheck);
  const isAdmin = useQuery(api.admin.isCurrentUserAdmin, {});

  useEffect(() => {
    if (isAdmin === false && authToken) {
      requestAdminCheck({
        token: authToken,
      }).catch((error) => {
        console.error('Error requesting admin check:', error);
      });
    }
  }, [isAdmin, requestAdminCheck, authToken]);

  return !!isAdmin;
}

interface DebugPromptData {
  prompt: CoreMessage[] | undefined;
  completion: CoreMessage[];
  [key: string]: unknown;
}

interface DebugPromptResult {
  data: DebugPromptData[] | null;
  isPending: boolean;
  error: Error | null;
}

export function useDebugPrompt(chatInitialId: string): DebugPromptResult {
  const isAdmin = useIsAdmin();
  const promptMetadatas = useQuery(
    api.debugPrompt.show,
    isAdmin ? { chatInitialId } : 'skip'
  );

  const queries = useReactQueries({
    queries: (promptMetadatas ?? []).map((promptMetadata) => ({
      queryKey: ['prompt', promptMetadata.coreMessagesUrl] as const,
      queryFn: () => fetchPromptData(promptMetadata.coreMessagesUrl!),
      staleTime: Infinity,
      gcTime: 10 * 60 * 1000,
      enabled: !!promptMetadata.coreMessagesUrl,
    })),
  });

  const firstErroredQuery = queries.find((query) => query.isError);
  if (firstErroredQuery) {
    return {
      data: null,
      isPending: false,
      error: firstErroredQuery.error as Error,
    };
  }

  if (
    promptMetadatas === undefined ||
    (queries.length > 0 && !queries.some((query) => query.data))
  ) {
    return {
      data: null,
      isPending: true,
      error: null,
    };
  }

  return {
    data: queries.map((query, i) => {
      const { responseCoreMessages, ...rest } = promptMetadatas![i];
      return {
        prompt: query.data ?? undefined,
        completion: responseCoreMessages,
        ...rest,
      };
    }),
    isPending: false,
    error: null,
  };
}