"use client";

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { toast } from 'sonner';

// ✅ Replaced: Convex project credentials → Supabase project info via fetch
export function useProjectInitializer(chatId: string) {
  const { userId, getToken } = useAuth();

  useEffect(() => {
    if (!userId || !chatId) return;

    const loadProject = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/projects/info?chatId=${chatId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          console.warn('Could not load project info for chat:', chatId);
          return;
        }

        const project = await res.json();

        if (project?.kind === 'failed') {
          toast.error(project.errorMessage);
        }
      } catch (error) {
        console.error('Failed to initialize project', error);
      }
    };

    void loadProject();
  }, [chatId, userId, getToken]);
}