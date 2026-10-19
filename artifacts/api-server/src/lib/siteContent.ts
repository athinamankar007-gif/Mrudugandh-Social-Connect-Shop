import { db, siteTextsTable, contentPartnersTable, contentInitiativesTable } from "@workspace/db";
import { asc, eq } from "drizzle-orm";
import { defaultInitiatives, defaultPartners, defaultStoryTexts } from "./siteContentDefaults";

let seedPromise: Promise<void> | null = null;

export function ensureSiteContentSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = db.transaction(async (tx) => {
      const inserted = await tx.insert(siteTextsTable).values({ id: "website", texts: defaultStoryTexts })
        .onConflictDoNothing().returning({ id: siteTextsTable.id });
      // The singleton row is the seed marker. An intentionally deleted last item
      // must remain deleted on the next request or server restart.
      if (inserted.length) {
        await tx.insert(contentPartnersTable).values(defaultPartners).onConflictDoNothing();
        await tx.insert(contentInitiativesTable).values(defaultInitiatives).onConflictDoNothing();
      }
    }).catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

export async function readSiteContent() {
  await ensureSiteContentSeeded();
  const [[story], partners, initiatives] = await Promise.all([
    db.select().from(siteTextsTable).where(eq(siteTextsTable.id, "website")),
    db.select().from(contentPartnersTable).orderBy(asc(contentPartnersTable.sortOrder), asc(contentPartnersTable.id)),
    db.select().from(contentInitiativesTable).orderBy(asc(contentInitiativesTable.sortOrder), asc(contentInitiativesTable.id)),
  ]);
  if (!story) throw new Error("Website content is missing");
  return { story: { texts: story.texts }, partners, initiatives };
}

const assetKeys = new Set([
  "sewing", "exhibition", "product-work", "gullak-workshop", "gullak-display",
  "gullak-painting", "student-stall-one", "student-stall-two", "student-work",
  "student-community", "student-new-stall", "donation-clothes", "tanabana-vehicle",
]);

export function isContentImagePath(path: string): boolean {
  if (path.startsWith("asset:")) return assetKeys.has(path.slice(6));
  if (/^\/(?:objects|public-objects)\/[A-Za-z0-9/_.,%-]+$/.test(path)) return !path.includes("..");
  if (/^\/api\/storage\/(?:objects|public-objects)\/[A-Za-z0-9/_.,%-]+$/.test(path)) return !path.includes("..");
  try {
    const url = new URL(path);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
