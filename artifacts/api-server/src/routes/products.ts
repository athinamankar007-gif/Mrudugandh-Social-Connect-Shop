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
  { id: "wooden-base-piggybank", name: "Gullak (Piggybank)", category: "Gullak (Piggybank)", price: 350, description: "Gullak (Piggybank)", variants: [], inventory: 0, available: true },
  { id: "bamboo-three-in-one-stand", name: "Bamboo 3-in-one Stand", category: "Bamboo Products", price: 850, description: "Bamboo 3-in-one Stand", variants: [], inventory: 0, available: true },
  { id: "bamboo-lights", name: "Bamboo Lights", category: "Bamboo Products", price: 750, description: "Bamboo Lights", variants: [], inventory: 0, available: true },
  { id: "bamboo-pen-stand", name: "Bamboo Pen Stand", category: "Bamboo Products", price: 150, description: "Bamboo Pen Stand", variants: [], inventory: 0, available: true },
  { id: "bamboo-tray", name: "Trivets", category: "Bamboo Products", price: 150, description: "Trivets", variants: [], inventory: 0, available: true },
  { id: "bamboo-pen", name: "Bamboo Pen", category: "Bamboo Products", price: 150, description: "Bamboo Pen", variants: [], inventory: 0, available: true },
  { id: "bamboo-toothbrush", name: "Bamboo Toothbrush", category: "Bamboo Products", price: 100, description: "Bamboo Toothbrush", variants: [], inventory: 0, available: true },
  { id: "bamboo-comb", name: "Bamboo Comb", category: "Bamboo Products", price: 250, description: "Bamboo Comb", variants: [], inventory: 0, available: true },
  { id: "dupatta", name: "Kantha Work Dupatta", category: "Stoles and Dupattas", price: 1200, description: "Kantha Work Dupatta", variants: [], inventory: 0, available: true },
  { id: "shawl", name: "Kantha Patchwork Stole", category: "Stoles and Dupattas", price: 750, description: "Kantha Patchwork Stole", variants: [], inventory: 0, available: true },
  { id: "kantha-plain-stole", name: "Kantha Plain Stole", category: "Stoles and Dupattas", price: 700, description: "Kantha Plain Stole", variants: [], inventory: 0, available: true },
  { id: "bedsheet", name: "Single Bedsheet", category: "Bedsheets", price: 600, description: "Single bedsheet (5/7)", variants: [{ label: "One Piece", price: 600 }, { label: "Two Pieces", price: 1000 }], inventory: 0, available: true },
  { id: "king-size-bedsheet", name: "King Size Bedsheet", category: "Bedsheets", price: 1300, description: "King size bedsheet (7.5/9)", variants: [], inventory: 0, available: true },
  { id: "superking-size-bedsheet", name: "Superking Size Bedsheet", category: "Bedsheets", price: 1800, description: "Superking size bedsheet (9/9)", variants: [], inventory: 0, available: true },
  { id: "dohars-combo-set", name: "Dohars Combo Set", category: "Dohars", price: 3500, description: "One bedsheet, two pillow covers and one dohar", variants: [], inventory: 0, available: true },
  { id: "kids-dohar", name: "Kids Dohar", category: "Dohars", price: 850, description: "Kids Dohar", variants: [{ label: "Junior Champ (3/5)", price: 850 }, { label: "Senior Champ (5/7)", price: 1200 }], inventory: 0, available: true },
  { id: "adults-patchwork-dohar", name: "Patchwork Dohar", category: "Dohars", price: 1800, description: "Patchwork Dohar", variants: [{ label: "Single (5.5 - 7.5)", price: 1800 }, { label: "Double (7.5 - 9)", price: 2500 }], inventory: 0, available: true },
  { id: "adult-plain-dohar", name: "Plain Dohar", category: "Dohars", price: 1200, description: "Plain Dohar", variants: [{ label: "Single (5/7)", price: 1200 }, { label: "Double (7.5/8.5)", price: 2000 }], inventory: 0, available: true },
].map((product) => ({ ...product, imagePath: null, imagePaths: [] }));

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