import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, siteTextsTable, contentPartnersTable, contentInitiativesTable } from "@workspace/db";
import {
  GetSiteContentResponse, SaveStoryContentBody, SaveStoryContentResponse,
  CreateContentPartnerBody, CreateContentPartnerResponse,
  SaveContentPartnerBody, SaveContentPartnerParams, SaveContentPartnerResponse,
  DeleteContentPartnerParams, CreateContentInitiativeBody, CreateContentInitiativeResponse,
  SaveContentInitiativeBody, SaveContentInitiativeParams, SaveContentInitiativeResponse,
  DeleteContentInitiativeParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/adminAuth";
import { ensureSiteContentSeeded, isContentImagePath, readSiteContent } from "../lib/siteContent";

const router: IRouter = Router();

router.get("/site-content", async (_req, res): Promise<void> => {
  res.set("Cache-Control", "no-store");
  res.json(GetSiteContentResponse.parse(await readSiteContent()));
});

router.put("/admin/content/story", requireAdmin, async (req, res): Promise<void> => {
  const parsed = SaveStoryContentBody.safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data.texts).length > 100) {
    res.status(400).json({ error: "Provide valid website text fields." }); return;
  }
  await ensureSiteContentSeeded();
  // Merge inside a locked transaction so independent text edits cannot erase
  // untouched fields. Empty strings are intentional and must be preserved.
  const saved = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(siteTextsTable).where(eq(siteTextsTable.id, "website")).for("update");
    const texts = { ...current.texts, ...parsed.data.texts };
    const [row] = await tx.update(siteTextsTable).set({ texts }).where(eq(siteTextsTable.id, "website")).returning();
    return row;
  });
  res.json(SaveStoryContentResponse.parse({ texts: saved.texts }));
});

router.post("/admin/content/partners", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateContentPartnerBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.name.trim() || (parsed.data.logoPath && !isContentImagePath(parsed.data.logoPath))) {
    res.status(400).json({ error: "Provide a name, valid group, and valid logo image." }); return;
  }
  await ensureSiteContentSeeded();
  const [row] = await db.insert(contentPartnersTable).values({ ...parsed.data, name: parsed.data.name.trim(), id: randomUUID() }).returning();
  res.status(201).json(CreateContentPartnerResponse.parse(row));
});

router.put("/admin/content/partners/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = SaveContentPartnerParams.safeParse(req.params);
  const parsed = SaveContentPartnerBody.safeParse(req.body);
  if (!params.success || !parsed.success || !parsed.data.name.trim() || (parsed.data.logoPath && !isContentImagePath(parsed.data.logoPath))) {
    res.status(400).json({ error: "Provide a valid partner and logo image." }); return;
  }
  await ensureSiteContentSeeded();
  const [row] = await db.update(contentPartnersTable).set({ ...parsed.data, name: parsed.data.name.trim() }).where(eq(contentPartnersTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Partner not found." }); return; }
  res.json(SaveContentPartnerResponse.parse(row));
});

router.delete("/admin/content/partners/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteContentPartnerParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid partner." }); return; }
  await ensureSiteContentSeeded();
  const [row] = await db.delete(contentPartnersTable).where(eq(contentPartnersTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Partner not found." }); return; }
  res.sendStatus(204);
});

router.post("/admin/content/initiatives", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateContentInitiativeBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.title.trim() || parsed.data.imagePaths.some((path) => !isContentImagePath(path))) {
    res.status(400).json({ error: "Provide a title, valid section, and valid photo paths." }); return;
  }
  await ensureSiteContentSeeded();
  const [row] = await db.insert(contentInitiativesTable).values({ ...parsed.data, title: parsed.data.title.trim(), id: randomUUID() }).returning();
  res.status(201).json(CreateContentInitiativeResponse.parse(row));
});

router.put("/admin/content/initiatives/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = SaveContentInitiativeParams.safeParse(req.params);
  const parsed = SaveContentInitiativeBody.safeParse(req.body);
  if (!params.success || !parsed.success || !parsed.data.title.trim() || parsed.data.imagePaths.some((path) => !isContentImagePath(path))) {
    res.status(400).json({ error: "Provide a valid initiative and photo paths." }); return;
  }
  await ensureSiteContentSeeded();
  const [row] = await db.update(contentInitiativesTable).set({ ...parsed.data, title: parsed.data.title.trim() }).where(eq(contentInitiativesTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Initiative not found." }); return; }
  res.json(SaveContentInitiativeResponse.parse(row));
});

router.delete("/admin/content/initiatives/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteContentInitiativeParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid initiative." }); return; }
  await ensureSiteContentSeeded();
  const [row] = await db.delete(contentInitiativesTable).where(eq(contentInitiativesTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Initiative not found." }); return; }
  res.sendStatus(204);
});

export default router;
