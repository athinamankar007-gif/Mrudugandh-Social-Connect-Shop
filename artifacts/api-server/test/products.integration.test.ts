import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

type ProductRecord = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  imagePath: string | null;
  variants: Array<{ label: string; price: number }>;
  inventory: number;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const { database, productColumns, conditionMatches, withDates } = vi.hoisted(() => {
  const database = new Map<string, ProductRecord>();
  const productColumns = { id: "id" };
  const conditionMatches = (
    product: ProductRecord,
    condition:
      | { column: string; value: string }
      | Array<{ column: string; value: string }>,
  ): boolean => {
    const conditions = Array.isArray(condition) ? condition : [condition];
    return conditions.every(
      ({ column, value }) => product[column as keyof ProductRecord] === value,
    );
  };
  const withDates = (
    product: Omit<ProductRecord, "createdAt" | "updatedAt">,
  ): ProductRecord => {
    const now = new Date();
    return {
      ...product,
      imagePath: product.imagePath ?? null,
      variants: product.variants ?? [],
      inventory: product.inventory ?? 0,
      available: product.available ?? true,
      createdAt: now,
      updatedAt: now,
    };
  };
  return { database, productColumns, conditionMatches, withDates };
});

vi.mock("@clerk/express", () => ({
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  getAuth: (req: { header(name: string): string | undefined }) => ({
    userId: req.header("x-test-user-id") ?? null,
  }),
  clerkClient: {
    users: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock("drizzle-orm", () => ({
  and: (...conditions: Array<{ column: string; value: string }>) => conditions,
  eq: (column: string, value: string) => ({ column, value }),
}));

vi.mock("@workspace/db", () => ({
  productsTable: productColumns,
  db: {
    insert: () => {
      let values: ProductRecord | ProductRecord[] = [];
      const builder = {
        values(nextValues: ProductRecord | ProductRecord[]) {
          values = nextValues;
          return builder;
        },
        onConflictDoNothing() {
          const records = Array.isArray(values) ? values : [values];
          for (const record of records) {
            if (!database.has(record.id)) {
              database.set(record.id, withDates(record));
            }
          }
          return Promise.resolve();
        },
        returning() {
          const record = withDates(values as Omit<ProductRecord, "createdAt" | "updatedAt">);
          database.set(record.id, record);
          return Promise.resolve([record]);
        },
      };
      return builder;
    },
    select: () => ({
      from: () => {
        const rows = () => [...database.values()];
        return {
          where: async (condition: { column: string; value: string }) =>
            rows().filter((product) => conditionMatches(product, condition)),
          then: (resolve: (value: ProductRecord[]) => unknown, reject: (reason: unknown) => unknown) =>
            Promise.resolve(rows()).then(resolve, reject),
        };
      },
    }),
    update: () => {
      let changes: Partial<ProductRecord> = {};
      const builder = {
        set(nextChanges: Partial<ProductRecord>) {
          changes = nextChanges;
          return builder;
        },
        where(condition: { column: string; value: string }) {
          return {
            returning: async () => {
              const record = [...database.values()].find((product) =>
                conditionMatches(product, condition),
              );
              if (!record) return [];
              const updated = { ...record, ...changes };
              database.set(record.id, updated);
              return [updated];
            },
          };
        },
      };
      return builder;
    },
    delete: () => ({
      where: (condition: { column: string; value: string }[]) => ({
        returning: async () => {
          const record = [...database.values()].find((product) =>
            conditionMatches(product, condition),
          );
          if (!record) return [];
          database.delete(record.id);
          return [{ id: record.id }];
        },
      }),
    }),
  },
}));

vi.mock("../src/lib/objectStorage", () => ({
  ObjectNotFoundError: class ObjectNotFoundError extends Error {},
  ObjectStorageService: class {
    async getObjectEntityUploadURL() {
      return "https://storage.googleapis.com/test-bucket/upload";
    }

    normalizeObjectEntityPath() {
      return "/objects/product-image";
    }

    async searchPublicObject() {
      return null;
    }

    async getObjectEntityFile() {
      throw new Error("not used in this test");
    }
  },
}));

import { clerkClient } from "@clerk/express";
import app from "../src/app";

const adminUserId = "user_admin";
const seedCatalogue = [
  ["kalamkari-tote-bag", "Kalamkari Tote Bag"],
  ["canvas-tote-bag", "Canvas Tote Bag"],
  ["patchwork-tote-bag", "Patchwork Tote Bag"],
  ["wooden-base-piggybank", "Gullak (Piggybank)"],
  ["bamboo-three-in-one-stand", "Bamboo 3-in-one Stand"],
  ["bamboo-lights", "Bamboo Lights"],
  ["bamboo-pen-stand", "Bamboo Pen Stand"],
  ["bamboo-tray", "Trivets"],
  ["bamboo-pen", "Bamboo Pen"],
  ["bamboo-toothbrush", "Bamboo Toothbrush"],
  ["bamboo-comb", "Bamboo Comb"],
  ["dupatta", "Kantha Work Dupatta"],
  ["shawl", "Kantha Patchwork Stole"],
  ["kantha-plain-stole", "Kantha Plain Stole"],
  ["bedsheet", "Single Bedsheet"],
  ["king-size-bedsheet", "King Size Bedsheet"],
  ["superking-size-bedsheet", "Superking Size Bedsheet"],
  ["dohars-combo-set", "Dohars Combo Set"],
  ["kids-dohar", "Kids Dohar"],
  ["adults-patchwork-dohar", "Patchwork Dohar"],
  ["adult-plain-dohar", "Plain Dohar"],
] as const;

let server: ReturnType<typeof app.listen>;
let baseUrl = "";

async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const rawBody = response.status === 204 ? "" : await response.text();
  let body: unknown = null;
  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw new Error(`Expected JSON from ${path}, got ${response.status}: ${rawBody}`);
    }
  }
  return { response, body };
}

function asAdmin(init: RequestInit = {}): RequestInit {
  return {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      "x-test-user-id": adminUserId,
    },
  };
}

describe("admin product regression coverage", () => {
  beforeAll(async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    vi.mocked(clerkClient.users.getUser).mockResolvedValue({
      emailAddresses: [{ id: "email_primary", emailAddress: "admin@example.com" }],
      primaryEmailAddressId: "email_primary",
    } as never);

    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not start");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  beforeEach(() => {
    database.clear();
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  it("rejects unauthenticated create, update, delete, and upload-url requests", async () => {
    const create = await request("/api/products", {
      method: "POST",
      body: JSON.stringify({
        id: "blocked-product",
        name: "Blocked Product",
        category: "Tote Bags",
        description: "Should not be created",
        price: 100,
      }),
    });
    const update = await request("/api/products/kalamkari-tote-bag", {
      method: "PATCH",
      body: JSON.stringify({ name: "Should not change" }),
    });
    const remove = await request("/api/products/kalamkari-tote-bag", { method: "DELETE" });
    const upload = await request("/api/storage/uploads/request-url", {
      method: "POST",
      body: JSON.stringify({ name: "product.jpg", size: 10, contentType: "image/jpeg" }),
    });

    expect(create.response.status).toBe(401);
    expect(update.response.status).toBe(401);
    expect(remove.response.status).toBe(401);
    expect(upload.response.status).toBe(401);
    expect(database.has("blocked-product")).toBe(false);
  });

  it("supports approved admin CRUD, persists image paths, refreshes the public catalogue, and keeps seeds", async () => {
    const upload = await request(
      "/api/storage/uploads/request-url",
      asAdmin({
        method: "POST",
        body: JSON.stringify({ name: "product.jpg", size: 10, contentType: "image/jpeg" }),
      }),
    );
    expect(upload.response.status).toBe(200);
    expect(upload.body).toMatchObject({
      objectPath: "/objects/product-image",
      metadata: { name: "product.jpg", size: 10, contentType: "image/jpeg" },
    });

    const create = await request(
      "/api/products",
      asAdmin({
        method: "POST",
        body: JSON.stringify({
          id: "regression-product",
          name: "Regression Product",
          category: "Tote Bags",
          description: "Created by the approved admin",
          price: 999,
          imagePath: upload.body.objectPath,
          variants: [{ label: "Standard", price: 999 }],
          inventory: 4,
          available: true,
        }),
      }),
    );
    expect(create.response.status).toBe(201);
    expect(create.body).toMatchObject({
      id: "regression-product",
      imagePath: "/objects/product-image",
      inventory: 4,
    });

    const initialCatalogue = await request("/api/products");
    expect(initialCatalogue.response.status).toBe(200);
    expect(initialCatalogue.body).toEqual(
      expect.arrayContaining(
        seedCatalogue.map(([id, name]) => expect.objectContaining({ id, name })),
      ),
    );
    expect(initialCatalogue.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "regression-product",
          name: "Regression Product",
          imagePath: "/objects/product-image",
        }),
      ]),
    );

    const update = await request(
      "/api/products/regression-product",
      asAdmin({
        method: "PATCH",
        body: JSON.stringify({
          name: "Updated Regression Product",
          price: 1099,
          imagePath: "/objects/updated-product-image",
        }),
      }),
    );
    expect(update.response.status).toBe(200);
    expect(update.body).toMatchObject({
      id: "regression-product",
      name: "Updated Regression Product",
      price: 1099,
      imagePath: "/objects/updated-product-image",
    });

    const refreshedCatalogue = await request("/api/products");
    expect(refreshedCatalogue.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "regression-product",
          name: "Updated Regression Product",
          imagePath: "/objects/updated-product-image",
        }),
      ]),
    );

    const remove = await request("/api/products/regression-product", asAdmin({ method: "DELETE" }));
    expect(remove.response.status).toBe(204);

    const finalCatalogue = await request("/api/products");
    expect(finalCatalogue.body).toEqual(
      expect.arrayContaining(
        seedCatalogue.map(([id, name]) => expect.objectContaining({ id, name })),
      ),
    );
    expect(finalCatalogue.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "regression-product" })]),
    );
  });
});