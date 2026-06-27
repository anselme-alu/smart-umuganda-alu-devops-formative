import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { pgTable, uuid, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const locationTypeEnum = pgEnum("location_type", [
  "province",
  "district",
  "sector",
  "cell",
  "village",
]);

export const locations = pgTable("locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: locationTypeEnum("type").notNull(),
  parentId: uuid("parent_id").references((): AnyPgColumn => locations.id, {
    onDelete: "restrict",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
