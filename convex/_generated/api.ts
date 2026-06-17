/* eslint-disable */
/**
 * API utility — Convex replaced with Next.js API routes
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
    storeHistory: '/api/chats/store-history',
  },
  usage: {
    tokens: '/api/usage/tokens',
  },
  prompts: {
    debugPrompt: '/api/prompts/debug',
  },
  share: {
    create: '/api/share/create',
    get: '/api/share/get',
  },
  thumbnails: {
    update: '/api/thumbnails/update',
  },
} as const;

export const internal = api;
export const components = {};

export type ApiRoute = string;