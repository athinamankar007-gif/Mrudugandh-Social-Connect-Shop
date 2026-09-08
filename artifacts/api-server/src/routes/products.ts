import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import {
  CreateProductBody,
  CreateProductResponse,
  DeleteProductParams,
  GetProductParams,
  GetProductResponse,
  ListProductsResponse,
  UpdateProductBody,
  UpdateProductParams,
  UpdateProductResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/adminAuth";

const router: IRouter = Router();

const seedProducts = [
  { id: "kalamkari-tote-bag", name: "Kalamkari Tote Bag", category: "Tote Bags", price: 200, description: "Kalamkari Tote Bag", variants: [], inventory: 0, available: true },
  { id: "canvas-tote-bag", name: "Canvas Tote Bag", category: "Tote Bags", price: 250, description: "Canvas Tote Bag", variants: [], inventory: 0, available: true },
  { id: "patchwork-tote-bag", name: "Patchwork Tote Bag", category: "Tote Bags", price: 450, description: "Patchwork Tote Bag", variants: [], inventory: 0, available: true },
  { id: "wooden-base-piggybank", name: "Wooden Base Piggybank", category: "Piggybanks", price: 350, description: "Wooden Base Piggybank", variants: [], inventory: 0, available: true },
  { id: "bamboo-lights", name: "Bamboo Lights", category: "Bamboo Products", price: 750, description: "Bamboo Lights", variants: [], inventory: 0, available: true },
  { id: "bamboo-pen-stand", name: "Bamboo Pen Stand", category: "Bamboo Products", price: 150, description: "Bamboo Pen Stand", variants: [], inventory: 0, available: true },
  { id: "dupatta", name: "Dupatta", category: "Dupattas", price: 1200, description: "Dupatta", variants: [], inventory: 0, available: true },
  { id: "kids-dohar", name: "Kids Dohar", category: "Dohars", price: 850, description: "Kids Dohar", variants: [{ label: "Single", price: 850 }, { label: "Double", price: 1200 }], inventory: 0, available: true },
  { id: "adults-patchwork-dohar", name: "Adults Patchwork Dohar", category: "Dohars", price: 1800, description: "Adults Patchwork Dohar", variants: [{ label: "Single", price: 1800 }, { label: "Double", price: 2500 }], inventory: 0, available: true },
  { id: "adult-plain-dohar", name: "Adult Plain Dohar", category: "Dohars", price: 1200, description: "Adult Plain Dohar", variants: [{ label: "Single", price: 1200 }, { label: "Double", price: 2000 }], inventory: 0, available: true },
];

let seedPromise: Promise<void> | null = null;

async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = db
      .insert(productsTable)
      .values(seedProducts)
      .onConflictDoNothing()
      .then(() => undefined);
  }
  await seedPromise;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `product-${randomUUID().slice(0, 8)}`;
}

router.get("/products", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const products = await db.select().from(productsTable);
  res.json(ListProductsResponse.parse(products));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await ensureSeeded();
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse(product));
});

router.post("/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const id = parsed.data.id ?? slugify(parsed.data.name);
  const productData = {
    id,
    name: parsed.data.name,
    category: parsed.data.category,
    description: parsed.data.description,
    price: parsed.data.price,
    imagePath: parsed.data.imagePaths?.[0] ?? parsed.data.imagePath ?? null,
    imagePaths: parsed.data.imagePaths ?? (parsed.data.imagePath ? [parsed.data.imagePath] : []),
    variants: parsed.data.variants ?? [],
    inventory: parsed.data.inventory ?? 0,
    available: parsed.data.available ?? true,
  };

  try {
    const [product] = await db.insert(productsTable).values(productData).returning();
    res.status(201).json(CreateProductResponse.parse(product));
  } catch (error) {
    req.log.warn({ err: error, id }, "Could not create product");
    res.status(409).json({ error: "A product with this ID already exists" });
  }
});

router.patch("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.imagePaths !== undefined) {
    updateData.imagePath = parsed.data.imagePaths[0] ?? null;
  }

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(UpdateProductResponse.parse(product));
});

router.delete("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .delete(productsTable)
    .where(and(eq(productsTable.id, params.data.id)))
    .returning({ id: productsTable.id });

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;