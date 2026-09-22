import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { db, reviewsTable } from "@workspace/db";
import { CreateReviewBody, AdminUpdateReviewBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/adminAuth";

const router: IRouter = Router();
function auth(req: any, res: any): string | null { const id = getAuth(req).userId; if (!id) res.status(401).json({ error: "Authentication required" }); return id; }

router.get("/reviews", async (req, res): Promise<void> => {
  const rows = await db.select({
    id: reviewsTable.id,
    reviewerName: reviewsTable.reviewerName,
    message: reviewsTable.message,
    imagePaths: reviewsTable.imagePaths,
    adminReply: reviewsTable.adminReply,
    createdAt: reviewsTable.createdAt,
  }).from(reviewsTable).where(eq(reviewsTable.approved, true)).orderBy(desc(reviewsTable.createdAt));
  res.json(rows);
});
router.post("/reviews", async (req, res): Promise<void> => {
  const uid = auth(req, res); if (!uid) return;
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  let name = "Customer"; let email = `${uid}@users.invalid`;
  try { const u = await clerkClient.users.getUser(uid); name = ([u.firstName, u.lastName].filter(Boolean).join(" ") || "Customer"); email = u.emailAddresses.find(a => a.id === u.primaryEmailAddressId)?.emailAddress ?? email; } catch { /* identity fallback is safe */ }
  const [review] = await db.insert(reviewsTable).values({ id: randomUUID(), userId: uid, reviewerName: name, reviewerEmail: email, message: parsed.data.message, imagePaths: parsed.data.imagePaths ?? [] }).returning();
  res.status(201).json(review);
});
router.get("/reviews/mine", async (req, res): Promise<void> => { const uid = auth(req, res); if (!uid) return; res.json(await db.select().from(reviewsTable).where(eq(reviewsTable.userId, uid)).orderBy(desc(reviewsTable.createdAt))); });
router.get("/admin/reviews", requireAdmin, async (_req, res): Promise<void> => { res.json(await db.select().from(reviewsTable).orderBy(desc(reviewsTable.createdAt))); });
router.patch("/admin/reviews/:id", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminUpdateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [review] = await db.update(reviewsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(reviewsTable.id, String(req.params.id))).returning();
  if (!review) { res.status(404).json({ error: "Review not found" }); return; } res.json(review);
});
export default router;