import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Members / Users (Clerk ke saath map karne ke liye)
export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(), 
  isAdmin: boolean("is_admin").default(false), // Admin check ke liye
  apiKeyPreference: text("api_key_preference").default("quotaExhausted"),
  apiKeyValue: text("api_key_value"), 
  apiKeyOpenAI: text("api_key_openai"),
  apiKeyXAI: text("api_key_xai"),
  apiKeyGoogle: text("api_key_google"),
  username: text("username"),
  avatarUrl: text("avatar_url"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Sessions
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Chats
export const chats = pgTable(
  "chats",
  {
    id: uuid("id").primaryKey().defaultRandom(), 
    creatorId: uuid("creator_id").references(() => sessions.id, { onDelete: "cascade" }),
    urlId: text("url_id"), 
    description: text("description"),
    timestamp: timestamp("timestamp").defaultNow(),
    lastMessageRank: integer("last_message_rank"),
    lastSubchatIndex: integer("last_subchat_index").default(0),
    hasBeenDeployed: boolean("has_been_deployed").default(false),
    isDeleted: boolean("is_deleted").default(false),
    convexProjectKind: text("convex_project_kind"), 
    projectSlug: text("project_slug"),
    teamSlug: text("team_slug"),
    deploymentUrl: text("deployment_url"),
    deploymentName: text("deployment_name"),
  },
  (table) => ({
    creatorUrlIdx: uniqueIndex("creator_url_idx").on(table.creatorId, table.urlId),
  })
);

// 4. Chat Messages Storage
export const chatMessagesStorageState = pgTable("chat_messages_storage_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id").references(() => chats.id, { onDelete: "cascade" }).notNull(),
  storageUrl: text("storage_url"), 
  subchatIndex: integer("subchat_index").notNull(),
  lastMessageRank: integer("last_message_rank").notNull(),
  description: text("description"),
  partIndex: integer("part_index").notNull(),
  snapshotUrl: text("snapshot_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Shares
export const shares = pgTable("shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id").references(() => chats.id, { onDelete: "cascade" }).notNull(),
  snapshotUrl: text("snapshot_url").notNull(),
  code: text("code").notNull().unique(), 
  chatHistoryUrl: text("chat_history_url"),
  lastMessageRank: integer("last_message_rank").notNull(),
  lastSubchatIndex: integer("last_subchat_index").notNull(),
  partIndex: integer("part_index"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Social Shares
export const socialShares = pgTable("social_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id").references(() => chats.id, { onDelete: "cascade" }).notNull(),
  code: text("code").notNull().unique(),
  thumbnailImageUrl: text("thumbnail_image_url"),
  sharedStatus: text("shared_status").default("noPreferenceExpressed"), 
  allowForkFromLatest: boolean("allow_fork_from_latest").default(true),
  linkToDeployed: boolean("link_to_deployed").default(true),
  referralCode: text("referral_code"),
});

// --- RELATIONS ---
export const membersRelations = relations(members, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  member: one(members, {
    fields: [sessions.memberId],
    references: [members.id],
  }),
  chats: many(chats),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  creator: one(sessions, {
    fields: [chats.creatorId],
    references: [sessions.id],
  }),
  messagesState: many(chatMessagesStorageState),
  shares: many(shares),
  socialShares: many(socialShares),
}));