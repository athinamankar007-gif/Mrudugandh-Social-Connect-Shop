import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, any>;
const state = vi.hoisted(() => ({
  rows: { orders: [] as Row[], reviews: [] as Row[], products: [] as Row[] },
  tables: {
    orders: { id: "id", userId: "userId", status: "status", approved: "approved", createdAt: "createdAt" },
    reviews: { id: "id", userId: "userId", approved: "approved", createdAt: "createdAt" },
    products: { id: "id" },
  },
}));

vi.mock("@clerk/express", () => ({
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
  getAuth: (req: any) => ({ userId: req.header("x-test-user-id") ?? null }),
  clerkClient: { users: { getUser: vi.fn(async (id: string) => ({ firstName: id, lastName: "Customer", emailAddresses: [{ id: "primary", emailAddress: id === "user_admin" ? "admin@example.com" : `${id}@example.com` }], primaryEmailAddressId: "primary" })) } },
}));
vi.mock("drizzle-orm", () => ({
  eq: (column: string, value: any) => ({ column, value }),
  and: (...conditions: any[]) => conditions,
  or: (...conditions: any[]) => ({ or: conditions }),
  desc: (column: string) => ({ column }),
  inArray: (column: string, values: any[]) => ({ column, values }),
}));
vi.mock("@workspace/db", () => {
  const match = (row: Row, condition: any): boolean => {
    if (Array.isArray(condition)) return condition.every((c) => match(row, c));
    if (condition?.or) return condition.or.some((c: any) => match(row, c));
    return !condition || (condition.values ? condition.values.includes(row[condition.column]) : row[condition.column] === condition.value);
  };
  const table = (name: "orders" | "reviews" | "products") => state.tables[name];
  const rows = (name: "orders" | "reviews" | "products") => state.rows[name];
  return {
    ordersTable: table("orders"), reviewsTable: table("reviews"), productsTable: table("products"),
    db: {
      insert: () => {
        let values: any;
        return { values(v: any) { values = v; return this; }, returning: async () => { const list = Array.isArray(values) ? values : [values]; const target = values.userId !== undefined && values.message === undefined ? rows("orders") : rows("reviews"); for (const item of list) { if (target === rows("orders")) item.status ??= "Pending"; else { item.approved ??= false; item.adminReply ??= null; } } target.push(...list); return list; } };
      },
      select: () => ({ from: (t: any) => {
        const name = t === state.tables.orders ? "orders" : t === state.tables.products ? "products" : "reviews";
        let condition: any;
        const filtered = () => rows(name).filter((r) => match(r, condition));
        return {
          where(c: any) { condition = c; return this; },
          orderBy: async () => filtered(),
          then: (resolve: any) => Promise.resolve(filtered()).then(resolve),
        };
      }}),
      update: () => { let changes: any; return { set(v: any) { changes = v; return this; }, where: (condition: any) => ({ returning: async () => { const name = rows("orders").some((r) => match(r, condition)) ? "orders" : "reviews"; const found = rows(name).find((r) => match(r, condition)); if (!found) return []; Object.assign(found, changes); return [found]; } }) }; },
    },
  };
});
vi.mock("../src/lib/objectStorage", () => ({ ObjectStorageService: class { async getObjectEntityUploadURL() { return "https://storage.googleapis.com/test/review"; } normalizeObjectEntityPath() { return "/objects/review"; } }, ObjectNotFoundError: class extends Error {} }));

import app from "../src/app";

let server: ReturnType<typeof app.listen>;
let baseUrl = "";
async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { "content-type": "application/json", ...(init.headers ?? {}) } });
  return { response, body: await response.json() };
}
const asUser = (id: string, init: RequestInit = {}): RequestInit => ({ ...init, headers: { ...(init.headers ?? {}), "x-test-user-id": id } });
const order = { items: [{ productId: "p1", quantity: 2 }], fullName: "A Customer", phone: "123", pin: "123456", address: "Address" };

describe("customer orders and reviews integration", () => {
  beforeAll(async () => { process.env.ADMIN_EMAILS = "admin@example.com"; await new Promise<void>((resolve) => { server = app.listen(0, "127.0.0.1", resolve); }); const address = server.address() as any; baseUrl = `http://127.0.0.1:${address.port}`; });
  beforeEach(() => {
    state.rows.orders.length = 0;
    state.rows.reviews.length = 0;
    state.rows.products.splice(0, state.rows.products.length, {
      id: "p1", name: "Product", price: 100, variants: [], available: true,
    });
  });
  afterAll(() => server.close());

  it("rejects unauthenticated order, review, and upload requests", async () => {
    expect((await request("/api/orders", { method: "POST", body: JSON.stringify(order) })).response.status).toBe(401);
    expect((await request("/api/reviews", { method: "POST", body: JSON.stringify({ message: "hello" }) })).response.status).toBe(401);
    expect((await request("/api/storage/review-uploads/request-url", { method: "POST", body: JSON.stringify({ name: "x.jpg", size: 10, contentType: "image/jpeg" }) })).response.status).toBe(401);
  });

  it("creates own orders, isolates users, and enforces cancellation rules", async () => {
    const created = await request("/api/orders", asUser("alice", { method: "POST", body: JSON.stringify(order) }));
    expect(created.response.status).toBe(201);
    expect(created.body).toMatchObject({ subtotal: 200, shipping: 100, total: 300 });
    expect((await request("/api/orders", asUser("alice"))).body).toHaveLength(1);
    expect((await request("/api/orders", asUser("bob"))).body).toHaveLength(0);
    expect((await request(`/api/orders/${created.body.id}/cancel`, asUser("alice", { method: "POST", body: "{}" }))).response.status).toBe(400);
    const cancelled = await request(`/api/orders/${created.body.id}/cancel`, asUser("alice", { method: "POST", body: JSON.stringify({ cancellationReason: "Changed my mind" }) }));
    expect(cancelled.body).toMatchObject({ status: "Cancelled", cancellationReason: "Changed my mind" });
    expect((await request(`/api/orders/${created.body.id}/cancel`, asUser("alice", { method: "POST", body: JSON.stringify({ cancellationReason: "Again" }) }))).response.status).toBe(404);
  });

  it("updates order status for admins and reflects it to customer", async () => {
    const created = await request("/api/orders", asUser("alice", { method: "POST", body: JSON.stringify(order) }));
    const update = await request(`/api/admin/orders/${created.body.id}`, asUser("user_admin", { method: "PATCH", body: JSON.stringify({ status: "Dispatched" }) }));
    expect(update.response.status).toBe(200);
    expect((await request("/api/orders", asUser("alice"))).body[0].status).toBe("Dispatched");
  });

  it("creates reviews, keeps own unapproved reviews private, and supports approval/reply", async () => {
    const created = await request("/api/reviews", asUser("alice", { method: "POST", body: JSON.stringify({ message: "Lovely", imagePaths: ["/objects/review"] }) }));
    expect(created.response.status).toBe(201);
    expect((await request("/api/reviews")).body).toHaveLength(0);
    expect((await request("/api/reviews/mine", asUser("alice"))).body[0].message).toBe("Lovely");
    const updated = await request(`/api/admin/reviews/${created.body.id}`, asUser("user_admin", { method: "PATCH", body: JSON.stringify({ approved: true, adminReply: "Thank you!" }) }));
    expect(updated.body).toMatchObject({ approved: true, adminReply: "Thank you!" });
    expect((await request("/api/reviews")).body[0].message).toBe("Lovely");
  });

  it("validates authenticated review image uploads", async () => {
    const valid = await request("/api/storage/review-uploads/request-url", asUser("alice", { method: "POST", body: JSON.stringify({ name: "x.jpg", size: 100, contentType: "image/jpeg" }) }));
    expect(valid.response.status).toBe(200);
    expect(valid.body.objectPath).toBe("/objects/review");
    expect((await request("/api/storage/review-uploads/request-url", asUser("alice", { method: "POST", body: JSON.stringify({ name: "x.exe", size: 100, contentType: "application/octet-stream" }) }))).response.status).toBe(400);
    expect((await request("/api/storage/review-uploads/request-url", asUser("alice", { method: "POST", body: JSON.stringify({ name: "x.jpg", size: 10485761, contentType: "image/jpeg" }) }))).response.status).toBe(400);
  });
});