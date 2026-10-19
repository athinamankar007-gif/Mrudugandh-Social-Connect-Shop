import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteTextsTable = pgTable("site_texts", {
  id: text("id").primaryKey(),
  texts: jsonb("texts").$type<Record<string, string>>().notNull(),
});
export const insertSiteTextsSchema = createInsertSchema(siteTextsTable);
export type InsertSiteTexts = z.infer<typeof insertSiteTextsSchema>;
export type SiteTexts = typeof siteTextsTable.$inferSelect;
