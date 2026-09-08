import { createContext, type ChangeEvent, type FormEvent, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, Show, SignIn, SignUp } from '@clerk/react';
import { shadcn } from '@clerk/themes';
import { useListProducts, type Product as ApiProduct } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, useLocation, useRoute, Router as WouterRouter } from 'wouter';
import { ArrowRight, ChevronLeft, CircleCheck, HeartHandshake, Leaf, Menu, Minus, Package, Plus, Search, ShoppingBag, Sparkles, Trash2, Users, X } from 'lucide-react';
import logo from '../../../attached_assets/IMG_4539_1788762132648.JPG';
import AdminPanel from '@/admin/AdminPanel';

type Variant = { label: string; price: number };
type Product = { id: string; name: string; category: string; price: number; description: string; variants?: Variant[]; image: string | null; images: string[]; imagePath?: string | null; imagePaths?: string[]; inventory?: number; available?: boolean };
type CartLine = { productId: string; quantity: number; variant?: Variant };

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;
const categories = ['All', 'Tote Bags', 'Piggybanks', 'Bamboo Products', 'Dupattas', 'Dohars'];

function mapApiProduct(product: ApiProduct): Product {
  const storedPaths = product.imagePaths?.length
    ? product.imagePaths
    : product.imagePath
      ? [product.imagePath]
      : [];
  const images = storedPaths.map(publicImageUrl).filter((path): path is string => Boolean(path));
  return {
    ...product,
    image: images[0] ?? null,
    images,
  };
}

function publicImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/api/storage/")) return path;
  if (path.startsWith("/objects/") || path.startsWith("/public-objects/")) {
    return `/api/storage${path}`;
  }
  return `/api/storage/objects/${path.replace(/^\/+/, "")}`;
}

type ProductsContextType = { products: Product[]; isLoading: boolean; error: boolean };
const ProductsContext = createContext<ProductsContextType | null>(null);

function useProducts() {
  const value = useContext(ProductsContext);
  if (!value) throw new Error('ProductsProvider missing');
  return value;
}

function ProductsProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, isError } = useListProducts();
  const catalog = useMemo(() => data?.map(mapApiProduct) ?? [], [data]);
  return <ProductsContext.Provider value={{ products: catalog, isLoading, error: isError }}>{children}</ProductsContext.Provider>;
}

type CartContextType = { cart: CartLine[]; add: (productId: string, quantity: number, variant?: Variant) => void; update: (key: string, quantity: number) => void; remove: (key: string) => void; clear: () => void; subtotal: number; count: number };
const CartContext = createContext<CartContextType | null>(null);
const cartKey = (line: CartLine) => `${line.productId}-${line.variant?.label ?? 'default'}`;
function useCart() { const value = useContext(CartContext); if (!value) throw new Error('CartProvider missing'); return value; }

function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useProducts();
  const [cart, setCart] = useState<CartLine[]>(() => { try { return JSON.parse(localStorage.getItem('mrudugandh-cart') || '[]'); } catch { return []; } });
  useEffect(() => { localStorage.setItem('mrudugandh-cart', JSON.stringify(cart)); }, [cart]);
  const add = (productId: string, quantity: number, variant?: Variant) => setCart((current) => {
    const key = `${productId}-${variant?.label ?? 'default'}`;
    const existing = current.find((line) => cartKey(line) === key);
    return existing ? current.map((line) => cartKey(line) === key ? { ...line, quantity: line.quantity + quantity } : line) : [...current, { productId, quantity, variant }];
  });
  const update = (key: string, quantity: number) => setCart((current) => current.map((line) => cartKey(line) === key ? { ...line, quantity: Math.max(1, quantity) } : line));
  const remove = (key: string) => setCart((current) => current.filter((line) => cartKey(line) !== key));
  const subtotal = cart.reduce((sum, line) => sum + (line.variant?.price ?? products.find((product) => product.id === line.productId)?.price ?? 0) * line.quantity, 0);
  return <CartContext.Provider value={{ cart, add, update, remove, clear: () => setCart([]), subtotal, count: cart.reduce((sum, line) => sum + line.quantity, 0) }}>{children}</CartContext.Provider>;
}

function ProductImage({ product, large = false }: { product: Product; large?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = product.images[0] ?? product.image;
  if (image && !imageFailed) return <img src={image} alt={product.name} onError={() => setImageFailed(true)} className="h-full w-full object-cover" />;
  const icon = product.category === 'Bamboo Products' ? <Leaf /> : product.category === 'Dohars' ? <Sparkles /> : <Package />;
  return <div className={`product-placeholder paper-grain ${large ? 'min-h-[360px]' : 'aspect-[4/3]'} flex flex-col items-center justify-center overflow-hidden bg-[#dff1f6] text-[#174471]`}><div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border border-[#279ddd]/40 bg-[#edf9fb] text-[#1688c6]">{icon}</div><span className="relative z-10 mt-5 max-w-[70%] text-center font-display text-xl leading-tight">{product.name}</span><small className="relative z-10 mt-2 uppercase tracking-[.22em] text-[10px] text-[#3c6e87]">{product.category}</small></div>;
}

function ProductGallery({ product }: { product: Product }) {
  const images = product.images.length ? product.images : product.image ? [product.image] : [];
  const [selectedImage, setSelectedImage] = useState(images[0] ?? null);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const usableImages = images.filter((image) => !failedImages.includes(image));
  const activeImage = usableImages.includes(selectedImage ?? "") ? selectedImage : usableImages[0] ?? null;

  if (!activeImage) return <ProductImage product={product} large />;
  return <div>
    <div className="overflow-hidden rounded-2xl bg-[#e3f3f7]"><img src={activeImage} alt={product.name} onError={() => setFailedImages((current) => [...new Set([...current, activeImage])])} className="min-h-[360px] w-full object-cover" /></div>
    {usableImages.length > 1 && <div className="mt-3 grid grid-cols-4 gap-2">{usableImages.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImage(image)} className={`overflow-hidden rounded-lg border-2 ${activeImage === image ? 'border-[#1688c6]' : 'border-transparent'}`} aria-label={`View image ${index + 1}`}><img src={image} alt="" className="aspect-square w-full object-cover" /></button>)}</div>}
  </div>;
}

function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const links = [['Shop', '/shop'], ['Our Story', '/about'], ['Our Impact', '/impact'], ['Contact', '/contact']];
  return <header className="sticky top-0 z-40 border-b border-[#cfe5ea] bg-[#f7fcfc]/95 backdrop-blur-md">
    <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8">
      <Link href="/" className="flex items-center gap-3" data-testid="link-logo"><img src={logo} alt="Mrudugandh Social Connect" className="h-12 w-12 rounded-full object-cover" /><span className="hidden text-sm font-bold tracking-[.16em] text-[#153a67] sm:block">MRUDUGANDH <span className="block text-[9px] font-medium tracking-[.36em] text-[#1996d3]">SOCIAL CONNECT</span></span></Link>
      <nav className="hidden items-center gap-8 md:flex">{links.map(([label, href]) => <Link key={href} href={href} className="text-[13px] font-semibold text-[#31516a] transition-colors hover:text-[#1688c6]" data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</Link>)}</nav>
      <div className="flex items-center gap-2"><Link href="/shop" aria-label="Search the shop" className="rounded-full p-2.5 text-[#31516a] hover:bg-[#e7f5f6]" data-testid="button-search"><Search size={19} /></Link><Link href="/cart" className="relative rounded-full p-2.5 text-[#31516a] hover:bg-[#e7f5f6]" aria-label="Open cart" data-testid="link-cart"><ShoppingBag size={19} />{count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#efb34f] px-1 text-[10px] font-bold text-[#153a67]" data-testid="text-cart-count">{count}</span>}</Link><button className="rounded-full p-2.5 text-[#31516a] md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" data-testid="button-mobile-menu">{open ? <X size={20} /> : <Menu size={20} />}</button></div>
    </div>
    {open && <nav className="border-t border-[#cfe5ea] bg-[#f7fcfc] px-5 py-4 md:hidden">{links.map(([label, href]) => <Link key={href} onClick={() => setOpen(false)} href={href} className="block border-b border-[#e0edef] py-3 text-sm font-semibold text-[#31516a]" data-testid={`link-mobile-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</Link>)}</nav>}
  </header>;
}

function Footer() {
  return <footer className="mt-24 bg-[#14395f] text-[#edf8fa]"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8"><div><img src={logo} alt="Mrudugandh Social Connect" className="mb-5 h-16 w-16 rounded-full object-cover" /><h2 className="font-display text-2xl">Handmade with Purpose.<br />Connected with Heart.</h2><p className="mt-4 max-w-xs text-sm leading-6 text-[#bfd5de]">A shop with a human story, celebrating traditional skills and meaningful craftsmanship.</p></div><div><p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#efb34f]">Explore</p><Link href="/shop" className="block py-1.5 text-sm text-[#d6e6eb] hover:text-white" data-testid="link-footer-shop">Shop products</Link><Link href="/about" className="block py-1.5 text-sm text-[#d6e6eb] hover:text-white" data-testid="link-footer-about">Our story</Link><Link href="/impact" className="block py-1.5 text-sm text-[#d6e6eb] hover:text-white" data-testid="link-footer-impact">Our impact</Link></div><div><p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#efb34f]">Stay connected</p><p className="max-w-[220px] text-sm leading-6 text-[#bfd5de]">Questions about a product or your order? We would love to hear from you.</p><Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white" data-testid="link-footer-contact">Contact us <ArrowRight size={15} /></Link></div></div><div className="border-t border-[#365875] px-5 py-5 text-center text-xs text-[#a8c3ce]">© {new Date().getFullYear()} Mrudugandh Social Connect. Handmade with purpose.</div></footer>;
}

function Shell({ children }: { children: ReactNode }) {
  return <><Header /><main className="min-h-[calc(100dvh-76px)]">{children}</main><Footer /></>;
}

function ProductCard({ product }: { product: Product }) {
  return <Link href={`/product/${product.id}`} className="group block" data-testid={`card-product-${product.id}`}><div className="relative overflow-hidden rounded-2xl border border-[#cfe5ea] bg-white shadow-[0_5px_20px_rgba(17,55,91,.04)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_15px_35px_rgba(17,55,91,.12)]"><ProductImage product={product} /><span className="absolute left-3 top-3 rounded-full bg-[#f7fcfc]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#277593]">{product.category}</span><div className="flex items-end justify-between gap-3 p-4"><div><h3 className="font-display text-lg text-[#173b61]">{product.name}</h3><p className="mt-1 text-xs text-[#6a8390]">{product.variants?.length ? 'Two sizes available' : 'Handmade product'}</p></div><span className="whitespace-nowrap text-sm font-bold text-[#1688c6]" data-testid={`text-price-${product.id}`}>{money(product.price)}{product.variants?.length ? <small className="font-normal text-[10px] text-[#6a8390]"> onwards</small> : null}</span></div></div></Link>;
}

function Home() {
  const { products, isLoading, error } = useProducts();
  const visibleProducts = products.filter((product) => product.available !== false);
  const featured = visibleProducts.filter((product) => ['kalamkari-tote-bag', 'bamboo-lights', 'adults-patchwork-dohar'].includes(product.id));
  if (isLoading) return <Shell><CatalogMessage title="Loading the collection…" copy="Fetching the latest products." /></Shell>;
  if (error) return <Shell><CatalogMessage title="The collection is temporarily unavailable" copy="Please refresh in a moment while we reconnect to the catalogue." /></Shell>;
  return <Shell><section className="relative overflow-hidden bg-[#e3f3f7]"><div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-28"><div className="reveal"><p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[.24em] text-[#1688c6]"><span className="h-px w-8 bg-[#efb34f]" /> A thoughtful marketplace</p><h1 className="max-w-xl font-display text-[clamp(3.4rem,8vw,6.7rem)] leading-[.94] tracking-[-.04em] text-[#153a67]">Handmade with <em className="font-normal text-[#1688c6]">purpose.</em><br />Connected with heart.</h1><p className="mt-7 max-w-lg text-base leading-7 text-[#496a7a]">Discover handcrafted products that celebrate traditional skills, support local artisans and bring meaningful craftsmanship into everyday life.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/shop" className="inline-flex items-center gap-3 rounded-full bg-[#1688c6] px-6 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5" data-testid="link-hero-shop">Explore the collection <ArrowRight size={17} /></Link><Link href="/about" className="inline-flex items-center gap-2 rounded-full border border-[#9bcbd8] px-6 py-3.5 text-sm font-bold text-[#31516a] hover:bg-white/50" data-testid="link-hero-story">Our story</Link></div></div><div className="reveal reveal-delay-2 relative flex min-h-[390px] items-center justify-center lg:min-h-[520px]"><div className="absolute h-[340px] w-[340px] rounded-full border border-[#8bcada] lg:h-[480px] lg:w-[480px]" /><div className="absolute h-[270px] w-[270px] rounded-full bg-[#c5e7ed] lg:h-[390px] lg:w-[390px]" /><div className="relative z-10 flex h-60 w-60 rotate-3 flex-col items-center justify-center rounded-[45%_55%_55%_45%] border-8 border-[#f7fcfc] bg-[#edbd58] text-center shadow-[0_20px_50px_rgba(21,58,103,.15)] lg:h-80 lg:w-80"><Sparkles className="mb-5 text-[#153a67]" size={38} /><span className="font-display text-3xl leading-tight text-[#153a67] lg:text-4xl">Objects<br />with a story</span><span className="mt-4 text-[10px] font-bold uppercase tracking-[.22em] text-[#31516a]">made by hand</span></div><div className="absolute bottom-8 left-4 z-10 rounded-xl bg-white px-4 py-3 shadow-lg lg:left-2"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#1688c6]">Everyday, meaningful</p><p className="mt-1 font-display text-base text-[#173b61]">Made to be kept</p></div></div></div></section><section className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="mb-9 flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Browse by feeling</p><h2 className="mt-2 font-display text-4xl text-[#173b61]">Find something to keep close</h2></div><Link href="/shop" className="inline-flex items-center gap-2 text-sm font-bold text-[#1688c6]" data-testid="link-view-all">View all products <ArrowRight size={16} /></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{categories.slice(1).map((category, index) => <Link key={category} href={`/shop?category=${encodeURIComponent(category)}`} className={`group flex min-h-[145px] flex-col justify-between rounded-2xl p-5 transition-transform hover:-translate-y-1 ${index % 2 ? 'bg-[#f8e8c6]' : 'bg-[#d9eef2]'}`} data-testid={`link-category-${category.toLowerCase().replaceAll(' ', '-')}`}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-[#1688c6]">{index === 2 ? <Leaf size={18} /> : index === 3 ? <Sparkles size={18} /> : <Package size={18} />}</span><span className="font-display text-xl text-[#173b61]">{category}</span></Link>)}</div></section><section className="bg-[#f9f1df]"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#c1792c]">A few favourites</p><h2 className="mt-2 font-display text-4xl text-[#173b61]">Made for your everyday</h2></div><Link href="/shop" className="inline-flex items-center gap-2 text-sm font-bold text-[#1688c6]" data-testid="link-featured-shop">Shop all <ArrowRight size={16} /></Link></div><div className="grid gap-5 md:grid-cols-3">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div></div></section><section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8"><div className="relative min-h-[300px] overflow-hidden rounded-[2rem] bg-[#174471] p-8 text-[#f5fbfc]"><div className="absolute -right-16 -top-20 h-60 w-60 rounded-full border-[22px] border-[#299cdb]/50" /><div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full border-[18px] border-[#efb34f]/80" /><HeartHandshake className="relative z-10 mb-16 text-[#efb34f]" size={35} /><p className="relative z-10 max-w-xs font-display text-3xl leading-tight">When you choose handmade, you choose a living tradition.</p></div><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Why Mrudugandh</p><h2 className="mt-3 max-w-lg font-display text-4xl leading-tight text-[#173b61]">A small choice can carry a long way.</h2><p className="mt-5 max-w-xl leading-7 text-[#547080]">We make space for traditional skills, thoughtful materials and the people behind every piece. This is not just a catalogue. It is a way to stay connected to craft.</p><Link href="/impact" className="mt-7 inline-flex items-center gap-3 rounded-full bg-[#173b61] px-6 py-3.5 text-sm font-bold text-white" data-testid="link-impact-cta">See our impact <ArrowRight size={17} /></Link></div></section></Shell>;
}

function Shop() {
  const { products, isLoading, error } = useProducts();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('featured');
  const visibleProducts = products.filter((product) => product.available !== false);
  const categoryOptions = useMemo(() => Array.from(new Set(['All', ...visibleProducts.map((product) => product.category)])), [visibleProducts]);
  const filtered = useMemo(() => visibleProducts.filter((p) => (category === 'All' || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : a.name.localeCompare(b.name)), [visibleProducts, query, category, sort]);
  if (isLoading) return <Shell><CatalogMessage title="Loading the collection…" copy="Fetching the latest products." /></Shell>;
  if (error) return <Shell><CatalogMessage title="The collection is temporarily unavailable" copy="Please refresh in a moment while we reconnect to the catalogue." /></Shell>;
  return <Shell><div className="mx-auto max-w-7xl px-5 pb-24 pt-14 lg:px-8"><div className="mb-11 max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">The collection</p><h1 className="mt-3 font-display text-5xl text-[#173b61] sm:text-6xl">Objects with a story.</h1><p className="mt-4 leading-7 text-[#547080]">Browse handcrafted pieces chosen for their everyday warmth and enduring connection.</p></div><div className="mb-9 grid gap-4 rounded-2xl border border-[#cfe5ea] bg-white p-4 shadow-[0_5px_20px_rgba(17,55,91,.04)] lg:grid-cols-[1fr_auto]"><div className="relative"><Search className="absolute left-3 top-3.5 text-[#7b96a0]" size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" className="w-full rounded-xl bg-[#eef7f8] py-3 pl-10 pr-4 text-sm outline-none ring-[#7dc8da] focus:ring-2" data-testid="input-search-products" /></div><div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">{categoryOptions.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-colors ${category === item ? 'bg-[#173b61] text-white' : 'bg-[#eef7f8] text-[#547080] hover:bg-[#d9eef2]'}`} data-testid={`button-filter-${item.toLowerCase().replaceAll(' ', '-')}`}>{item}</button>)}</div></div><div className="mb-6 flex items-center justify-between"><p className="text-sm text-[#6b8490]" data-testid="text-result-count">{filtered.length} {filtered.length === 1 ? 'product' : 'products'}</p><label className="flex items-center gap-2 text-xs font-semibold text-[#547080]">Sort by <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-[#cfe5ea] bg-white px-3 py-2 text-xs text-[#173b61] outline-none" data-testid="select-sort"><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div>{filtered.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="rounded-2xl border border-dashed border-[#9ecbd5] bg-[#edf8f9] py-20 text-center"><Search className="mx-auto text-[#1688c6]" size={28} /><h2 className="mt-4 font-display text-2xl text-[#173b61]">No products found</h2><p className="mt-2 text-sm text-[#6b8490]">Try a different search or browse every category.</p><button onClick={() => { setQuery(''); setCategory('All'); }} className="mt-5 text-sm font-bold text-[#1688c6]" data-testid="button-clear-filters">Clear filters</button></div>}</div></Shell>;
}

function ProductDetail() {
  const [, params] = useRoute('/product/:id');
  const { products, isLoading, error } = useProducts();
  const product = products.find((item) => item.id === (params?.id || ''));
  const { add } = useCart();
  const [, setLocation] = useLocation();
  const [variant, setVariant] = useState<Variant | undefined>(product?.variants?.[0]);
  const [quantity, setQuantity] = useState(1);
  if (isLoading) return <Shell><CatalogMessage title="Loading product…" copy="Fetching the latest product details." /></Shell>;
  if (error) return <Shell><CatalogMessage title="Product details are temporarily unavailable" copy="Please refresh in a moment while we reconnect to the catalogue." /></Shell>;
  if (!product) return <Shell><Empty title="Product not found" copy="This product is not in the collection." href="/shop" action="Back to shop" /></Shell>;
  if (product.available === false) return <Shell><Empty title="Product unavailable" copy="This product is not currently available." href="/shop" action="Back to shop" /></Shell>;
  const price = variant?.price ?? product.price;
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);
  return <Shell><div className="mx-auto max-w-7xl px-5 pb-20 pt-10 lg:px-8"><Link href="/shop" className="mb-8 inline-flex items-center gap-1 text-sm font-semibold text-[#1688c6]" data-testid="link-back-shop"><ChevronLeft size={17} /> Back to shop</Link><div className="grid gap-12 lg:grid-cols-2 lg:gap-20"><div className="rounded-3xl bg-[#e3f3f7] p-4"><ProductGallery product={product} /></div><div className="self-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">{product.category}</p><h1 className="mt-3 font-display text-5xl leading-tight text-[#173b61]">{product.name}</h1><p className="mt-4 text-2xl font-semibold text-[#1688c6]" data-testid="text-product-price">{money(price)}</p><p className="mt-6 max-w-md leading-7 text-[#547080]">{product.description}</p>{product.variants?.length ? <div className="mt-8"><p className="mb-3 text-xs font-bold uppercase tracking-[.15em] text-[#547080]">Choose a size</p><div className="flex gap-3">{product.variants.map((item) => <button key={item.label} onClick={() => setVariant(item)} className={`rounded-xl border px-5 py-3 text-sm font-semibold ${variant?.label === item.label ? 'border-[#1688c6] bg-[#e3f3f7] text-[#1688c6]' : 'border-[#cfe5ea] bg-white text-[#547080]'}`} data-testid={`button-variant-${item.label.toLowerCase()}`}>{item.label} <span className="ml-2 text-xs">{money(item.price)}</span></button>)}</div></div> : null}<div className="mt-8 flex gap-3"><div className="flex items-center rounded-full border border-[#cfe5ea] bg-white"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 text-[#547080]" aria-label="Decrease quantity" data-testid="button-decrease-quantity"><Minus size={16} /></button><span className="w-8 text-center text-sm font-bold" data-testid="text-product-quantity">{quantity}</span><button onClick={() => setQuantity(quantity + 1)} className="p-3 text-[#547080]" aria-label="Increase quantity" data-testid="button-increase-quantity"><Plus size={16} /></button></div><button onClick={() => { add(product.id, quantity, variant); setLocation('/cart'); }} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1688c6] px-6 py-3 text-sm font-bold text-white hover:bg-[#1179ae]" data-testid="button-add-to-cart"><ShoppingBag size={17} /> Add to cart</button></div></div></div>{related.length > 0 && <section className="mt-24 border-t border-[#cfe5ea] pt-12"><h2 className="font-display text-3xl text-[#173b61]">More from {product.category}</h2><div className="mt-7 grid gap-5 sm:grid-cols-3">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}</div></Shell>;
}

function Empty({ title, copy, href, action }: { title: string; copy: string; href: string; action: string }) {
  return <div className="mx-auto max-w-xl px-5 py-28 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d9eef2] text-[#1688c6]"><ShoppingBag /></div><h1 className="mt-6 font-display text-4xl text-[#173b61]">{title}</h1><p className="mt-3 text-[#6b8490]">{copy}</p><Link href={href} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#1688c6] px-6 py-3 text-sm font-bold text-white" data-testid="link-empty-action">{action}<ArrowRight size={16} /></Link></div>;
}

function CatalogMessage({ title, copy }: { title: string; copy: string }) {
  return <div className="mx-auto max-w-xl px-5 py-28 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d9eef2] text-[#1688c6]"><Package /></div><h1 className="mt-6 font-display text-4xl text-[#173b61]">{title}</h1><p className="mt-3 text-[#6b8490]">{copy}</p></div>;
}

function Cart() {
  const { products } = useProducts();
  const { cart, update, remove, subtotal } = useCart();
  const shipping = subtotal === 0 || subtotal >= 2999 ? 0 : 100;
  if (!cart.length) return <Shell><Empty title="Your cart is waiting" copy="Bring home something meaningful from the collection." href="/shop" action="Explore the shop" /></Shell>;
  return <Shell><div className="mx-auto max-w-7xl px-5 pb-24 pt-14 lg:px-8"><div className="mb-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Your selection</p><h1 className="mt-3 font-display text-5xl text-[#173b61]">Your cart</h1></div><div className="grid gap-8 lg:grid-cols-[1fr_360px]"><div className="space-y-3">{cart.map((line) => { const product = products.find((item) => item.id === line.productId); if (!product) return null; const key = cartKey(line); const linePrice = line.variant?.price ?? product.price; return <div key={key} className="flex gap-4 rounded-2xl border border-[#cfe5ea] bg-white p-4"><div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#e3f3f7] sm:h-32 sm:w-32"><ProductImage product={product} /></div><div className="flex min-w-0 flex-1 flex-col justify-between"><div><div className="flex justify-between gap-2"><div><Link href={`/product/${product.id}`} className="font-display text-xl text-[#173b61]" data-testid={`link-cart-product-${product.id}`}>{product.name}</Link>{line.variant && <p className="mt-1 text-xs text-[#6b8490]">Size: {line.variant.label}</p>}</div><button onClick={() => remove(key)} className="text-[#849aa2] hover:text-[#b94d45]" aria-label={`Remove ${product.name}`} data-testid={`button-remove-${product.id}`}><Trash2 size={17} /></button></div></div><div className="flex items-center justify-between"><div className="flex items-center rounded-full border border-[#cfe5ea]"><button onClick={() => update(key, line.quantity - 1)} className="p-2 text-[#547080]" aria-label="Decrease item quantity" data-testid={`button-cart-decrease-${product.id}`}><Minus size={13} /></button><span className="w-7 text-center text-sm" data-testid={`text-cart-quantity-${product.id}`}>{line.quantity}</span><button onClick={() => update(key, line.quantity + 1)} className="p-2 text-[#547080]" aria-label="Increase item quantity" data-testid={`button-cart-increase-${product.id}`}><Plus size={13} /></button></div><span className="font-bold text-[#1688c6]" data-testid={`text-line-total-${product.id}`}>{money(linePrice * line.quantity)}</span></div></div></div> })}</div><aside className="h-fit rounded-2xl bg-[#173b61] p-6 text-white"><h2 className="font-display text-2xl">Order summary</h2><div className="mt-7 space-y-4 text-sm"><div className="flex justify-between text-[#c9dce2]"><span>Subtotal</span><span data-testid="text-subtotal">{money(subtotal)}</span></div><div className="flex justify-between text-[#c9dce2]"><span>Shipping</span><span data-testid="text-shipping">{shipping ? money(shipping) : 'Free'}</span></div><div className="border-t border-[#41617b] pt-4"><div className="flex justify-between text-base font-bold"><span>Total</span><span data-testid="text-cart-total">{money(subtotal + shipping)}</span></div></div></div>{shipping > 0 && <p className="mt-5 text-xs leading-5 text-[#bfd5de]">Shipping is free on orders of ₹2,999 or more.</p>}<Link href="/checkout" className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#efb34f] px-5 py-3.5 text-sm font-bold text-[#173b61]" data-testid="link-checkout">Continue to checkout <ArrowRight size={16} /></Link></aside></div></div></Shell>;
}

function About() {
  return <Shell><section className="bg-[#e3f3f7]"><div className="mx-auto max-w-5xl px-5 py-20 text-center lg:py-28"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">The heart of the shop</p><h1 className="mx-auto mt-5 max-w-3xl font-display text-5xl leading-tight text-[#173b61] sm:text-7xl">More Than a Product — <em className="font-normal text-[#1688c6]">A Connection.</em></h1><p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-[#547080]">Handmade with Purpose. Connected with Heart.</p></div></section><section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-2 lg:items-center lg:py-28"><div className="rounded-[2rem] bg-[#f9f1df] p-10 lg:p-16"><HeartHandshake className="mb-12 text-[#c1792c]" size={38} /><p className="font-display text-4xl leading-tight text-[#173b61]">A product carries more when you know where it begins.</p></div><div><p className="text-lg leading-8 text-[#547080]">Mrudugandh Social Connect is a space for handcrafted products and the stories held in them. We celebrate traditional skills, careful making and the simple joy of bringing something meaningful into your everyday.</p><p className="mt-6 text-lg leading-8 text-[#547080]">Every piece in this collection is a reminder that objects can connect us—to craft, to community and to choices that feel a little more considered.</p></div></section><section className="bg-[#173b61] text-white"><div className="mx-auto max-w-6xl px-5 py-20 text-center lg:py-24"><p className="mx-auto max-w-2xl font-display text-4xl leading-tight sm:text-5xl">Choose the things that make room for a story.</p><Link href="/shop" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#efb34f] px-6 py-3.5 text-sm font-bold text-[#173b61]" data-testid="link-about-shop">Explore the collection <ArrowRight size={16} /></Link></div></section></Shell>;
}

function Impact() {
  const items = [{ icon: Users, title: 'Supporting artisans', copy: 'Choosing handmade helps create space for the people and skills behind each product.' }, { icon: Sparkles, title: 'Preserving craftsmanship', copy: 'Traditional skills stay visible and relevant when we bring them into everyday life.' }, { icon: Leaf, title: 'Sustainable choices', copy: 'Thoughtful, lasting objects invite us to buy with care and keep with intention.' }, { icon: HeartHandshake, title: 'Community connection', copy: 'A meaningful purchase can become a small bridge between people, place and purpose.' }];
  return <Shell><div className="mx-auto max-w-7xl px-5 pb-24 pt-14 lg:px-8"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Why it matters</p><h1 className="mt-4 font-display text-5xl leading-tight text-[#173b61] sm:text-7xl">The impact is in the connection.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[#547080]">When you choose a handmade product, you make a thoughtful choice about what—and who—you want to keep close.</p></div><div className="mt-16 grid gap-4 sm:grid-cols-2">{items.map(({ icon: Icon, title, copy }, index) => <div key={title} className={`rounded-2xl p-7 ${index % 2 ? 'bg-[#f9f1df]' : 'bg-[#e3f3f7]'}`}><div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1688c6]"><Icon size={21} /></div><h2 className="mt-10 font-display text-2xl text-[#173b61]">{title}</h2><p className="mt-3 max-w-sm leading-7 text-[#547080]">{copy}</p></div>)}</div><div className="mt-20 grid gap-10 rounded-3xl bg-[#173b61] p-8 text-white lg:grid-cols-[1fr_auto] lg:items-center lg:p-14"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#efb34f]">A simple invitation</p><h2 className="mt-4 max-w-xl font-display text-4xl leading-tight">Bring Home Something Meaningful.</h2><p className="mt-4 max-w-lg leading-7 text-[#c8dce4]">Explore pieces that make everyday spaces feel more personal—and keep the connection moving.</p></div><Link href="/shop" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#efb34f] px-6 py-3.5 text-sm font-bold text-[#173b61]" data-testid="link-impact-shop">Shop with purpose <ArrowRight size={16} /></Link></div></div></Shell>;
}

function Contact() {
  const [sent, setSent] = useState(false);
  return <Shell><div className="mx-auto max-w-6xl px-5 pb-24 pt-14 lg:px-8"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Stay connected</p><h1 className="mt-4 font-display text-5xl text-[#173b61] sm:text-6xl">We would love to hear from you.</h1><p className="mt-5 leading-7 text-[#547080]">Have a question about a product or your order? Send us a note.</p></div><div className="mt-14 grid gap-10 lg:grid-cols-[.7fr_1.3fr]"><div className="rounded-2xl bg-[#e3f3f7] p-7"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Contact details</p><div className="mt-8 space-y-6 text-sm text-[#547080]"><div><p className="font-bold text-[#173b61]">Email</p><p className="mt-1">hello@mrudugandh.example</p></div><div><p className="font-bold text-[#173b61]">Response time</p><p className="mt-1">We will get back to you soon.</p></div></div><p className="mt-12 text-xs leading-5 text-[#6a8390]">These contact details are editable placeholders for this college project.</p></div><form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="rounded-2xl border border-[#cfe5ea] bg-white p-6 shadow-[0_5px_20px_rgba(17,55,91,.04)] sm:p-8">{sent ? <div className="flex min-h-[280px] flex-col items-center justify-center text-center"><CircleCheck className="text-[#1688c6]" size={42} /><h2 className="mt-5 font-display text-3xl text-[#173b61]">Message received.</h2><p className="mt-2 text-[#6a8390]">Thank you for reaching out to Mrudugandh Social Connect.</p><button onClick={() => setSent(false)} type="button" className="mt-6 text-sm font-bold text-[#1688c6]" data-testid="button-send-another">Send another message</button></div> : <><h2 className="font-display text-2xl text-[#173b61]">Write to us</h2><div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="Your name" name="contact-name" required /><Field label="Email address" name="contact-email" type="email" required /></div><label className="mt-5 block text-sm font-semibold text-[#31516a]">Message<textarea required rows={5} className="mt-2 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] p-3 text-sm outline-none focus:border-[#1688c6]" data-testid="input-contact-message" /></label><button type="submit" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1688c6] px-6 py-3.5 text-sm font-bold text-white" data-testid="button-submit-contact">Send message <ArrowRight size={16} /></button></>}</form></div></div></Shell>;
}

function Field({ label, name, type = 'text', required = false, value, onChange }: { label: string; name: string; type?: string; required?: boolean; value?: string; onChange?: (e: ChangeEvent<HTMLInputElement>) => void }) {
  return <label className="block text-sm font-semibold text-[#31516a]">{label}<input name={name} type={type} required={required} value={value} onChange={onChange} className="mt-2 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-3 py-3 text-sm font-normal outline-none focus:border-[#1688c6]" data-testid={`input-${name}`} /></label>;
}

function Checkout() {
  const { products } = useProducts();
  const { cart, subtotal, clear } = useCart();
  const [, setLocation] = useLocation();
  const shipping = subtotal >= 2999 ? 0 : 100;
  const [error, setError] = useState('');
  if (!cart.length) return <Shell><Empty title="Nothing to check out" copy="Your cart is empty. Start with something meaningful." href="/shop" action="Go to shop" /></Shell>;
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const data = new FormData(e.currentTarget); const order = { number: `MRD-${Date.now().toString().slice(-7)}`, name: data.get('name') as string, total: subtotal + shipping, items: cart }; localStorage.setItem('mrudugandh-order', JSON.stringify(order)); clear(); setError(''); setLocation('/order-confirmation'); };
  return <Shell><div className="mx-auto max-w-7xl px-5 pb-24 pt-14 lg:px-8"><div className="mb-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Almost there</p><h1 className="mt-3 font-display text-5xl text-[#173b61]">Checkout</h1></div><div className="grid gap-8 lg:grid-cols-[1fr_360px]"><form onSubmit={submit} className="rounded-2xl border border-[#cfe5ea] bg-white p-6 sm:p-8"><h2 className="font-display text-2xl text-[#173b61]">Delivery details</h2><p className="mt-2 text-sm text-[#6a8390]">This is a demo checkout for the college project.</p>{error && <p className="mt-4 rounded-lg bg-[#fae5e1] p-3 text-sm text-[#a84e47]" data-testid="status-checkout-error">{error}</p>}<div className="mt-7 grid gap-5 sm:grid-cols-2"><Field label="Full name" name="name" required /><Field label="Mobile" name="mobile" type="tel" required /><Field label="Email" name="email" type="email" required /><Field label="PIN code" name="pin" required /></div><label className="mt-5 block text-sm font-semibold text-[#31516a]">Address<textarea required name="address" rows={3} className="mt-2 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] p-3 text-sm font-normal outline-none focus:border-[#1688c6]" data-testid="input-address" /></label><div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="City" name="city" required /><Field label="State" name="state" required /></div><button type="submit" className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-[#1688c6] px-6 py-3.5 text-sm font-bold text-white" data-testid="button-place-order">Place order <ArrowRight size={16} /></button></form><aside className="h-fit rounded-2xl bg-[#f9f1df] p-6"><h2 className="font-display text-2xl text-[#173b61]">Order summary</h2><div className="mt-6 space-y-4">{cart.map((line) => { const p = products.find((item) => item.id === line.productId); if (!p) return null; return <div key={cartKey(line)} className="flex justify-between gap-3 text-sm"><span className="text-[#547080]">{p.name}{line.variant ? ` · ${line.variant.label}` : ''} × {line.quantity}</span><span className="font-semibold text-[#173b61]">{money((line.variant?.price ?? p.price) * line.quantity)}</span></div> })}</div><div className="mt-6 space-y-3 border-t border-[#ead7b6] pt-5 text-sm"><div className="flex justify-between text-[#547080]"><span>Subtotal</span><span data-testid="text-checkout-subtotal">{money(subtotal)}</span></div><div className="flex justify-between text-[#547080]"><span>Shipping</span><span>{shipping ? money(shipping) : 'Free'}</span></div><div className="flex justify-between pt-2 text-base font-bold text-[#173b61]"><span>Total</span><span data-testid="text-checkout-total">{money(subtotal + shipping)}</span></div></div></aside></div></div></Shell>;
}

function Confirmation() {
  const [order] = useState(() => { try { return JSON.parse(localStorage.getItem('mrudugandh-order') || 'null'); } catch { return null; } });
  return <Shell><div className="mx-auto max-w-2xl px-5 py-20 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#d9eef2] text-[#1688c6]"><CircleCheck size={42} /></div><p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Order placed</p><h1 className="mt-3 font-display text-5xl text-[#173b61]">Thank you for choosing handmade.</h1><p className="mx-auto mt-5 max-w-lg leading-7 text-[#547080]">Your demo order has been recorded. Every thoughtful choice helps keep connection and craftsmanship close.</p>{order && <div className="mx-auto mt-10 rounded-2xl bg-[#f9f1df] p-6 text-left"><div className="flex justify-between border-b border-[#ead7b6] pb-4 text-sm"><span className="text-[#6a8390]">Order number</span><strong className="text-[#173b61]" data-testid="text-order-number">{order.number}</strong></div><div className="flex justify-between pt-4 text-sm"><span className="text-[#6a8390]">Order total</span><strong className="text-[#173b61]" data-testid="text-confirmation-total">{money(order.total)}</strong></div></div>}<Link href="/shop" className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#1688c6] px-6 py-3.5 text-sm font-bold text-white" data-testid="link-confirmation-shop">Continue exploring <ArrowRight size={16} /></Link></div></Shell>;
}

function AdminLoginPrompt() {
  return <div className="mx-auto max-w-xl px-5 py-24 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d9eef2] text-[#1688c6]"><ShoppingBag /></div><p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Private area</p><h1 className="mt-3 font-display text-5xl text-[#173b61]">Admin access</h1><p className="mt-4 leading-7 text-[#547080]">Sign in with the approved admin account to manage the Mrudugandh product catalogue.</p><Link href="/sign-in" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1688c6] px-6 py-3.5 text-sm font-bold text-white">Open admin login <ArrowRight size={16} /></Link></div>;
}

function Admin() {
  return <><Show when="signed-in"><AdminPanel /></Show><Show when="signed-out"><AdminLoginPrompt /></Show></>;
}

function SignInPage() {
  const path = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/sign-in`;
  return <div className="flex min-h-screen items-center justify-center bg-[#e3f3f7] px-5 py-12"><SignIn routing="path" path={path} signUpUrl={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sign-up`} appearance={{ theme: shadcn }} /></div>;
}

function SignUpPage() {
  const path = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/sign-up`;
  return <div className="flex min-h-screen items-center justify-center bg-[#e3f3f7] px-5 py-12"><SignUp routing="path" path={path} signInUrl={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sign-in`} appearance={{ theme: shadcn }} /></div>;
}

function Router() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); document.title = location === '/' ? 'Mrudugandh Social Connect' : `Mrudugandh · ${location.slice(1).split('/')[0]}`; }, [location]);
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/shop" component={Shop} /><Route path="/product/:id" component={ProductDetail} /><Route path="/about" component={About} /><Route path="/impact" component={Impact} /><Route path="/contact" component={Contact} /><Route path="/cart" component={Cart} /><Route path="/checkout" component={Checkout} /><Route path="/order-confirmation" component={Confirmation} /><Route path="/admin" component={Admin} /><Route path="/sign-in" component={SignInPage} /><Route path="/sign-in/:rest*" component={SignInPage} /><Route path="/sign-up" component={SignUpPage} /><Route path="/sign-up/:rest*" component={SignUpPage} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

const queryClient = new QueryClient();
function App() {
  return <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY} appearance={{ theme: shadcn }}><QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><ProductsProvider><CartProvider><Router /></CartProvider></ProductsProvider></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider></ClerkProvider>;
}

export default App;