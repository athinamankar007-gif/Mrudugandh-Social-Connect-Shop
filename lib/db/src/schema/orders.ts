import { createInsertSchema } from "drizzle-zod";
import { jsonb, pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const orderStatusEnum = pgEnum("order_status", ["Pending", "Confirmed", "Dispatched", "Cancelled"]);

export const orderItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  variant: z.string().nullable(),
  quantity: z.number().int().positive(),
  price: z.number().int().min(0),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  number: text("number").notNull().unique(),
  userId: text("user_id").notNull(),
  itemSnapshots: jsonb("item_snapshots").$type<OrderItem[]>().notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  pin: text("pin").notNull(),
  address: text("address").notNull(),
  subtotal: integer("subtotal").notNull(),
  shipping: integer("shipping").notNull(),
  total: integer("total").notNull(),
  status: orderStatusEnum("status").notNull().default("Pending"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;