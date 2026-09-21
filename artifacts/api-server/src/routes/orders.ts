import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter, type Request } from "express";
import { getAuth } from "@clerk/express";
import { db, ordersTable } from "@workspace/db";
import { CreateOrderBody, CancelOrderBody, AdminUpdateOrderBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/adminAuth";

const router: IRouter = Router();
const statuses = ["Pending", "Confirmed", "Dispatched", "Cancelled"] as const;

function userId(req: Request): string | null {
  return getAuth(req).userId;
}
function requireUser(req: any, res: any): string | null {
  const id = userId(req);
  if (!id) res.status(401).json({ error: "Authentication required" });
  return id;
}

router.post("/orders", async (req, res): Promise<void> => {
  const uid = requireUser(req, res);
  if (!uid) return;
  const parsed = CreateOrderBody.safeParse({ ...req.body, itemSnapshots: req.body.itemSnapshots ?? req.body.items });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [order] = await db.insert(ordersTable).values({
    id: randomUUID(), userId: uid, itemSnapshots: parsed.data.itemSnapshots,
    fullName: parsed.data.fullName, phone: parsed.data.phone, pin: parsed.data.pin,
    address: parsed.data.address, total: parsed.data.total,
  }).returning();
  res.status(201).json(order);
});

router.get("/orders", async (req, res): Promise<void> => {
  const uid = requireUser(req, res);
  if (!uid) return;
  res.json(await db.select().from(ordersTable).where(eq(ordersTable.userId, uid)).orderBy(desc(ordersTable.createdAt)));
});

router.post("/orders/:id/cancel", async (req, res): Promise<void> => {
  const uid = requireUser(req, res);
  if (!uid) return;
  const reason = CancelOrderBody.safeParse(req.body);
  if (!reason.success) { res.status(400).json({ error: "cancellationReason is required" }); return; }
  const [order] = await db.update(ordersTable)
    .set({ status: "Cancelled", cancellationReason: reason.data.cancellationReason, updatedAt: new Date() })
    .where(and(eq(ordersTable.id, req.params.id), eq(ordersTable.userId, uid), eq(ordersTable.status, "Pending"))).returning();
  if (!order) { res.status(404).json({ error: "Pending order not found" }); return; }
  res.json(order);
});

router.get("/admin/orders", requireAdmin, async (_req, res): Promise<void> => {
  res.json(await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)));
});

router.patch("/admin/orders/:id", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminUpdateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  if (parsed.data.status === "Cancelled" && parsed.data.cancellationReason === undefined) {
    res.status(400).json({ error: "cancellationReason is required when cancelling" }); return;
  }
  const [order] = await db.update(ordersTable).set({
    status: parsed.data.status, ...(parsed.data.cancellationReason !== undefined ? { cancellationReason: parsed.data.cancellationReason } : {}),
    updatedAt: new Date(),
  }).where(eq(ordersTable.id, String(req.params.id))).returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json(order);
});

export default router;