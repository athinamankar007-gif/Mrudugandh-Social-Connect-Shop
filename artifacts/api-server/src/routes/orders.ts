import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Router, type IRouter, type Request } from "express";
import { getAuth } from "@clerk/express";
import { db, ordersTable, productsTable, type OrderItem } from "@workspace/db";
import { CreateOrderBody, CancelOrderBody, AdminUpdateOrderBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/adminAuth";

const router: IRouter = Router();
function userId(req: Request): string | null {
  const auth = getAuth(req);
  return auth.sessionClaims?.userId as string | undefined ?? auth.userId;
}
function requireUser(req: any, res: any): string | null {
  const id = userId(req);
  if (!id) res.status(401).json({ error: "Authentication required" });
  return id;
}

router.post("/orders", async (req, res): Promise<void> => {
  const uid = requireUser(req, res);
  if (!uid) return;
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const productIds = [...new Set(parsed.data.items.map((item) => item.productId))];
  const products = await db.select().from(productsTable).where(inArray(productsTable.id, productIds));
  const productMap = new Map(products.map((product) => [product.id, product]));
  const itemSnapshots: OrderItem[] = [];
  for (const requestedItem of parsed.data.items) {
    const product = productMap.get(requestedItem.productId);
    if (!product || !product.available) {
      res.status(400).json({ error: "One or more products are unavailable" });
      return;
    }
    const variant = requestedItem.variant
      ? product.variants.find((entry) => entry.label === requestedItem.variant)
      : undefined;
    if (requestedItem.variant && !variant) {
      res.status(400).json({ error: "One or more product variants are invalid" });
      return;
    }
    itemSnapshots.push({
      productId: product.id,
      name: product.name,
      variant: variant?.label ?? null,
      quantity: requestedItem.quantity,
      price: variant?.price ?? product.price,
    });
  }
  const subtotal = itemSnapshots.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 2999 ? 0 : 100;
  const id = randomUUID();
  const [order] = await db.insert(ordersTable).values({
    id,
    number: `MRD-${id.replaceAll("-", "").slice(0, 7).toUpperCase()}`,
    userId: uid,
    itemSnapshots,
    fullName: parsed.data.fullName, phone: parsed.data.phone, pin: parsed.data.pin,
    address: parsed.data.address, subtotal, shipping, total: subtotal + shipping,
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