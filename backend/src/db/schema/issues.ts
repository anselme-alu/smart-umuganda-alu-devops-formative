import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { locations } from "./locations";

export const issueTypeEnum = pgEnum("issue_type", [
  "bad_citizen",
  "umuganda_absence",
  "other",
]);

export const issueStatusEnum = pgEnum("issue_status", [
  "pending",
  "reviewed",
  "reported_to_police",
  "closed",
]);

export const issues = pgTable("issues", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: issueTypeEnum("type").notNull(),
  status: issueStatusEnum("status").default("pending").notNull(),
  reportedBy: uuid("reported_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  locationId: uuid("location_id").references(() => locations.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const issueReplies = pgTable("issue_replies", {
  id: uuid("id").defaultRandom().primaryKey(),
  issueId: uuid("issue_id")
    .notNull()
    .references(() => issues.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type IssueReply = typeof issueReplies.$inferSelect;
export type NewIssueReply = typeof issueReplies.$inferInsert;
