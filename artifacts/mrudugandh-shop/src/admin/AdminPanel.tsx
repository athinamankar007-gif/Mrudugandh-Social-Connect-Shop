import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListProductsQueryKey,
  useCreateProduct,
  useDeleteProduct,
  useListProducts,
  useUpdateProduct,
  type Product,
  type ProductVariant,
} from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { Check, ImagePlus, Pencil, Plus, Save, Trash2, X } from "lucide-react";

type Draft = {
  id?: string;
  name: string;
  category: string;
  description: string;
  price: string;
  imagePath: string | null;
  variants: ProductVariant[];
  inventory: string;
  available: boolean;
};

const emptyDraft: Draft = {
  name: "",
  category: "Tote Bags",
  description: "",
  price: "",
  imagePath: null,
  variants: [],
  inventory: "0",
  available: true,
};

function toDraft(product?: Product): Draft {
  if (!product) return { ...emptyDraft, variants: [] };
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    price: String(product.price),
    imagePath: product.imagePath,
    variants: product.variants.map((variant) => ({ ...variant })),
    inventory: String(product.inventory),
    available: product.available,
  };
}

function imageUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/api/storage/")) return path;
  if (path.startsWith("/objects/") || path.startsWith("/public-objects/")) {
    return `/api/storage${path}`;
  }
  return `/api/storage/objects/${path.replace(/^\/+/, "")}`;
}

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const productsQuery = useListProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => ({ ...emptyDraft, variants: [] }));
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");

  const selectedProduct = useMemo(
    () => productsQuery.data?.find((product) => product.id === selectedId),
    [productsQuery.data, selectedId],
  );

  const refreshProducts = async () => {
    await queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
  };

  const selectProduct = (product: Product) => {
    setSelectedId(product.id);
    setDraft(toDraft(product));
    setNotice("");
    setFormError("");
  };

  const startNew = () => {
    setSelectedId(null);
    setDraft({ ...emptyDraft, variants: [] });
    setNotice("");
    setFormError("");
  };

  const { uploadFile, isUploading, progress, error: uploadError } = useUpload();
  const handleImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const response = await uploadFile(file);
    if (response) {
      setDraft((current) => ({ ...current, imagePath: response.objectPath }));
      setNotice("Image uploaded. Save the product to publish it.");
    }
    event.target.value = "";
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setNotice("");
    const price = Number(draft.price);
    const inventory = Number(draft.inventory);
    if (!draft.name.trim() || !draft.category.trim() || !Number.isInteger(price) || price < 0) {
      setFormError("Enter a name, category, and a whole-number price.");
      return;
    }
    if (!Number.isInteger(inventory) || inventory < 0) {
      setFormError("Inventory must be a whole number of zero or more.");
      return;
    }

    const data = {
      name: draft.name.trim(),
      category: draft.category.trim(),
      description: draft.description.trim(),
      price,
      imagePath: draft.imagePath,
      variants: draft.variants.filter((variant) => variant.label.trim()),
      inventory,
      available: draft.available,
    };

    try {
      if (draft.id) {
        await updateProduct.mutateAsync({ id: draft.id, data });
        setNotice("Product updated.");
      } else {
        await createProduct.mutateAsync({ data });
        setNotice("Product added.");
        startNew();
      }
      await refreshProducts();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save this product.");
    }
  };

  const removeProduct = async () => {
    if (!draft.id || !window.confirm(`Delete ${draft.name}? This cannot be undone.`)) return;
    try {
      await deleteProduct.mutateAsync({ id: draft.id });
      startNew();
      await refreshProducts();
      setNotice("Product deleted.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not delete this product.");
    }
  };

  const busy = createProduct.isPending || updateProduct.isPending || deleteProduct.isPending;
  const products = productsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-10 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Mrudugandh Social Connect</p>
          <h1 className="mt-2 font-display text-5xl text-[#173b61]">Admin dashboard</h1>
          <p className="mt-3 text-sm text-[#547080]">Manage the products shown in the customer shop.</p>
        </div>
        <button type="button" onClick={startNew} className="inline-flex items-center gap-2 rounded-full bg-[#173b61] px-5 py-3 text-sm font-bold text-white">
          <Plus size={16} /> Add product
        </button>
      </div>

      {productsQuery.isError && <p className="mb-5 rounded-xl bg-[#fae5e1] p-4 text-sm text-[#a84e47]">Could not load products. Your account may not have admin access.</p>}
      {notice && <p className="mb-5 flex items-center gap-2 rounded-xl bg-[#e4f5ed] p-4 text-sm text-[#287552]"><Check size={16} /> {notice}</p>}

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-2xl border border-[#cfe5ea] bg-white p-3">
          <p className="px-3 pb-3 pt-2 text-xs font-bold uppercase tracking-[.16em] text-[#6a8390]">{products.length} products</p>
          <div className="space-y-1">
            {products.map((product) => (
              <button key={product.id} type="button" onClick={() => selectProduct(product)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${selectedId === product.id ? "bg-[#e3f3f7]" : "hover:bg-[#f5fbfc]"}`}>
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#e3f3f7]">
                  {imageUrl(product.imagePath) ? <img src={imageUrl(product.imagePath) ?? ""} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="m-3 text-[#1688c6]" size={24} />}
                </div>
                <span className="min-w-0"><strong className="block truncate text-sm text-[#173b61]">{product.name}</strong><small className="text-xs text-[#6a8390]">{product.available ? "Available" : "Hidden"}</small></span>
              </button>
            ))}
          </div>
        </aside>

        <form onSubmit={saveProduct} className="rounded-2xl border border-[#cfe5ea] bg-white p-6 sm:p-8">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#1688c6]">{selectedProduct ? "Edit product" : "New product"}</p><h2 className="mt-2 font-display text-3xl text-[#173b61]">{draft.name || "Add a product"}</h2></div>
            {draft.id && <button type="button" onClick={removeProduct} className="inline-flex items-center gap-2 rounded-full border border-[#f2c7c2] px-4 py-2 text-xs font-bold text-[#a84e47] hover:bg-[#fff5f3]"><Trash2 size={14} /> Delete</button>}
          </div>
          {formError && <p className="mb-5 rounded-lg bg-[#fae5e1] p-3 text-sm text-[#a84e47]">{formError}</p>}
          {uploadError && <p className="mb-5 rounded-lg bg-[#fae5e1] p-3 text-sm text-[#a84e47]">{uploadError.message}</p>}

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[#31516a]">Product name<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-2 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-3 py-3 font-normal outline-none focus:border-[#1688c6]" /></label>
            <label className="text-sm font-semibold text-[#31516a]">Category<input required list="product-categories" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className="mt-2 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-3 py-3 font-normal outline-none focus:border-[#1688c6]" /><datalist id="product-categories"><option value="Tote Bags" /><option value="Piggybanks" /><option value="Bamboo Products" /><option value="Dupattas" /><option value="Dohars" /></datalist></label>
            <label className="text-sm font-semibold text-[#31516a]">Price (₹)<input required min="0" step="1" type="number" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} className="mt-2 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-3 py-3 font-normal outline-none focus:border-[#1688c6]" /></label>
            <label className="text-sm font-semibold text-[#31516a]">Inventory<input required min="0" step="1" type="number" value={draft.inventory} onChange={(event) => setDraft({ ...draft, inventory: event.target.value })} className="mt-2 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-3 py-3 font-normal outline-none focus:border-[#1688c6]" /></label>
          </div>
          <label className="mt-5 block text-sm font-semibold text-[#31516a]">Description<textarea rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="mt-2 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] p-3 font-normal outline-none focus:border-[#1688c6]" /></label>

          <div className="mt-6 rounded-xl bg-[#f7fcfc] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-bold text-[#31516a]">Product image</p><label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#9bcbd8] px-4 py-2 text-xs font-bold text-[#1688c6]"><ImagePlus size={14} /> {isUploading ? `Uploading ${progress}%` : "Upload image"}<input type="file" accept="image/*" onChange={handleImage} disabled={isUploading} className="hidden" /></label></div>
            {imageUrl(draft.imagePath) && <img src={imageUrl(draft.imagePath) ?? ""} alt="Product preview" className="mt-4 h-36 w-36 rounded-xl object-cover" />}
            <p className="mt-2 text-xs text-[#6a8390]">Use a clear product photo. Images are stored persistently and appear on the shop after saving.</p>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between"><p className="text-sm font-bold text-[#31516a]">Variants</p><button type="button" onClick={() => setDraft({ ...draft, variants: [...draft.variants, { label: "", price: Number(draft.price) || 0 }] })} className="inline-flex items-center gap-1 text-xs font-bold text-[#1688c6]"><Plus size={14} /> Add variant</button></div>
            <div className="mt-3 space-y-2">{draft.variants.map((variant, index) => <div key={`${index}-${variant.label}`} className="flex gap-2"><input value={variant.label} placeholder="e.g. Single" onChange={(event) => setDraft({ ...draft, variants: draft.variants.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) })} className="min-w-0 flex-1 rounded-lg border border-[#cfe5ea] bg-white px-3 py-2 text-sm outline-none focus:border-[#1688c6]" /><input type="number" min="0" step="1" value={variant.price} onChange={(event) => setDraft({ ...draft, variants: draft.variants.map((item, itemIndex) => itemIndex === index ? { ...item, price: Number(event.target.value) } : item) })} className="w-28 rounded-lg border border-[#cfe5ea] bg-white px-3 py-2 text-sm outline-none focus:border-[#1688c6]" /><button type="button" onClick={() => setDraft({ ...draft, variants: draft.variants.filter((_, itemIndex) => itemIndex !== index) })} className="rounded-lg p-2 text-[#a84e47]" aria-label="Remove variant"><X size={16} /></button></div>)}</div>
          </div>

          <label className="mt-6 flex items-center gap-3 text-sm font-semibold text-[#31516a]"><input type="checkbox" checked={draft.available} onChange={(event) => setDraft({ ...draft, available: event.target.checked })} className="h-4 w-4 accent-[#1688c6]" /> Show this product in the shop</label>
          <button disabled={busy || isUploading} type="submit" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1688c6] px-6 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><Save size={16} /> {busy ? "Saving..." : "Save product"}</button>
        </form>
      </div>
    </div>
  );
}