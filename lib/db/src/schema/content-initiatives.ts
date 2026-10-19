import { integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contentInitiativesTable = pgTable("content_initiatives", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  eyebrow: text("eyebrow").notNull().default(""),
  body: text("body").notNull(),
  section: text("section").notNull(),
  imagePaths: jsonb("image_paths").$type<string[]>().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
});
export const insertContentInitiativeSchema = createInsertSchema(contentInitiativesTable);
export type InsertContentInitiative = z.infer<typeof insertContentInitiativeSchema>;
export type ContentInitiativeRow = typeof contentInitiativesTable.$inferSelect;
