'use client';

import { Sheet } from '@ui/Sheet';
import type { Message } from 'ai';
import React, { type ReactNode, type RefCallback, useCallback, useEffect, useMemo, useState } from 'react';
import Landing from '../landing/Landing';
import { Workbench } from '../workbench/Workbench.client';
import type { ToolStatus } from '../../lib/common/types';
import type { TerminalInitializationOptions } from '../../types/terminal';
import type { ModelSelection } from '../../utils/constants';
import { MessageInput } from './MessageInput';
import { useChatId } from '../../lib/stores/chatId';
import { messageInputStore } from '../../lib/stores/messageInput';
import type { ActionAlert } from '../../types/actions';
import { classNames } from '../../utils/classNames';
import styles from './BaseChat.module.css';
import ChatAlert from './ChatAlert';
import { Messages } from './Messages.client';
import StreamingIndicator from './StreamingIndicator';
import { SuggestionButtons } from './SuggestionButtons';
import { useLaunchDarkly } from '../../lib/hooks/useLaunchDarkly';
import { CompatibilityWarnings } from '../CompatibilityWarnings.client';
import { chooseExperience } from '../../utils/experienceChooser';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { SubchatBar } from './SubchatBar';
import { SubchatLimitNudge } from './SubchatLimitNudge';
import { useAuth } from '@clerk/nextjs';
import { subchatIndexStore, useIsSubchatLoaded } from '../../lib/stores/subchats';

interface BaseChatProps {
  messageRef: RefCallback<HTMLDivElement> | undefined;
  scrollRef: RefCallback<HTMLDivElement> | undefined;
  showChat: boolean;
  chatStarted: boolean;
  description: string | undefined;
  onStop: () => void;
  onSend: (messageInput: string) => Promise<void>;
  sendMessageInProgress: boolean;
  streamStatus: 'streaming' | 'submitted' | 'ready' | 'error';
  currentError: Error | undefined;
  toolStatus: ToolStatus;
  messages: Message[];
  terminalInitializationOptions: TerminalInitializationOptions | undefined;
  disableChatMessage: ReactNode | string | null;
  modelSelection: ModelSelection;
  setModelSelection: (modelSelection: ModelSelection) => void;
  actionAlert: ActionAlert | undefined;
  clearAlert: () => void;
  onRewindToMessage?: (subchatIndex?: number, messageIndex?: number) => void;
  currentSubchatIndex?: number;
  totalSubchats?: number;
  subchats?: { subchatIndex: number; updatedAt: number; description?: string }[];
}

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      messageRef,
      scrollRef,
      showChat = true,
      chatStarted = false,
      streamStatus = 'ready',
      currentError,
      onSend,
      onStop,
      sendMessageInProgress,
      messages,
      actionAlert,
      clearAlert,
      toolStatus,
      terminalInitializationOptions,
      disableChatMessage,
      modelSelection,
      setModelSelection,
      onRewindToMessage,
      subchats,
    },
    ref,
  ) => {
    const { maintenanceMode } = useLaunchDarkly();

    const isStreaming = streamStatus === 'streaming' || streamStatus === 'submitted';
    // FIX: SSR safety ke liye by default chat enabled true set kiya hai
    const [chatEnabled, setChatEnabled] = useState(true);
    const currentSubchatIndex = useStore(subchatIndexStore) ?? 0;
    const { newChatFeature, minMessagesForNudge } = useLaunchDarkly();
    const shouldShowNudge = newChatFeature && messages.length > minMessagesForNudge;

    // ✅ Replaced: useConvexSessionIdOrNullOrLoading() → Clerk
    const { userId: sessionId, getToken } = useAuth();

    // ✅ Replaced: useMutation(api.subchats.create) → fetch
    const createSubchat = useCallback(async (args: { chatId: string; sessionId: string }) => {
      const token = await getToken();
      const res = await fetch('/api/subchats/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(args),
      });
      return res.json();
    }, [getToken]);

    const isSubchatLoaded = useIsSubchatLoaded();

    // FIX: window aur navigator ko client side par evaluate karne ke liye
    useEffect(() => {
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
        const recommendedExperience = chooseExperience(navigator.userAgent, window.crossOriginIsolated);
        const hasDismissedMobileWarning = localStorage.getItem('hasDismissedMobileWarning') === 'true';

        if (recommendedExperience !== 'the-real-thing' && !hasDismissedMobileWarning) {
          setChatEnabled(false);
        } else {
          setChatEnabled(true);
        }
      }
    }, []);

    const chatId = useChatId();

    const [dataForEvals, setDataForEvals] = useState("");

    useEffect(() => {
      if (typeof window !== 'undefined') {
        setDataForEvals(JSON.stringify({
          chatId,
          sessionId,
          appUrl: window.location.origin,
        }));
      }
    }, [chatId, sessionId]);

    const handleCreateSubchat = useCallback(async () => {
      if (!sessionId) return;
      const subchatIndex = await createSubchat({ chatId, sessionId });
      subchatIndexStore.set(subchatIndex);
      messageInputStore.set('');
    }, [createSubchat, chatId, sessionId]);

    const lastUserMessage = messages.findLast((message) => message.role === 'user');
    const resendMessage = useCallback(async () => {
      if (lastUserMessage) {
        await onSend?.(lastUserMessage.content);
      }
    }, [lastUserMessage, onSend]);

    const baseChat = (
      <div
        ref={ref}
        className={classNames(styles.BaseChat, 'relative flex h-full w-full overflow-hidden')}
        data-chat-visible={showChat}
        data-messages-for-evals={dataForEvals}
      >
        <div ref={scrollRef} className="flex size-full flex-col overflow-y-auto">
          <div className="flex w-full grow flex-col lg:flex-row">
            <div
              className={classNames(styles.Chat, 'flex flex-col flex-grow lg:min-w-[var(--chat-min-width)] h-full', {
                'items-center px-4 sm:px-8 lg:px-12': !chatStarted,
                'pt-4': chatStarted,
              })}
            >
              {!chatStarted && (
                <div id="intro" className="mx-auto mb-8 mt-12 max-w-chat px-4 text-center md:mt-16 lg:px-0">
                  <h1 className="mb-2 animate-fadeInFromLoading font-display text-4xl font-black leading-none tracking-tight text-content-primary md:text-5xl lg:mb-4 lg:text-6xl">
                    {/* ✅ Replaced: "Now you're cooking" → your brand */}
                    What will you build today?
                  </h1>
                  <p className="animate-fadeInFromLoading text-balance font-display text-lg font-medium text-content-secondary [animation-delay:200ms] [animation-fill-mode:backwards] md:text-xl">
                    {/* ✅ Replaced: "powered by Convex" → your brand */}
                    The AI-powered full-stack app builder
                  </p>
                </div>
              )}
              <div
                className={classNames('w-full', {
                  'h-full flex flex-col': chatStarted,
                  'max-w-7xl': !chatEnabled,
                })}
                ref={scrollRef}
              >
                {chatStarted ? (
                  <>
                    {newChatFeature && (
                      <SubchatBar
                        subchats={subchats}
                        currentSubchatIndex={currentSubchatIndex}
                        isStreaming={isStreaming}
                        disableChatMessage={disableChatMessage !== null || messages.length === 0}
                        sessionId={sessionId ?? null}
                        onRewind={onRewindToMessage}
                        handleCreateSubchat={handleCreateSubchat}
                        isSubchatLoaded={isSubchatLoaded}
                      />
                    )}

                    {isSubchatLoaded && (
                      <AnimatePresence>
                        <motion.div
                          key="messages"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="mx-auto flex w-full max-w-chat flex-1 flex-col"
                        >
                          <Messages
                            ref={messageRef}
                            className="z-[1] mx-auto flex w-full max-w-chat flex-1 flex-col gap-4 pb-6"
                            messages={messages}
                            isStreaming={isStreaming}
                            onRewindToMessage={onRewindToMessage}
                            subchatsLength={subchats?.length}
                          />
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </>
                ) : null}
                <div
                  className={classNames('flex flex-col w-full max-w-chat mx-auto z-prompt relative', {
                    'sticky bottom-four': chatStarted,
                  })}
                >
                  {actionAlert && (
                    <div className="mb-4 bg-background-secondary">
                      <ChatAlert
                        alert={
                          actionAlert ?? {
                            type: 'ExceededQuota',
                            title: 'Error',
                            description: 'Error',
                            content: 'Error',
                            source: 'terminal',
                          }
                        }
                        clearAlert={() => clearAlert?.()}
                        postMessage={(message) => {
                          onSend?.(message);
                          clearAlert?.();
                        }}
                      />
                    </div>
                  )}
                  {chatEnabled && (!subchats || (currentSubchatIndex >= subchats.length - 1 && isSubchatLoaded)) && (
                    <>
                      {shouldShowNudge && sessionId && (
                        <div className="mb-4">
                          <SubchatLimitNudge
                            sessionId={sessionId}
                            chatId={chatId}
                            messageCount={messages.length}
                            handleCreateSubchat={handleCreateSubchat}
                          />
                        </div>
                      )}

                      {!disableChatMessage && !shouldShowNudge && (
                        <StreamingIndicator
                          streamStatus={streamStatus}
                          numMessages={messages?.length ?? 0}
                          numSubchats={subchats?.length ?? 1}
                          toolStatus={toolStatus}
                          currentError={currentError}
                          resendMessage={resendMessage}
                          modelSelection={modelSelection}
                        />
                      )}

                      {!shouldShowNudge && (
                        <MessageInput
                          chatStarted={chatStarted}
                          isStreaming={isStreaming}
                          sendMessageInProgress={sendMessageInProgress}
                          disabled={disableChatMessage !== null || maintenanceMode}
                          modelSelection={modelSelection}
                          setModelSelection={setModelSelection}
                          onStop={onStop}
                          onSend={onSend}
                          numMessages={messages?.length}
                        />
                      )}
                    </>
                  )}
                  <AnimatePresence>
                    {disableChatMessage && (
                      <motion.div
                        initial={{ translateY: '-100%', opacity: 0 }}
                        animate={{ translateY: '0%', opacity: 1 }}
                        exit={{ translateY: '-100%', opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Sheet
                          className="-mt-2 flex w-full animate-fadeInFromLoading flex-col gap-3 rounded-xl rounded-t-none bg-util-accent/10 p-4 shadow backdrop-blur-lg"
                          padding={false}
                        >
                          {disableChatMessage}
                        </Sheet>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {!chatEnabled && <CompatibilityWarnings setEnabled={setChatEnabled} />}
              </div>
              {maintenanceMode && (
                <div className="mx-auto my-4 max-w-chat">
                  <div className="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 dark:border-red-600 dark:bg-red-900 dark:text-red-200">
                    {/* ✅ Replaced: "Chef is temporarily unavailable" → your brand */}
                    <p className="font-bold">Sverkos is temporarily unavailable</p>
                    <p className="text-sm">
                      We&apos;re experiencing high load and will be back soon. Thank you for your patience.
                    </p>
                  </div>
                </div>
              )}
              {chatEnabled && (
                <SuggestionButtons
                  disabled={disableChatMessage !== null}
                  chatStarted={chatStarted}
                  onSuggestionClick={(suggestion) => {
                    messageInputStore.set(suggestion);
                  }}
                />
              )}
              {!chatStarted && <Landing />}
            </div>
            <Workbench
              chatStarted={chatStarted}
              isStreaming={isStreaming}
              terminalInitializationOptions={terminalInitializationOptions}
            />
          </div>
          {!chatStarted && (
            // ✅ Replaced: Convex + Bolt logos → your brand footer
            <footer
              id="footer"
              className="flex w-full flex-col justify-between gap-2 p-4 transition-opacity sm:flex-row"
            >
              <div className="flex items-end">
                <p className="font-display text-sm font-medium text-content-tertiary">
                  Built with ❤️ by Sverkos
                </p>
              </div>
            </footer>
          )}
        </div>
      </div>
    );

    return baseChat;
  },
);
BaseChat.displayName = 'BaseChat';