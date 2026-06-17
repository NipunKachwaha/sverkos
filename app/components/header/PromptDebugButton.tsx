import { TextAlignLeftIcon } from '@radix-ui/react-icons';
import { Button } from '@ui/Button';
import { initialIdStore } from '../../lib/stores/chatId';
import { lazy, Suspense, useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { useIsAdmin } from '../../lib/hooks/useDebugPrompt';
import { useAuth } from '@clerk/nextjs';

// ✅ Replaced: import.meta.env.DEV → process.env.NODE_ENV
const DebugAllPromptsForChat = process.env.NODE_ENV === 'development'
  ? (await import('../../components/DebugPromptView')).default
  : lazy(() => import('../../components/DebugPromptView'));

export function PromptDebugButton() {
  // ✅ Replaced: useQuery(api.admin.isCurrentUserAdmin) → fetch
  const { getToken } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showDebugView, setShowDebugView] = useState(false);
  const chatInitialId = useStore(initialIdStore);
  const [isActivelyCheckingForAdmin, setIsActivelyCheckingForAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/admin/is-admin', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.isAdmin ?? false);
        }
      } catch {
        setIsAdmin(false);
      }
    };
    void checkAdmin();
  }, [getToken]);

  (window as any).chefAssertAdmin = () => {
    setIsActivelyCheckingForAdmin(true);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Button onClick={() => setShowDebugView(true)} variant="neutral" size="xs">
        <TextAlignLeftIcon />
      </Button>
      {showDebugView && chatInitialId && (
        <Suspense fallback={<div>Loading debug view...</div>}>
          <DebugAllPromptsForChat chatInitialId={chatInitialId} onClose={() => setShowDebugView(false)} />
        </Suspense>
      )}
      {isActivelyCheckingForAdmin && <ActivelyCheckForAdmin />}
    </>
  );
}

function ActivelyCheckForAdmin() {
  useIsAdmin();
  return null;
}