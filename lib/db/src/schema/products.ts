import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const productVariantSchema = z.object({
  label: z.string().min(1),
  price: z.number().int().min(0),
  inventory: z.number().int().min(0).default(0),
  imagePaths: z.array(z.string()).default([]),
});

export type ProductVariant = z.infer<typeof productVariantSchema>;

export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  imagePath: text("image_path"),
  imagePaths: jsonb("image_paths").$type<string[]>().notNull().default([]),
  variants: jsonb("variants").$type<ProductVariant[]>().notNull().default([]),
  inventory: integer("inventory").notNull().default(0),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;