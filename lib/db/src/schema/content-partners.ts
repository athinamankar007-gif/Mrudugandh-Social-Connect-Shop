import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contentPartnersTable = pgTable("content_partners", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  group: text("group").notNull(),
  logoPath: text("logo_path").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});
export const insertContentPartnerSchema = createInsertSchema(contentPartnersTable);
export type InsertContentPartner = z.infer<typeof insertContentPartnerSchema>;
export type ContentPartnerRow = typeof contentPartnersTable.$inferSelect;
