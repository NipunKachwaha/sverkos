import { motion, type Variants } from 'framer-motion';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@ui/ConfirmationDialog';
import { ThemeSwitch } from '../ui/ThemeSwitch';
import { type ChatHistoryItem } from '../../types/ChatHistoryItem';
import { cubicEasingFn } from '../../utils/easings';
import { logger } from '../../../lib/agent/utils/logger';
import { HistoryItem } from './HistoryItem';
import { binDates } from './date-binning';
import { useSearchFilter } from '../../lib/hooks/useSearchFilter';
import { classNames } from '../../utils/classNames';
import { getKnownInitialId } from '../../lib/stores/chatId';
import { Button } from '@ui/Button';
import { TextInput } from '@ui/TextInput';
import { Checkbox } from '@ui/Checkbox';
import { PlusIcon } from '@radix-ui/react-icons';
import { useAuth } from '@clerk/nextjs'; 

const PROVISION_HOST = process.env.NEXT_PUBLIC_PROVISION_HOST || '';

const menuVariants = {
  closed: {
    opacity: 0,
    visibility: 'hidden',
    left: '-340px',
    transition: { duration: 0.2, ease: cubicEasingFn },
  },
  open: {
    opacity: 1,
    visibility: 'initial',
    left: 0,
    transition: { duration: 0.2, ease: cubicEasingFn },
  },
} satisfies Variants;

type ModalContent = { type: 'delete'; item: ChatHistoryItem } | null;

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Menu = memo(({ isOpen, onClose }: MenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { getToken, isSignedIn } = useAuth(); 

  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [dialogContent, setDialogContent] = useState<ModalContent>(null);
  const [shouldDeleteConvexProject, setShouldDeleteConvexProject] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [convexProjectInfo, setConvexProjectInfo] = useState<any>(null);

  useEffect(() => {
    if (!isSignedIn) return;

    const fetchHistory = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch(`${PROVISION_HOST}/api/messages/getAll`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setList(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      }
    };

    fetchHistory();
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (dialogContent?.type === 'delete' && isSignedIn) {
      const fetchProjectInfo = async () => {
         try {
            const token = await getToken();
            const response = await fetch(`${PROVISION_HOST}/api/convexProjects/loadConnectedConvexProjectCredentials?chatId=${dialogContent.item.initialId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
               setConvexProjectInfo(await response.json());
            }
         } catch (e) {
            console.error('Failed to load project info:', e);
         }
      };
      fetchProjectInfo();
    }
  }, [dialogContent, isSignedIn, getToken]);

  const { filteredItems: filteredList, handleSearchChange } = useSearchFilter({
    items: list,
    searchFields: ['description'],
  });

  const deleteItem = useCallback(
    async (item: ChatHistoryItem) => {
      if (!isSignedIn) return;

      try {
        const token = await getToken();
        const response = await fetch(`${PROVISION_HOST}/api/messages/remove`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: item.id,
            teamSlug: convexProjectInfo?.teamSlug,
            projectSlug: convexProjectInfo?.projectSlug,
            shouldDeleteConvexProject: shouldDeleteConvexProject && convexProjectInfo?.kind === 'connected',
          }),
        });

        if (!response.ok) {
          toast.error('Failed to delete conversation');
          return;
        }

        if (getKnownInitialId() === item.initialId) {
          window.location.pathname = '/';
        } else {
          setList(prev => prev.filter(i => i.id !== item.id));
        }
      } catch (error) {
        toast.error('Failed to delete conversation');
        logger.error(error);
      }
    },
    [isSignedIn, getToken, convexProjectInfo, shouldDeleteConvexProject],
  );

  const closeDialog = () => {
    setDialogContent(null);
    setShouldDeleteConvexProject(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;

      if (target?.closest('[data-hamburger-menu]')) {
        return;
      }

      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleDeleteClick = useCallback((item: ChatHistoryItem) => {
    setDialogContent({ type: 'delete', item });
  }, []);

  if (!isSignedIn) {
    return null;
  }

  return (
    <>
      <motion.div
        ref={menuRef}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        variants={menuVariants}
        style={{ width: '340px' }}
        className={classNames(
          'flex flex-col side-menu fixed top-0 h-full',
          'bg-[var(--bolt-elements-sidebar-background)] border-r',
          'shadow-sm text-sm',
          'z-30',
        )}
      >
        <div className="flex h-[var(--header-height)] items-center justify-between border-b px-4"></div>

        <div className="flex size-full flex-1 flex-col overflow-hidden">
          <div className="space-y-3 p-4">
            <Button className="w-fit" href="/" icon={<PlusIcon />}>
              Start new project
            </Button>
            <div className="relative w-full">
              <TextInput
                id="search-projects"
                type="search"
                placeholder="Search projects..."
                onChange={handleSearchChange}
                aria-label="Search projects"
              />
            </div>
          </div>
          <div className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Your Projects</div>
          <div className="flex-1 overflow-auto px-3 pb-3">
            {filteredList.length === 0 && (
              <div className="px-4 text-sm text-gray-500 dark:text-gray-400">
                {list.length === 0 ? 'No previous projects' : 'No matches found'}
              </div>
            )}
            {binDates(filteredList).map(({ category, items }) => (
              <div key={category} className="mt-2 space-y-1 first:mt-0">
                <div className="sticky top-0 z-10 bg-[var(--bolt-elements-sidebar-background)] px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {category}
                </div>
                <div className="space-y-0.5 pr-1">
                  {items.map((item) => (
                    <HistoryItem key={item.initialId} item={item} handleDeleteClick={handleDeleteClick} />
                  ))}
                </div>
              </div>
            ))}
            {dialogContent?.type === 'delete' && (
              <ConfirmationDialog
                onClose={closeDialog}
                confirmText={'Delete'}
                onConfirm={() => {
                  if (dialogContent?.type === 'delete') {
                    deleteItem(dialogContent.item);
                  }
                  closeDialog();
                  return Promise.resolve();
                }}
                dialogTitle="Delete Chat"
                validationText={dialogContent?.item.description || 'New chat...'}
                dialogBody={
                  <>
                    <p>
                      You are about to delete{' '}
                      <span className="font-medium text-content-primary">
                        {dialogContent?.item.description || 'New chat...'}
                      </span>
                    </p>
                    {convexProjectInfo?.kind === 'connected' && (
                      <div className="mt-4 flex items-center gap-2">
                        <Checkbox
                          id="delete-convex-project"
                          checked={shouldDeleteConvexProject}
                          onChange={() => setShouldDeleteConvexProject(!shouldDeleteConvexProject)}
                        />

                        <label htmlFor="delete-convex-project" className="text-pretty text-content-secondary">
                          Also delete the associated Convex project (
                          <a
                            href={`https://dashboard.convex.dev/p/${convexProjectInfo.projectSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-content-link hover:underline"
                          >
                            {convexProjectInfo.projectSlug}
                          </a>
                          )
                        </label>
                      </div>
                    )}
                  </>
                }
              />
            )}
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
            <ThemeSwitch />
          </div>
        </div>
      </motion.div>
    </>
  );
});

Menu.displayName = 'Menu';