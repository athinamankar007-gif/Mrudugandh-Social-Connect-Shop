import { createInsertSchema } from "drizzle-zod";
import { jsonb, pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum("order_status", ["Pending", "Confirmed", "Dispatched", "Cancelled"]);

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  itemSnapshots: jsonb("item_snapshots").$type<unknown[]>().notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  pin: text("pin").notNull(),
  address: text("address").notNull(),
  total: integer("total").notNull(),
  status: orderStatusEnum("status").notNull().default("Pending"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ createdAt: true, updatedAt: true });
export type InsertOrder = typeof ordersTable.$inferInsert;
export type Order = typeof ordersTable.$inferSelect;