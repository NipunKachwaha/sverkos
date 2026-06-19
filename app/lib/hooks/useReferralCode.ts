import { useQuery as useReactQuery } from '@tanstack/react-query';
import { useAuthToken } from './useDebugPrompt';
import { APP_URL } from '../provisionHost';
import { useSelectedTeam } from '../stores/convexTeams';
import { queryClientStore } from '../stores/reactQueryClient';

export function useReferralCode() {
  const team = useSelectedTeam();
  return team?.referralCode || null;
}

export function useReferralStats() {
  const authToken = useAuthToken();
  const teamId = useSelectedTeam()?.id;
  const { data } = useReactQuery(
    {
      queryKey: ['referral stats', teamId],
      enabled: !!(authToken && teamId !== undefined),
      queryFn: async () => {
        const data = (await bbGet(`/api/dashboard/teams/${teamId}/referral_state`, authToken!)) as {
          referrals: unknown[];
          referredBy: unknown;
        };
        return data;
      },
    },
    queryClientStore.get(),
  );
  if (!data) {
    return null;
  }
  return {
    left: 5 - data.referrals.length,
  };
}

export async function bbGet(path: string, authToken: string) {
  const url = `${APP_URL}${path}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('fetch error: ' + response.status + (await response.text()));
  }

  return await response.json();
}
