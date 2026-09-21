import { createInsertSchema } from "drizzle-zod";
import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const reviewsTable = pgTable("reviews", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  reviewerName: text("reviewer_name").notNull(),
  reviewerEmail: text("reviewer_email").notNull(),
  message: text("message").notNull(),
  imagePaths: jsonb("image_paths").$type<string[]>().notNull().default([]),
  adminReply: text("admin_reply"),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ createdAt: true, updatedAt: true });
export type InsertReview = typeof reviewsTable.$inferInsert;
export type Review = typeof reviewsTable.$inferSelect;