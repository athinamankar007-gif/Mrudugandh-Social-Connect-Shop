import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import {
  getListProductsQueryKey,
  useCreateProduct,
  useDeleteProduct,
  useListProducts,
  useUpdateProduct,
  useAdminListOrders,
  useAdminUpdateOrder,
  getAdminListOrdersQueryKey,
  useAdminListReviews,
  useAdminUpdateReview,
  getAdminListReviewsQueryKey,
  type Product,
  type ProductVariant,
} from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { Check, ImagePlus, Pencil, Plus, Save, Trash2, X, Package, MessageSquare, Settings } from "lucide-react";

type Draft = {
  id?: string;
  name: string;
  category: string;
  description: string;
  price: string;
  imagePath: string | null;
  imagePaths: string[];
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
  imagePaths: [],
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
    imagePath: product.imagePaths?.[0] ?? product.imagePath,
    imagePaths: product.imagePaths?.length ? [...product.imagePaths] : product.imagePath ? [product.imagePath] : [],
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

const adminTabs = [
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: Package },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

const getListReviewsQueryKey = getAdminListReviewsQueryKey;

function OrdersTab() {
  const queryClient = useQueryClient();
  const orders = useAdminListOrders({ query: { queryKey: getAdminListOrdersQueryKey() } });
  const update = useAdminUpdateOrder();
  const [error, setError] = useState("");
  if (orders.isLoading) return <p className="rounded-xl bg-[#e3f3f7] p-6 text-sm text-[#547080]">Loading orders…</p>;
  if (orders.isError) return <p className="rounded-xl bg-[#fae5e1] p-6 text-sm text-[#a84e47]">Could not load orders. Please refresh.</p>;
  return <div className="space-y-4">{error && <p className="rounded-xl bg-[#fae5e1] p-4 text-sm text-[#a84e47]">{error}</p>}{!orders.data?.length && <p className="rounded-xl border border-dashed border-[#9ecbd5] p-12 text-center text-sm text-[#6a8390]">No customer orders yet.</p>}{orders.data?.map((order) => <article key={order.id} className="rounded-2xl border border-[#cfe5ea] bg-white p-6">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e4eff1] pb-4"><div><p className="font-bold text-[#173b61]">Order #{order.id.slice(0, 8)}</p><p className="mt-1 text-xs text-[#6a8390]">{new Date(order.createdAt).toLocaleString()}</p><p className="mt-2 text-sm text-[#547080]">{order.fullName} · {order.phone} · PIN {order.pin}</p><p className="text-sm text-[#547080]">{order.address}</p></div><select value={order.status} onChange={async (e) => { try { await update.mutateAsync({ id: order.id, data: { status: e.target.value as any, ...(e.target.value === "Cancelled" ? { cancellationReason: order.cancellationReason || "Cancelled by admin" } : {}) } }); await queryClient.invalidateQueries({ queryKey: getAdminListOrdersQueryKey() }); } catch (e) { setError(e instanceof Error ? e.message : "Could not update order."); } }} disabled={update.isPending} className="rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-3 py-2 text-sm font-bold text-[#173b61]"><option>Pending</option><option>Confirmed</option><option>Dispatched</option><option>Cancelled</option></select></div>
    <div className="mt-4 space-y-2">{order.itemSnapshots.map((item: any, i) => <div key={i} className="flex justify-between text-sm text-[#547080]"><span>{item.name || item.productId}{item.variant ? ` · ${item.variant}` : ""} × {item.quantity}</span>{item.price ? <strong className="text-[#173b61]">₹{(item.price * item.quantity).toLocaleString("en-IN")}</strong> : null}</div>)}</div>
    <div className="mt-4 flex flex-wrap justify-between gap-3 border-t border-[#e4eff1] pt-4 text-sm"><span className="font-bold text-[#173b61]">Total ₹{order.total.toLocaleString("en-IN")}</span>{order.cancellationReason && <span className="text-[#a84e47]">Cancellation reason: {order.cancellationReason}</span>}</div>
  </article>)}</div>;
}

function ReviewsTab() {
  const queryClient = useQueryClient();
  const reviews = useAdminListReviews({ query: { queryKey: getAdminListReviewsQueryKey() } });
  const update = useAdminUpdateReview();
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  if (reviews.isLoading) return <p className="rounded-xl bg-[#e3f3f7] p-6 text-sm text-[#547080]">Loading reviews…</p>;
  if (reviews.isError) return <p className="rounded-xl bg-[#fae5e1] p-6 text-sm text-[#a84e47]">Could not load reviews.</p>;
  return <div className="space-y-4">{error && <p className="rounded-xl bg-[#fae5e1] p-4 text-sm text-[#a84e47]">{error}</p>}{!reviews.data?.length && <p className="rounded-xl border border-dashed border-[#9ecbd5] p-12 text-center text-sm text-[#6a8390]">No reviews submitted yet.</p>}{reviews.data?.map((review) => <article key={review.id} className="rounded-2xl border border-[#cfe5ea] bg-white p-6"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold text-[#173b61]">{review.reviewerName}</h3><p className="text-xs text-[#6a8390]">{review.reviewerEmail} · {new Date(review.createdAt).toLocaleDateString()}</p></div><label className="flex items-center gap-2 text-sm font-semibold text-[#31516a]"><input type="checkbox" checked={review.approved} disabled={update.isPending} onChange={async (e) => { try { await update.mutateAsync({ id: review.id, data: { approved: e.target.checked } }); await queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() }); } catch (err) { setError(err instanceof Error ? err.message : "Could not update review."); } }} className="h-4 w-4 accent-[#1688c6]" /> Approved</label></div><p className="mt-4 leading-7 text-[#547080]">{review.message}</p>{review.imagePaths.length > 0 && <div className="mt-4 flex gap-2 overflow-x-auto">{review.imagePaths.map((path) => <img key={path} src={imageUrl(path) || path} alt="Customer purchase" className="h-20 w-20 rounded-lg object-cover" />)}</div>}<div className="mt-5 flex gap-3"><input value={replies[review.id] ?? review.adminReply ?? ""} onChange={(e) => setReplies({ ...replies, [review.id]: e.target.value })} placeholder="Write an admin reply" className="min-w-0 flex-1 rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-3 py-2 text-sm" /><button disabled={update.isPending} onClick={async () => { try { await update.mutateAsync({ id: review.id, data: { adminReply: replies[review.id] ?? review.adminReply ?? "" } }); await queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() }); } catch (err) { setError(err instanceof Error ? err.message : "Could not save reply."); } }} className="rounded-full bg-[#1688c6] px-4 py-2 text-xs font-bold text-white">Save reply</button></div></article>)}</div>;
}

function SettingsTab() {
  const { user } = useUser();
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmailId, setPendingEmailId] = useState<string | null>(null);
  const saveEmail = async (event: FormEvent) => { event.preventDefault(); setMessage(""); setError(""); try { if (!email.trim()) throw new Error("Enter a valid email address."); if (email.trim().toLowerCase() !== "athinamankar007@gmail.com" && email.trim().toLowerCase() !== "mrudugandh.llp@gmail.com") { throw new Error("Changing an email outside the approved allowlist requires backend allowlist handover. No change was made."); } if (!user) throw new Error("Admin user is not available."); const created = await user.createEmailAddress({ email }); await created.prepareVerification({ strategy: "email_code" }); setPendingEmailId(created.id); setMessage("Verification code sent. Enter it below to confirm this address."); } catch (e) { setError(e instanceof Error ? e.message : "Could not update email."); } };
  const verifyEmail = async (event: FormEvent) => { event.preventDefault(); setMessage(""); setError(""); try { if (!user || !pendingEmailId || !verificationCode.trim()) throw new Error("Enter the verification code."); const address = user.emailAddresses.find((item) => item.id === pendingEmailId); if (!address) throw new Error("Verification request expired. Send a new code."); await address.attemptVerification({ code: verificationCode.trim() }); await user.update({ primaryEmailAddressId: address.id }); await user.reload(); setEmail(user.primaryEmailAddress?.emailAddress ?? email); setPendingEmailId(null); setVerificationCode(""); setMessage("Email verified and made primary."); } catch (e) { setError(e instanceof Error ? e.message : "Verification failed. Check the code and try again."); } };
  const savePassword = async (event: FormEvent) => { event.preventDefault(); setMessage(""); setError(""); try { if (!currentPassword || !newPassword) throw new Error("Enter your current password and a new password."); if (newPassword.length < 8) throw new Error("New password must be at least 8 characters."); if (!user) throw new Error("Admin user is not available."); await user.updatePassword({ currentPassword, newPassword }); setCurrentPassword(""); setNewPassword(""); setMessage("Password changed securely through Clerk."); } catch (e) { setError(e instanceof Error ? e.message : "Could not change password. Check your current password."); } };
  return <div className="max-w-2xl space-y-8"><p className="text-sm text-[#547080]">Admin account security is managed by Clerk. Passwords are never stored by this app.</p>{message && <p className="rounded-xl bg-[#e4f5ed] p-4 text-sm text-[#287552]">{message}</p>}{error && <p className="rounded-xl bg-[#fae5e1] p-4 text-sm text-[#a84e47]">{error}</p>}<form onSubmit={saveEmail} className="rounded-2xl border border-[#cfe5ea] bg-white p-6"><h2 className="font-display text-2xl text-[#173b61]">Update admin email</h2><p className="mt-2 text-xs text-[#6a8390]">Approved addresses: mrudugandh.llp@gmail.com and athinamankar007@gmail.com.</p><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-5 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-3 py-3 text-sm" /><button className="mt-4 rounded-full bg-[#1688c6] px-5 py-3 text-sm font-bold text-white">Send verification</button></form>{pendingEmailId && <form onSubmit={verifyEmail} className="rounded-2xl border border-[#9bcbd8] bg-[#f7fcfc] p-6"><h3 className="font-display text-xl text-[#173b61]">Verify new email</h3><p className="mt-2 text-xs text-[#6a8390]">Enter the code Clerk sent to the new address.</p><input required inputMode="numeric" autoComplete="one-time-code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="Verification code" className="mt-4 w-full rounded-xl border border-[#cfe5ea] bg-white px-3 py-3 text-sm" /><button className="mt-4 rounded-full bg-[#1688c6] px-5 py-3 text-sm font-bold text-white">Verify and make primary</button></form>}<form onSubmit={savePassword} className="rounded-2xl border border-[#cfe5ea] bg-white p-6"><h2 className="font-display text-2xl text-[#173b61]">Change password</h2><input type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className="mt-5 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-3 py-3 text-sm" /><input type="password" required autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (8+ characters)" className="mt-3 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-3 py-3 text-sm" /><button className="mt-4 rounded-full bg-[#173b61] px-5 py-3 text-sm font-bold text-white">Change password</button></form></div>;
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
  const [activeTab, setActiveTab] = useState<(typeof adminTabs)[number]["id"]>("products");

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
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const uploadedPaths: string[] = [];
    for (const file of files) {
      const response = await uploadFile(file);
      if (response) uploadedPaths.push(response.objectPath);
    }
    if (uploadedPaths.length) {
      setDraft((current) => {
        const imagePaths = [...current.imagePaths, ...uploadedPaths];
        return { ...current, imagePaths, imagePath: imagePaths[0] ?? null };
      });
      setNotice(`${uploadedPaths.length} image${uploadedPaths.length === 1 ? "" : "s"} uploaded. Save the product to publish them.`);
    }
    event.target.value = "";
  };

  const handleVariantImage = async (event: ChangeEvent<HTMLInputElement>, variantIndex: number) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const uploadedPaths: string[] = [];
    for (const file of files) {
      const response = await uploadFile(file);
      if (response) uploadedPaths.push(response.objectPath);
    }
    if (uploadedPaths.length) {
      setDraft((current) => {
        const variants = [...current.variants];
        variants[variantIndex] = {
          ...variants[variantIndex],
          imagePaths: [...(variants[variantIndex].imagePaths || []), ...uploadedPaths],
        };
        return { ...current, variants };
      });
      setNotice(`${uploadedPaths.length} variant image${uploadedPaths.length === 1 ? "" : "s"} uploaded. Save the product to publish them.`);
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
      imagePath: draft.imagePaths[0] ?? draft.imagePath,
      imagePaths: draft.imagePaths,
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
  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    products.forEach((product) => {
      const cat = product.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(product);
    });
    return groups;
  }, [products]);

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

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-2xl border border-[#cfe5ea] bg-white p-3">
          <p className="px-3 pb-3 pt-2 text-xs font-bold uppercase tracking-[.16em] text-[#6a8390]">Dashboard</p>
          <div className="space-y-1">{adminTabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setActiveTab(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold ${activeTab === id ? "bg-[#e3f3f7] text-[#1688c6]" : "text-[#547080] hover:bg-[#f5fbfc]"}`}><Icon size={17} />{label}</button>)}</div>
        </aside>
        {activeTab === "orders" ? <OrdersTab /> : activeTab === "reviews" ? <ReviewsTab /> : activeTab === "settings" ? <SettingsTab /> : <>
        <aside className="h-fit rounded-2xl border border-[#cfe5ea] bg-white p-3">
          <p className="px-3 pb-3 pt-2 text-xs font-bold uppercase tracking-[.16em] text-[#6a8390]">{products.length} products</p>
          <div className="space-y-4">
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <div key={category}>
                <h3 className="px-3 pb-2 text-xs font-bold text-[#173b61] uppercase tracking-wider">{category}</h3>
                <div className="space-y-1">
                  {categoryProducts.map((product) => (
                    <button key={product.id} type="button" onClick={() => selectProduct(product)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${selectedId === product.id ? "bg-[#e3f3f7]" : "hover:bg-[#f5fbfc]"}`}>
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#e3f3f7]">
                        {imageUrl(product.imagePath) ? <img src={imageUrl(product.imagePath) ?? ""} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="m-3 text-[#1688c6]" size={24} />}
                      </div>
                      <span className="min-w-0"><strong className="block truncate text-sm text-[#173b61]">{product.name}</strong><small className="text-xs text-[#6a8390]">{product.available ? "Available" : "Hidden"}</small></span>
                    </button>
                  ))}
                </div>
              </div>
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
            <label className="text-sm font-semibold text-[#31516a]">Category<input required list="product-categories" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className="mt-2 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-3 py-3 font-normal outline-none focus:border-[#1688c6]" /><datalist id="product-categories"><option value="Tote Bags" /><option value="Bamboo Products" /><option value="Stoles and Dupattas" /><option value="Bedsheets" /><option value="Dohars" /><option value="Gullak (Piggybank)" /></datalist></label>
            <label className="text-sm font-semibold text-[#31516a]">Price (₹)<input required min="0" step="1" type="number" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} className="mt-2 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-3 py-3 font-normal outline-none focus:border-[#1688c6]" /></label>
            <label className="text-sm font-semibold text-[#31516a]">Inventory<input required min="0" step="1" type="number" value={draft.inventory} onChange={(event) => setDraft({ ...draft, inventory: event.target.value })} className="mt-2 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-3 py-3 font-normal outline-none focus:border-[#1688c6]" /></label>
          </div>
          <label className="mt-5 block text-sm font-semibold text-[#31516a]">Description<textarea rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="mt-2 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] p-3 font-normal outline-none focus:border-[#1688c6]" /></label>

          <div className="mt-6 rounded-xl bg-[#f7fcfc] p-4">
             <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-bold text-[#31516a]">Product images</p><label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#9bcbd8] px-4 py-2 text-xs font-bold text-[#1688c6]"><ImagePlus size={14} /> {isUploading ? `Uploading ${progress}%` : "Upload images"}<input type="file" accept="image/*" multiple onChange={handleImage} disabled={isUploading} className="hidden" /></label></div>
             {draft.imagePaths.length > 0 && <div className="mt-4 grid grid-cols-4 gap-2">{draft.imagePaths.map((path, index) => <div key={path} className="group relative overflow-hidden rounded-xl"><img src={imageUrl(path) ?? ""} alt={`Product image ${index + 1}`} className="aspect-square w-full object-cover" /><button type="button" onClick={() => setDraft((current) => { const imagePaths = current.imagePaths.filter((_, itemIndex) => itemIndex !== index); return { ...current, imagePaths, imagePath: imagePaths[0] ?? null }; })} className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-[#a84e47] opacity-0 shadow transition-opacity group-hover:opacity-100" aria-label={`Remove image ${index + 1}`}><X size={13} /></button></div>)}</div>}
             <p className="mt-2 text-xs text-[#6a8390]">Upload multiple product photos together. Images are stored persistently and appear on the shop after saving.</p>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between"><p className="text-sm font-bold text-[#31516a]">Variants</p><button type="button" onClick={() => setDraft({ ...draft, variants: [...draft.variants, { label: "", price: Number(draft.price) || 0, inventory: 0, imagePaths: [] }] })} className="inline-flex items-center gap-1 text-xs font-bold text-[#1688c6]"><Plus size={14} /> Add variant</button></div>
            <div className="mt-3 space-y-4">{draft.variants.map((variant, index) => (
              <div key={`${index}-${variant.label}`} className="rounded-xl border border-[#cfe5ea] bg-white p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <label className="flex-1 min-w-[120px] text-xs font-semibold text-[#31516a]">Label
                    <input value={variant.label} placeholder="e.g. Single" onChange={(event) => setDraft({ ...draft, variants: draft.variants.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) })} className="mt-1 w-full rounded-lg border border-[#cfe5ea] bg-white px-3 py-2 text-sm outline-none focus:border-[#1688c6]" />
                  </label>
                  <label className="w-28 text-xs font-semibold text-[#31516a]">Price (₹)
                    <input type="number" min="0" step="1" value={variant.price} onChange={(event) => setDraft({ ...draft, variants: draft.variants.map((item, itemIndex) => itemIndex === index ? { ...item, price: Number(event.target.value) } : item) })} className="mt-1 w-full rounded-lg border border-[#cfe5ea] bg-white px-3 py-2 text-sm outline-none focus:border-[#1688c6]" />
                  </label>
                  <label className="w-28 text-xs font-semibold text-[#31516a]">Inventory
                    <input type="number" min="0" step="1" value={variant.inventory ?? 0} onChange={(event) => setDraft({ ...draft, variants: draft.variants.map((item, itemIndex) => itemIndex === index ? { ...item, inventory: Number(event.target.value) } : item) })} className="mt-1 w-full rounded-lg border border-[#cfe5ea] bg-white px-3 py-2 text-sm outline-none focus:border-[#1688c6]" />
                  </label>
                  <button type="button" onClick={() => setDraft({ ...draft, variants: draft.variants.filter((_, itemIndex) => itemIndex !== index) })} className="mt-6 rounded-lg p-2 text-[#a84e47] hover:bg-[#fff5f3]" aria-label="Remove variant"><Trash2 size={16} /></button>
                </div>
                <div className="mt-4 border-t border-[#ebf4f5] pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-bold text-[#31516a]">Variant images</p>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#f0f8f9] px-3 py-1.5 text-[11px] font-bold text-[#1688c6] hover:bg-[#e1f1f3]">
                      <ImagePlus size={12} /> {isUploading ? `Uploading ${progress}%` : "Add variant image"}
                      <input type="file" accept="image/*" multiple onChange={(e) => handleVariantImage(e, index)} disabled={isUploading} className="hidden" />
                    </label>
                  </div>
                  {(variant.imagePaths || []).length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                      {(variant.imagePaths || []).map((path, pIndex) => (
                        <div key={path} className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                          <img src={imageUrl(path) ?? ""} alt={`Variant image ${pIndex + 1}`} className="h-full w-full object-cover" />
                          <button type="button" onClick={() => setDraft((current) => {
                            const newVariants = [...current.variants];
                            newVariants[index] = {
                              ...newVariants[index],
                              imagePaths: (newVariants[index].imagePaths || []).filter((_, i) => i !== pIndex)
                            };
                            return { ...current, variants: newVariants };
                          })} className="absolute right-0.5 top-0.5 rounded-full bg-white/90 p-0.5 text-[#a84e47] opacity-0 shadow transition-opacity group-hover:opacity-100" aria-label="Remove variant image"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}</div>
          </div>

          <label className="mt-6 flex items-center gap-3 text-sm font-semibold text-[#31516a]"><input type="checkbox" checked={draft.available} onChange={(event) => setDraft({ ...draft, available: event.target.checked })} className="h-4 w-4 accent-[#1688c6]" /> Show this product in the shop</label>
          <button disabled={busy || isUploading} type="submit" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1688c6] px-6 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><Save size={16} /> {busy ? "Saving..." : "Save product"}</button>
        </form>
        </>}
      </div>
    </div>
  );
}