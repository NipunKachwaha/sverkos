"use client";

import { useEffect } from 'react';
import { convexTeamsStore, type ConvexTeam } from '../convexTeams';
import { getConvexAuthToken, waitForConvexSessionId } from '../sessionId';
import { getStoredTeamSlug, setSelectedTeamSlug } from '../convexTeams';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { APP_URL } from '../../provisionHost';

// ✅ Replaced: useConvex() → Clerk useAuth()
export function useTeamsInitializer() {
  const { getToken } = useAuth();
  useEffect(() => {
    void fetchTeams(getToken);
  }, [getToken]);
}

// ✅ Replaced: ConvexReactClient param → Clerk getToken function
async function fetchTeams(getToken: () => Promise<string | null>) {
  let teams: ConvexTeam[];
  await waitForConvexSessionId('fetchTeams');
  try {
    // ✅ Replaced: getConvexAuthToken(convex) → Clerk getToken()
    const token = await getToken();
    if (!token) {
      throw new Error('Missing auth token');
    }
    // ✅ Replaced: VITE_PROVISION_HOST → APP_URL
    const response = await fetch(`${APP_URL}/api/dashboard/teams`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to fetch teams: ${response.statusText}: ${body}`);
    }
    teams = await response.json();
  } catch (error) {
    console.error('Error fetching teams:', error);
    toast.error('Failed to load user. Try logging in at https://dashboard.convex.dev.');
    return;
  }
  convexTeamsStore.set(teams);
  const teamSlugFromLocalStorage = getStoredTeamSlug();
  if (teamSlugFromLocalStorage) {
    const team = teams.find((team) => team.slug === teamSlugFromLocalStorage);
    if (team) {
      setSelectedTeamSlug(teamSlugFromLocalStorage);
      return;
    }
  }
  if (teams.length === 1) {
    setSelectedTeamSlug(teams[0].slug);
    return;
  }
  // Force the user to select a team.
  setSelectedTeamSlug(null);
}