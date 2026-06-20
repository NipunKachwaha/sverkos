// 'use client';

// import { useEffect } from 'react';
// import { setExtra, setUser } from '@sentry/nextjs';
// import { useAuth, useUser } from '@clerk/nextjs';
// import { useConvexSessionIdOrNullOrLoading, getConvexAuthToken, setAuthToken } from '../lib/stores/sessionId';
// import { useChatId } from '../lib/stores/chatId';
// import { setProfile } from '../lib/stores/profile';
// import { getConvexProfile } from '../lib/convexProfile';
// import { useLDClient, withLDProvider, basicLogger } from 'launchdarkly-react-client-sdk';
// import { api } from '@/convex/_generated/api';

// export const UserProvider = withLDProvider<any>({
//   // ✅ Replaced: import.meta.env.VITE_LD_CLIENT_SIDE_ID → process.env
//   clientSideID: process.env.NEXT_PUBLIC_LD_CLIENT_SIDE_ID ?? '',
//   options: {
//     logger: basicLogger({ level: 'error' }),
//   },
// })(UserProviderInner);

// function UserProviderInner({ children }: { children: React.ReactNode }) {
//   const launchdarkly = useLDClient();

//   // ✅ Replaced: useAuth() WorkOS → Clerk
//   // ✅ Replaced: useConvex() + useQuery() → removed
//   const { userId, getToken } = useAuth();
//   const { user } = useUser();

//   const sessionId = useConvexSessionIdOrNullOrLoading();
//   const chatId = useChatId();

//   useEffect(() => {
//     if (sessionId) {
//       setExtra('sessionId', sessionId);
//     }
//   }, [sessionId]);

//   useEffect(() => {
//     setExtra('chatId', chatId);
//   }, [chatId]);

//   // ✅ Cache Clerk token for sync use via getConvexAuthToken()
//   useEffect(() => {
//     if (!userId) return;
//     getToken().then((token) => setAuthToken(token));
//   }, [userId, getToken]);

//   // ✅ Removed: tokenValue — Convex internal state tha, ab zarurat nahi

//   useEffect(() => {
//     async function updateProfile() {
//       if (user && userId) {
//         // ✅ Replaced: convexMemberId → userId from Clerk
//         launchdarkly?.identify({
//           key: userId,
//           email: user.primaryEmailAddress?.emailAddress ?? '',
//         });
//         setUser({
//           id: userId,
//           username: user.firstName ? (user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName) : '',
//           email: user.primaryEmailAddress?.emailAddress ?? undefined,
//         });

//         try {
//           // ✅ Replaced: getConvexAuthToken(convex) → getToken() from Clerk
//           const token = await getToken();
//           if (token) {
//             setAuthToken(token);
//             // ✅ Removed: convex.action(api.sessions.updateCachedProfile) — Convex specific
//             // ✅ Kept: getConvexProfile — file exist karti hai
//             const convexProfile = await getConvexProfile(token);
//             setProfile({
//               username:
//                 convexProfile.name ??
//                 (user.firstName ? (user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName) : ''),
//               email: convexProfile.email || user.primaryEmailAddress?.emailAddress || '',
//               // ✅ Replaced: user.profilePictureUrl (WorkOS) → user.imageUrl (Clerk)
//               avatar: user.imageUrl || '',
//               id: convexProfile.id || userId,
//             });
//           }
//         } catch (error) {
//           console.error('Failed to fetch profile:', error);
//           // ✅ Replaced: WorkOS fallback → Clerk fallback
//           setProfile({
//             username: user.firstName ? (user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName) : '',
//             email: user.primaryEmailAddress?.emailAddress ?? '',
//             avatar: user.imageUrl ?? '',
//             id: userId,
//           });
//         }
//       } else {
//         launchdarkly?.identify({
//           anonymous: true,
//         });
//       }
//     }
//     void updateProfile();
//   }, [launchdarkly, user, userId, getToken]);

//   return children;
// }

'use client';

import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { setAuthToken } from '../lib/stores/sessionId';
import { setProfile } from '../lib/stores/profile';

// FIX: Removed LaunchDarkly wrapper (withLDProvider)
export function UserProvider({ children }: { children: React.ReactNode }) {
  const { userId, getToken } = useAuth();
  const { user } = useUser();

  // Cache Clerk token for other components
  useEffect(() => {
    if (!userId) return;
    getToken().then((token) => setAuthToken(token));
  }, [userId, getToken]);

  // FIX: Removed getConvexProfile. Directly syncing Clerk user data to the app's profile store.
  useEffect(() => {
    if (user && userId) {
      setProfile({
        username: user.firstName ? (user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName) : '',
        email: user.primaryEmailAddress?.emailAddress ?? '',
        avatar: user.imageUrl ?? '',
        id: userId,
      });
    }
  }, [user, userId]);

  return <>{children}</>;
}