/* eslint-disable */
/**
 * API endpoint dictionary
 * Centralized mapping for all Next.js REST API routes
 */

export const api = {
  apiKeys: {
    apiKeyForCurrentMember: '/api/api-keys/current',
  },
  messages: {
    rewindChat: '/api/messages/rewind',
  },
  sessions: {
    verifySession: '/api/sessions/verify',
    startSession: '/api/sessions/start',
  },
  subchats: {
    create: '/api/subchats/create',
  },
  chats: {
    get: '/api/chats/get',
    list: '/api/chats/list',
    create: '/api/chats/create',
    update: '/api/chats/update',
  },
} as const;

export type ApiRoute = string;