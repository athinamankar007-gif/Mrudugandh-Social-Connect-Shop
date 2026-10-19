import express from "express";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown> & { id: string };
type Condition = { key: string; value: string };
const { rows, tables, fakeDb } = vi.hoisted(() => {
  const tables = {
    texts: { name: "texts", id: "id" },
    partners: { name: "partners", id: "id", sortOrder: "sortOrder" },
    initiatives: { name: "initiatives", id: "id", sortOrder: "sortOrder" },
  };
  const rows = new Map<string, Map<string, Row>>();
  type Table = { name: string };
  const records = (table: Table) => {
    if (!rows.has(table.name)) rows.set(table.name, new Map());
    return rows.get(table.name)!;
  };
  const fakeDb = {
    transaction: async <T>(fn: (db: unknown) => Promise<T>): Promise<T> => fn(fakeDb),
    insert: (table: Table) => ({
      values: (values: Row | Row[]) => {
        const insert = (ignore: boolean) => {
          const saved: Row[] = [];
          for (const row of Array.isArray(values) ? values : [values]) {
            if (ignore && records(table).has(row.id)) continue;
            records(table).set(row.id, structuredClone(row));
            saved.push(structuredClone(row));
          }
          return saved;
        };
        return {
          returning: async () => insert(false),
          onConflictDoNothing: () => {
            const saved = insert(true);
            return { then: (resolve: (value: Row[]) => unknown) => Promise.resolve(saved).then(resolve), returning: async () => saved };
          },
        };
      },
    }),
    select: () => ({
      from: (table: Table) => {
        const result = (condition?: Condition) => [...records(table).values()].filter((row) => !condition || row[condition.key] === condition.value).map((row) => structuredClone(row));
        return {
          where: (condition: Condition) => ({ then: (resolve: (value: Row[]) => unknown) => Promise.resolve(result(condition)).then(resolve), for: async () => result(condition) }),
          orderBy: async () => result().sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder)),
        };
      },
    }),
    update: (table: Table) => ({
      set: (changes: Partial<Row>) => ({
        where: (condition: Condition) => ({
          returning: async () => {
            const row = [...records(table).values()].find((item) => item[condition.key] === condition.value);
            if (!row) return [];
            const updated = { ...row, ...changes };
            records(table).set(row.id, updated);
            return [structuredClone(updated)];
          },
        }),
      }),
    }),
    delete: (table: Table) => ({
      where: (condition: Condition) => ({
        returning: async () => {
          const row = [...records(table).values()].find((item) => item[condition.key] === condition.value);
          if (!row) return [];
          records(table).delete(row.id);
          return [row];
        },
      }),
    }),
  };
  return { rows, tables, fakeDb };
});

vi.mock("@workspace/db", () => ({
  db: fakeDb, siteTextsTable: tables.texts, contentPartnersTable: tables.partners, contentInitiativesTable: tables.initiatives,
}));
vi.mock("drizzle-orm", () => ({
  eq: (key: string, value: string) => ({ key, value }),
  asc: (key: string) => key,
}));
vi.mock("../src/middlewares/adminAuth", () => ({
  requireAdmin: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const role = req.header("x-test-role");
    if (role === "admin") next();
    else res.status(role ? 403 : 401).json({ error: "Admin access required" });
  },
}));

import contentRouter from "../src/routes/siteContent";
let server: ReturnType<express.Express["listen"]>;
let baseUrl = "";
async function request(path: string, method = "GET", body?: unknown, role: string | null = "admin") {
  return fetch(`${baseUrl}${path}`, {
    method, headers: { "Content-Type": "application/json", ...(role ? { "x-test-role": role } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
const initiative = { title: "Test community event", eyebrow: "Community", body: "First paragraph", section: "student", imagePaths: ["asset:student-work"], sortOrder: 20 };
const partner = { name: "Test partner", group: "corporate", logoPath: "", sortOrder: 30 };

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api", contentRouter);
  server = app.listen(0);
  await new Promise<void>((resolve) => server.on("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No test listener");
  baseUrl = `http://127.0.0.1:${address.port}/api`;
});
afterAll(async () => { await new Promise<void>((resolve) => server.close(() => resolve())); });

describe("website CMS", () => {
  it("publishes seeded content and exact Marathi copy without authentication", async () => {
    const response = await request("/site-content", "GET", undefined, null);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const content = await response.json();
    expect(content.story.texts.aboutParagraphMr).toContain("ही केवळ एक बाजारपेठ नाही");
    expect(content.initiatives.find((item: Row) => item.id === "corporate-csr").imagePaths).toHaveLength(3);
    expect(content.initiatives.find((item: Row) => item.id === "student-community").imagePaths).toContain("asset:student-new-stall");
    expect(content.initiatives.find((item: Row) => item.id === "donation-drives").imagePaths).toContain("asset:donation-clothes");
    expect(content.partners.length).toBeGreaterThan(0);
  });

  it.each([
    ["PUT", "/admin/content/story", { texts: { tagline: "Not allowed" } }],
    ["POST", "/admin/content/partners", partner],
    ["PUT", "/admin/content/partners/corporate-0", partner],
    ["DELETE", "/admin/content/partners/corporate-0", undefined],
    ["POST", "/admin/content/initiatives", initiative],
    ["PUT", "/admin/content/initiatives/corporate-csr", initiative],
    ["DELETE", "/admin/content/initiatives/corporate-csr", undefined],
  ])("protects %s %s from anonymous and non-admin visitors", async (method, path, body) => {
    expect((await request(path, method, body, null)).status).toBe(401);
    expect((await request(path, method, body, "customer")).status).toBe(403);
  });

  it("updates text, preserves untouched fields, and allows intentional empty paragraphs", async () => {
    const saved = await request("/admin/content/story", "PUT", { texts: { tagline: "Saved tagline", aboutParagraphEn: "" } });
    expect(saved.status).toBe(200);
    const content = await (await request("/site-content")).json();
    expect(content.story.texts.tagline).toBe("Saved tagline");
    expect(content.story.texts.aboutParagraphEn).toBe("");
    expect(content.story.texts.aboutParagraphMr).toContain("मृदुगंध");
  });

  it("adds, edits, removes a partner and clears its logo persistently", async () => {
    const created = await request("/admin/content/partners", "POST", { ...partner, logoPath: "/objects/uploads/test-logo" });
    expect(created.status).toBe(201);
    const { id } = await created.json();
    expect((await request(`/admin/content/partners/${id}`, "PUT", { ...partner, name: "Renamed partner", logoPath: "" })).status).toBe(200);
    let content = await (await request("/site-content")).json();
    expect(content.partners.find((item: Row) => item.id === id)).toMatchObject({ name: "Renamed partner", logoPath: "" });
    expect((await request(`/admin/content/partners/${id}`, "DELETE")).status).toBe(204);
    content = await (await request("/site-content")).json();
    expect(content.partners.some((item: Row) => item.id === id)).toBe(false);
    expect((await request(`/admin/content/partners/${id}`, "DELETE")).status).toBe(404);
  });

  it("adds, edits, removes an initiative and supports clearing every photo", async () => {
    const created = await request("/admin/content/initiatives", "POST", initiative);
    expect(created.status).toBe(201);
    const { id } = await created.json();
    expect((await request(`/admin/content/initiatives/${id}`, "PUT", { ...initiative, body: "", imagePaths: [] })).status).toBe(200);
    let content = await (await request("/site-content")).json();
    expect(content.initiatives.find((item: Row) => item.id === id)).toMatchObject({ body: "", imagePaths: [] });
    expect((await request(`/admin/content/initiatives/${id}`, "DELETE")).status).toBe(204);
    content = await (await request("/site-content")).json();
    expect(content.initiatives.some((item: Row) => item.id === id)).toBe(false);
  });

  it("rejects invalid fields, whitespace-only titles, and unsafe image paths", async () => {
    expect((await request("/admin/content/partners", "POST", { ...partner, name: "  " })).status).toBe(400);
    expect((await request("/admin/content/partners", "POST", { ...partner, logoPath: "javascript:alert(1)" })).status).toBe(400);
    expect((await request("/admin/content/initiatives", "POST", { ...initiative, section: "invalid" })).status).toBe(400);
    expect((await request("/admin/content/initiatives", "POST", { ...initiative, imagePaths: ["/objects/../secret"] })).status).toBe(400);
    expect((await request("/admin/content/initiatives", "POST", { ...initiative, sortOrder: -1 })).status).toBe(400);
  });

  it("does not restore deleted seed records when initialized again after restart", async () => {
    expect((await request("/admin/content/partners/corporate-0", "DELETE")).status).toBe(204);
    vi.resetModules();
    const { ensureSiteContentSeeded } = await import("../src/lib/siteContent");
    await ensureSiteContentSeeded();
    expect(rows.get(tables.partners.name)?.has("corporate-0")).toBe(false);
  });
});
