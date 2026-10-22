import { createContext, type ChangeEvent, type FormEvent, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, Show, SignIn, SignUp, useUser, useAuth, UserButton, useClerk } from '@clerk/react';
import { shadcn } from '@clerk/themes';
import { useListProducts, useListOrders, useCreateOrder, useCancelOrder, getListOrdersQueryKey, requestReviewImageUploadUrl, useCreateReview, useListReviews, getListReviewsQueryKey, type Product as ApiProduct, type PublicReview } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, useLocation, useRoute, Router as WouterRouter } from 'wouter';
import { ArrowRight, ChevronLeft, CircleCheck, HeartHandshake, Instagram, Leaf, Menu, Minus, Package, Plus, Search, ShoppingBag, Sparkles, Trash2, Users, X, User } from 'lucide-react';
import logo from '../../../attached_assets/IMG_4539_1788762132648.JPG';
import { AboutContent, InitiativesContent, Tagline } from '@/components/PublicContent';
import AdminPanel from '@/admin/AdminPanel';

import superkingImg1 from '../../../attached_assets/_super_king_bedsheet_1789840344688.jpg';
import superkingImg2 from '../../../attached_assets/PHOTO-2026-09-17-22-39-27_1789840347073.jpg';
import superkingImg3 from '../../../attached_assets/PHOTO-2026-09-17-22-39-27_2_1789840349657.jpg';
import kingImg1 from '../../../attached_assets/PHOTO-2026-09-17-22-11-12_1789840352323.jpg';
import kidsDoharImg1 from '../../../attached_assets/PHOTO-2026-09-19-16-15-50_2_1789840360591.jpg';
import kidsDoharImg2 from '../../../attached_assets/PHOTO-2026-09-19-16-15-50_1789840363146.jpg';
import kidsDoharImg3 from '../../../attached_assets/PHOTO-2026-09-19-16-15-51_1789840358543.jpg';
import plainDoharImg1 from '../../../attached_assets/PHOTO-2026-09-08-19-06-23_1789840368031.jpg';
import plainDoharImg2 from '../../../attached_assets/PHOTO-2026-09-08-19-46-03_1789840371266.jpg';
import plainDoharImg3 from '../../../attached_assets/PHOTO-2026-09-08-19-46-12_1789840374181.jpg';
import plainDoharImg4 from '../../../attached_assets/PHOTO-2026-09-08-19-45-45_1789840377036.jpg';
import kanthaStoleImg1 from '../../../attached_assets/PHOTO-2026-09-22-18-28-26_1790084502109.jpg';
import kanthaStoleImg2 from '../../../attached_assets/PHOTO-2026-09-22-18-27-38_1790084504691.jpg';
import kanthaStoleImg3 from '../../../attached_assets/PHOTO-2026-09-22-18-28-44_1790084508640.jpg';
import bambooCombImg from '../../../attached_assets/PHOTO-2026-09-22-17-33-16_1790084523348.jpg';
import bambooPenImg from '../../../attached_assets/PHOTO-2026-09-22-18-26-29_1790084526801.jpg';
import bambooToothbrushImg1 from '../../../attached_assets/PHOTO-2026-09-22-19-27-53_1790085476414.jpg';
import bambooToothbrushImg2 from '../../../attached_assets/PHOTO-2026-09-22-19-27-53_1790085477882.jpg';
import bambooToothbrushImg3 from '../../../attached_assets/PHOTO-2026-09-22-19-32-33_1790085756950.jpg';
import bambooToothbrushImg4 from '../../../attached_assets/image_1790085782468.png';
import singleBedsheetImg1 from '../../../attached_assets/PHOTO-2026-09-22-17-19-11_1790084634120.jpg';
import singleBedsheetImg2 from '../../../attached_assets/PHOTO-2026-09-22-17-19-11_2_1790084620206.jpg';
import singleBedsheetImg3 from '../../../attached_assets/PHOTO-2026-09-22-17-19-11_3_1790084677725.jpg';

import galleryImg0 from '../../../attached_assets/0_PHOTO-2026-09-19-15-10-28_1789840839387.jpg';
import galleryImg1 from '../../../attached_assets/1_PHOTO-2026-09-19-15-10-29_1789840839387.jpg';
import galleryImg2 from '../../../attached_assets/2_PHOTO-2026-09-19-15-10-32_1789840839387.jpg';
import galleryImg3 from '../../../attached_assets/3_PHOTO-2026-09-19-15-10-33_1789840839387.jpg';
import galleryImg4 from '../../../attached_assets/4_PHOTO-2026-09-19-15-10-34_1789840839387.jpg';
import galleryImg5 from '../../../attached_assets/5_PHOTO-2026-09-19-15-10-37_1789840839387.jpg';
import galleryImg6 from '../../../attached_assets/6_PHOTO-2026-09-19-15-10-38_1789840839387.jpg';
import tanabanaVehiclePoster from '../../../attached_assets/IMG_4272_1790084549207.JPG';
import exhibitionWorkImg1 from '../../../attached_assets/IMG_4621_1790084544307.JPG';
import exhibitionWorkImg2 from '../../../attached_assets/IMG_4315_1790084546580.JPG';
import exhibitionWorkImg3 from '../../../attached_assets/IMG_4695_1790084554786.JPG';
import instagramScanner from '../../../attached_assets/Unknown_1790177140770.jpeg';

type Variant = { label: string; price: number; inventory?: number; imagePaths?: string[]; images?: string[] };
type Product = { id: string; name: string; category: string; price: number; description: string; variants?: Variant[]; image: string | null; images: string[]; imagePath?: string | null; imagePaths?: string[]; inventory?: number; available?: boolean };
type CartLine = { productId: string; quantity: number; variant?: Variant };
type PendingCheckout = { name: string; mobile: string; pin: string; address: string; itemsList: string; totalAmount: number; text: string; url: string };

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;
const categoryOrder = ['Bedsheets', 'Dohars', 'Stoles and Dupattas', 'Tote Bags', 'Bamboo Products', 'Gullak (Piggybank)'];

const exactProductOrder = [
  'bedsheet', 'king-size-bedsheet', 'superking-size-bedsheet',
  'adult-plain-dohar', 'adults-patchwork-dohar', 'kids-dohar', 'dohars-combo-set',
  'dupatta', 'shawl', 'kantha-plain-stole',
  'canvas-tote-bag', 'kalamkari-tote-bag', 'patchwork-tote-bag',
  'bamboo-lights', 'bamboo-pen', 'bamboo-pen-stand', 'bamboo-toothbrush',
  'bamboo-tray', 'bamboo-comb', 'bamboo-three-in-one-stand', 'wooden-base-piggybank'
];

function getSortIndex(id: string) {
  const index = exactProductOrder.indexOf(id);
  return index !== -1 ? index : 999;
}

function mapApiProduct(product: ApiProduct): Product {
  const storedPaths = product.imagePaths?.length
    ? product.imagePaths
    : product.imagePath
      ? [product.imagePath]
      : [];
  const apiImages = storedPaths.map(publicImageUrl).filter((path): path is string => Boolean(path));

  let localImages: string[] = [];
  const lowerName = product.name.toLowerCase();
  if (lowerName.includes('superking') || lowerName.includes('super king')) {
    localImages = [superkingImg1, superkingImg2, superkingImg3];
  } else if (lowerName.includes('king size') || lowerName === 'king bedsheet') {
    localImages = [kingImg1];
  } else if (lowerName.includes('kids dohar')) {
    localImages = [kidsDoharImg1, kidsDoharImg2, kidsDoharImg3];
  } else if (lowerName.includes('plain dohar')) {
    localImages = [plainDoharImg1, plainDoharImg2, plainDoharImg3, plainDoharImg4];
  } else if (product.id === 'kantha-plain-stole') {
    localImages = [kanthaStoleImg1, kanthaStoleImg2, kanthaStoleImg3];
  } else if (product.id === 'bamboo-comb') {
    localImages = [bambooCombImg];
  } else if (product.id === 'bamboo-pen') {
    localImages = [bambooPenImg];
  } else if (product.id === 'bamboo-toothbrush') {
    localImages = [bambooToothbrushImg1, bambooToothbrushImg2, bambooToothbrushImg3, bambooToothbrushImg4];
  }

  const images = apiImages.length > 0 ? apiImages : localImages;
  const variants = product.variants?.map((v) => {
    const images = v.imagePaths?.map(publicImageUrl).filter((path): path is string => Boolean(path)) || [];
    const isSingleBedsheetVariant = product.id === 'bedsheet' && v.label === 'One Piece';
    return {
      ...v,
      images: images.length > 0 ? images : isSingleBedsheetVariant ? [singleBedsheetImg1, singleBedsheetImg2, singleBedsheetImg3] : [],
    };
  });

  return {
    ...product,
    variants,
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

function ProductImage({ product, large = false, variant }: { product: Product; large?: boolean; variant?: Variant }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = product.id === 'bedsheet'
    ? (variant?.images?.[0] ?? (variant?.label === 'Two Pieces' ? null : product.variants?.find((item) => item.label === 'One Piece')?.images?.[0]))
    : (variant?.images?.[0] ?? product.images[0] ?? product.image);
  const frameClass = large ? 'min-h-[360px]' : 'aspect-[4/3]';
  if (image && !imageFailed) return <div className={`w-full overflow-hidden ${frameClass}`}><img src={image} alt={product.name} onError={() => setImageFailed(true)} className="h-full w-full object-cover" /></div>;
  const icon = product.category === 'Bamboo Products' ? <Leaf /> : product.category === 'Dohars' ? <Sparkles /> : <Package />;
  return <div className={`product-placeholder paper-grain ${frameClass} flex flex-col items-center justify-center overflow-hidden bg-[#dff1f6] text-[#174471]`}><div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border border-[#279ddd]/40 bg-[#edf9fb] text-[#1688c6]">{icon}</div><span className="relative z-10 mt-5 max-w-[70%] text-center font-display text-xl leading-tight">{product.name}</span><small className="relative z-10 mt-2 uppercase tracking-[.22em] text-[10px] text-[#3c6e87]">{product.category}</small></div>;
}

function ProductGallery({ product, variant }: { product: Product; variant?: Variant }) {
  const productImages = product.images.length ? product.images : product.image ? [product.image] : [];
  const variantImages = variant?.images?.length ? variant.images : [];
  const images = variantImages.length > 0 ? variantImages : productImages;

  const [selectedImage, setSelectedImage] = useState(images[0] ?? null);

  // Reset selected image when images array changes (e.g. variant change)
  useEffect(() => {
    setSelectedImage(images[0] ?? null);
  }, [images[0], variant?.label]);

  const [failedImages, setFailedImages] = useState<string[]>([]);
  const usableImages = images.filter((image) => !failedImages.includes(image));
  const activeImage = usableImages.includes(selectedImage ?? "") ? selectedImage : usableImages[0] ?? null;

  if (!activeImage) return <ProductImage product={product} variant={variant} large />;
  return <div>
    <div className="overflow-hidden rounded-2xl bg-[#e3f3f7]"><img src={activeImage} alt={product.name} onError={() => setFailedImages((current) => [...new Set([...current, activeImage])])} className="min-h-[360px] w-full object-cover" /></div>
    {usableImages.length > 1 && <div className="mt-3 grid grid-cols-4 gap-2">{usableImages.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImage(image)} className={`overflow-hidden rounded-lg border-2 ${activeImage === image ? 'border-[#1688c6]' : 'border-transparent'}`} aria-label={`View image ${index + 1}`}><img src={image} alt="" className="aspect-square w-full object-cover" /></button>)}</div>}
  </div>;
}

function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const links = [['Shop', '/shop'], ['Our Story', '/about'], ['Our Impact', '/impact'], ['Initiatives', '/initiatives'], ['Contact', '/contact']];
  return <header className="sticky top-0 z-40 border-b border-[#cfe5ea] bg-[#f7fcfc]/95 backdrop-blur-md">
    <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8">
      <Link href="/" className="flex items-center gap-3" data-testid="link-logo"><img src={logo} alt="Mrudugandh Social Connect" className="h-12 w-12 rounded-full object-cover" /><span className="hidden text-sm font-bold tracking-[.16em] text-[#153a67] sm:block">MRUDUGANDH <span className="block text-[9px] font-medium tracking-[.36em] text-[#1996d3]">SOCIAL CONNECT</span></span></Link>
      <nav className="hidden items-center gap-8 md:flex">{links.map(([label, href]) => <Link key={href} href={href} className="text-[13px] font-semibold text-[#31516a] transition-colors hover:text-[#1688c6]" data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</Link>)}<a href={instagramScanner} target="_blank" rel="noopener noreferrer" aria-label="Open Instagram scanner" className="rounded-full text-[#31516a] transition-colors hover:text-[#1688c6]" data-testid="link-instagram"><Instagram size={19} /></a></nav>
      <div className="flex items-center gap-2">
        <a href={instagramScanner} target="_blank" rel="noopener noreferrer" aria-label="Open Instagram scanner" className="flex rounded-full p-2.5 text-[#31516a] hover:bg-[#e7f5f6] md:hidden" data-testid="link-mobile-header-instagram"><Instagram size={19} /></a>
        <Link href="/shop" aria-label="Search the shop" className="rounded-full p-2.5 text-[#31516a] hover:bg-[#e7f5f6]" data-testid="button-search"><Search size={19} /></Link>
        <Link href="/account" aria-label="Your account" className="rounded-full p-2.5 text-[#31516a] hover:bg-[#e7f5f6]" data-testid="link-account"><User size={19} /></Link>
        <Link href="/cart" className="relative rounded-full p-2.5 text-[#31516a] hover:bg-[#e7f5f6]" aria-label="Open cart" data-testid="link-cart"><ShoppingBag size={19} />{count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#efb34f] px-1 text-[10px] font-bold text-[#153a67]" data-testid="text-cart-count">{count}</span>}</Link>
        <button className="rounded-full p-2.5 text-[#31516a] md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" data-testid="button-mobile-menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
    </div>
    {open && <nav className="border-t border-[#cfe5ea] bg-[#f7fcfc] px-5 py-4 md:hidden">
      {links.map(([label, href]) => <Link key={href} onClick={() => setOpen(false)} href={href} className="block border-b border-[#e0edef] py-3 text-sm font-semibold text-[#31516a]" data-testid={`link-mobile-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</Link>)}
      <a href={instagramScanner} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border-b border-[#e0edef] py-3 text-sm font-semibold text-[#31516a]" data-testid="link-mobile-instagram"><Instagram size={16} /> Instagram scanner</a>
    </nav>}
  </header>;
}

function Footer() {
  return <footer className="mt-24 bg-[#14395f] text-[#edf8fa]"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8"><div><img src={logo} alt="Mrudugandh Social Connect" className="mb-5 h-16 w-16 rounded-full object-cover" /><h2 className="font-display text-2xl"><Tagline /></h2><p className="mt-4 max-w-xs text-sm leading-6 text-[#bfd5de]">A shop with a human story, celebrating traditional skills and meaningful craftsmanship.</p><a href={instagramScanner} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#365875] bg-[#1a446e] px-4 py-2 text-sm font-bold text-[#edf8fa] transition-colors hover:bg-[#205080]" data-testid="link-footer-instagram"><Instagram size={16} /> Follow on Instagram</a><p className="mt-2 text-sm text-[#bfd5de]">@mrudungasocialconnect</p></div><div><p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#efb34f]">Explore</p><Link href="/shop" className="block py-1.5 text-sm text-[#d6e6eb] hover:text-white" data-testid="link-footer-shop">Shop products</Link><Link href="/about" className="block py-1.5 text-sm text-[#d6e6eb] hover:text-white" data-testid="link-footer-about">Our story</Link><Link href="/initiatives" className="block py-1.5 text-sm text-[#d6e6eb] hover:text-white" data-testid="link-footer-initiatives">Our initiatives</Link><Link href="/impact" className="block py-1.5 text-sm text-[#d6e6eb] hover:text-white" data-testid="link-footer-impact">Our impact</Link></div><div><p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#efb34f]">Stay connected</p><div className="space-y-1 text-sm leading-6 text-[#bfd5de]"><p>Phone: +91 86683 31267 / +91 88309 65756</p><p>Email: mrudugandh.llp@gmail.com</p><p>Address: C/o - 35, Phatak Baug, Navi Peth, Sadashiv Peth, Pune, Maharashtra 411030</p></div><Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white" data-testid="link-footer-contact">Contact us <ArrowRight size={15} /></Link></div></div><div className="border-t border-[#365875] px-5 py-5 text-center text-xs text-[#a8c3ce]">© {new Date().getFullYear()} Mrudugandh Social Connect. Handmade with purpose.</div></footer>;
}

function Shell({ children }: { children: ReactNode }) {
  return <><Header /><main className="min-h-[calc(100dvh-76px)]">{children}</main><Footer /></>;
}

function ProductCard({ product }: { product: Product }) {
  return <Link href={`/product/${product.id}`} className="group block" data-testid={`card-product-${product.id}`}><div className="relative overflow-hidden rounded-2xl border border-[#cfe5ea] bg-white shadow-[0_5px_20px_rgba(17,55,91,.04)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_15px_35px_rgba(17,55,91,.12)]"><ProductImage product={product} /><span className="absolute left-3 top-3 rounded-full bg-[#f7fcfc]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#277593]">{product.category}</span><div className="flex items-end justify-between gap-3 p-4"><div><h3 className="font-display text-lg text-[#173b61]">{product.name}</h3><p className="mt-1 text-xs text-[#6a8390]">{product.variants?.length ? 'Two sizes available' : 'Handmade product'}</p></div><span className="whitespace-nowrap text-sm font-bold text-[#1688c6]" data-testid={`text-price-${product.id}`}>{money(product.price)}{product.variants?.length ? <small className="font-normal text-[10px] text-[#6a8390]"> onwards</small> : null}</span></div></div></Link>;
}

function Home() {
  const { products, isLoading, error } = useProducts();
  const { data: rawReviews, isLoading: reviewsLoading } = useListReviews();
const reviews = rawReviews ?? [];
  const visibleProducts = products.filter((product) => product.available !== false);
  const featured = visibleProducts.filter((product) => ['kalamkari-tote-bag', 'bamboo-lights', 'adults-patchwork-dohar'].includes(product.id));
  const categoryCards = categoryOrder.map((category) => {
    const directMatch = visibleProducts.find((product) => product.category === category && product.images[0]);
    const fallbackMatch = visibleProducts.find((product) => product.images[0]);
    return { category, image: directMatch?.images[0] ?? fallbackMatch?.images[0] ?? null };
  });
  if (isLoading) return <Shell><CatalogMessage title="Loading the collection…" copy="Fetching the latest products." /></Shell>;
  if (error) return <Shell><CatalogMessage title="The collection is temporarily unavailable" copy="Please refresh in a moment while we reconnect to the catalogue." /></Shell>;
  return <Shell><section className="relative overflow-hidden bg-[#e3f3f7]"><div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-28"><div className="reveal"><p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[.24em] text-[#1688c6]"><span className="h-px w-8 bg-[#efb34f]" /> A thoughtful marketplace</p><h1 className="max-w-xl font-display text-[clamp(3.4rem,8vw,6.7rem)] leading-[.94] tracking-[-.04em] text-[#153a67]">Handmade with <em className="font-normal text-[#1688c6]">purpose.</em><br />Connected with heart.</h1><p className="mt-7 max-w-lg text-base leading-7 text-[#496a7a]">Discover handcrafted products that celebrate traditional skills, support local artisans and bring meaningful craftsmanship into everyday life.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/shop" className="inline-flex items-center gap-3 rounded-full bg-[#1688c6] px-6 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5" data-testid="link-hero-shop">Explore the collection <ArrowRight size={17} /></Link><Link href="/about" className="inline-flex items-center gap-2 rounded-full border border-[#9bcbd8] px-6 py-3.5 text-sm font-bold text-[#31516a] hover:bg-white/50" data-testid="link-hero-story">Our story</Link></div></div><div className="reveal reveal-delay-2 relative flex min-h-[390px] items-center justify-center lg:min-h-[520px]"><div className="absolute h-[340px] w-[340px] rounded-full border border-[#8bcada] lg:h-[480px] lg:w-[480px]" /><div className="absolute h-[270px] w-[270px] rounded-full bg-[#c5e7ed] lg:h-[390px] lg:w-[390px]" /><div className="relative z-10 flex h-60 w-60 rotate-3 flex-col items-center justify-center rounded-[45%_55%_55%_45%] border-8 border-[#f7fcfc] bg-[#edbd58] text-center shadow-[0_20px_50px_rgba(21,58,103,.15)] lg:h-80 lg:w-80"><Sparkles className="mb-5 text-[#153a67]" size={38} /><span className="font-display text-3xl leading-tight text-[#153a67] lg:text-4xl">Objects<br />with a story</span><span className="mt-4 text-[10px] font-bold uppercase tracking-[.22em] text-[#31516a]">made by hand</span></div><div className="absolute bottom-8 left-4 z-10 rounded-xl bg-white px-4 py-3 shadow-lg lg:left-2"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#1688c6]">Everyday, meaningful</p><p className="mt-1 font-display text-base text-[#173b61]">Made to be kept</p></div></div></div></section><section className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="mb-9 flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Explore Our Collections</p><h2 className="mt-2 font-display text-4xl text-[#173b61]">Find something to keep close</h2></div><Link href="/shop" className="inline-flex items-center gap-2 text-sm font-bold text-[#1688c6]" data-testid="link-view-all">View all products <ArrowRight size={16} /></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{categoryCards.map(({ category, image }, index) => <Link key={category} href={`/shop?category=${encodeURIComponent(category)}`} className="group relative flex min-h-[145px] flex-col justify-between overflow-hidden rounded-2xl p-5 transition-transform hover:-translate-y-1" data-testid={`link-category-${category.toLowerCase().replaceAll(' ', '-')}`}>{image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}<div className="absolute inset-0 bg-[#173b61]/45 transition-colors group-hover:bg-[#173b61]/55" /><span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-[#1688c6]">{index === 1 ? <Leaf size={18} /> : index === 4 ? <Sparkles size={18} /> : <Package size={18} />}</span><span className="relative font-display text-xl text-white">{category}</span></Link>)}</div></section><section className="bg-[#f9f1df]"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#c1792c]">A few favourites</p><h2 className="mt-2 font-display text-4xl text-[#173b61]">Made for your everyday</h2></div><Link href="/shop" className="inline-flex items-center gap-2 text-sm font-bold text-[#1688c6]" data-testid="link-featured-shop">Shop all <ArrowRight size={16} /></Link></div><div className="grid gap-5 md:grid-cols-3">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div></div></section><ReviewsSection reviews={reviews.data} isLoading={reviews.isLoading} /><section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8"><div className="relative min-h-[300px] overflow-hidden rounded-[2rem] bg-[#174471] p-8 text-[#f5fbfc]"><div className="absolute -right-16 -top-20 h-60 w-60 rounded-full border-[22px] border-[#299cdb]/50" /><div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full border-[18px] border-[#efb34f]/80" /><HeartHandshake className="relative z-10 mb-16 text-[#efb34f]" size={35} /><p className="relative z-10 max-w-xs font-display text-3xl leading-tight">When you choose handmade, you choose a living tradition.</p></div><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Why Mrudugandh</p><h2 className="mt-3 max-w-lg font-display text-4xl leading-tight text-[#173b61]">A small choice can carry a long way.</h2><p className="mt-5 max-w-xl leading-7 text-[#547080]">We make space for traditional skills, thoughtful materials and the people behind every piece. This is not just a catalogue. It is a way to stay connected to craft.</p><Link href="/impact" className="mt-7 inline-flex items-center gap-3 rounded-full bg-[#173b61] px-6 py-3.5 text-sm font-bold text-white" data-testid="link-impact-cta">See our impact <ArrowRight size={17} /></Link></div></section></Shell>;
}

function ReviewsSection({ reviews, isLoading }: { reviews: PublicReview[] | undefined; isLoading: boolean }) {
  const safeReviews = reviews ?? [];
  return <section className="bg-[#e3f3f7]" data-testid="section-customer-reviews"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">From our customers</p><h2 className="mt-3 font-display text-4xl text-[#173b61]">Stories shared with us</h2><p className="mt-4 leading-7 text-[#547080]">Thoughts and photographs from people who brought our handmade pieces home.</p></div>{isLoading ? <div className="mt-10 grid gap-5 md:grid-cols-3" data-testid="status-reviews-loading">{[0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl bg-white/70" />)}</div> : reviews?.length ? <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{safeReviews.map((review) =>article key={review.id} className="overflow-hidden rounded-2xl border border-[#cfe5ea] bg-white shadow-[0_5px_20px_rgba(17,55,91,.04)]" data-testid={`card-review-${review.id}`}>{review.imagePaths.length > 0 && <div className="grid grid-cols-2 gap-1 bg-[#d2e9ed]">{review.imagePaths.map((path, index) => <img key={path} src={publicImageUrl(path) || path} alt={`Purchase shared by ${review.reviewerName}`} className={`h-44 w-full object-cover ${review.imagePaths.length === 1 ? 'col-span-2' : ''}`} data-testid={`img-review-${review.id}-${index}`} />)}</div>}<div className="p-6"><p className="leading-7 text-[#31516a]" data-testid={`text-review-message-${review.id}`}>“{review.message}”</p><div className="mt-5 flex items-center justify-between gap-3 border-t border-[#e2eff1] pt-4"><p className="font-bold text-[#173b61]" data-testid={`text-reviewer-${review.id}`}>{review.reviewerName}</p><time className="text-xs text-[#6a8390]" dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</time></div>{review.adminReply && <div className="mt-4 rounded-xl bg-[#f9f1df] p-4" data-testid={`text-admin-reply-${review.id}`}><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#c1792c]">Reply from Mrudugandh</p><p className="mt-2 text-sm leading-6 text-[#547080]">{review.adminReply}</p></div>}</div></article>)}</div> : <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-dashed border-[#9ecbd5] bg-white/50 px-6 py-12 text-center" data-testid="status-reviews-empty"><HeartHandshake className="mx-auto text-[#1688c6]" size={30} /><h3 className="mt-4 font-display text-2xl text-[#173b61]">The first stories are on their way.</h3><p className="mt-2 text-sm leading-6 text-[#6a8390]">Purchased something you love? Share your experience and it may appear here after review.</p><Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#1688c6]" data-testid="link-leave-review">Leave a review <ArrowRight size={16} /></Link></div>}</div></section>;
}

function Shop() {
  const { products, isLoading, error } = useProducts();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('featured');
  const visibleProducts = products.filter((product) => product.available !== false);
  const categoryOptions = useMemo(() => ['All', ...categoryOrder.filter((item) => visibleProducts.some((product) => product.category === item))], [visibleProducts]);
  const filtered = useMemo(() => visibleProducts.filter((p) => (category === 'All' || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => {
    if (sort === 'featured') {
      const aIndex = getSortIndex(a.id);
      const bIndex = getSortIndex(b.id);
      if (aIndex !== bIndex) return aIndex - bIndex;
      const categoryDifference = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      if (categoryDifference) return categoryDifference;
    }
    if (sort === 'low') return a.price - b.price;
    if (sort === 'high') return b.price - a.price;
    return a.name.localeCompare(b.name);
  }), [visibleProducts, query, category, sort]);
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

  useEffect(() => {
    if (product) {
      setVariant(product.variants?.[0]);
      setQuantity(1);
    }
  }, [product?.id]);

  if (isLoading) return <Shell><CatalogMessage title="Loading product…" copy="Fetching the latest product details." /></Shell>;
  if (error) return <Shell><CatalogMessage title="Product details are temporarily unavailable" copy="Please refresh in a moment while we reconnect to the catalogue." /></Shell>;
  if (!product) return <Shell><Empty title="Product not found" copy="This product is not in the collection." href="/shop" action="Back to shop" /></Shell>;
  if (product.available === false) return <Shell><Empty title="Product unavailable" copy="This product is not currently available." href="/shop" action="Back to shop" /></Shell>;
  const price = variant?.price ?? product.price;
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);
  return <Shell><div className="mx-auto max-w-7xl px-5 pb-20 pt-10 lg:px-8"><Link href="/shop" className="mb-8 inline-flex items-center gap-1 text-sm font-semibold text-[#1688c6]" data-testid="link-back-shop"><ChevronLeft size={17} /> Back to shop</Link><div className="grid gap-12 lg:grid-cols-2 lg:gap-20"><div className="rounded-3xl bg-[#e3f3f7] p-4"><ProductGallery product={product} variant={variant} /></div><div className="self-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">{product.category}</p><h1 className="mt-3 font-display text-5xl leading-tight text-[#173b61]">{product.name}</h1><p className="mt-4 text-2xl font-semibold text-[#1688c6]" data-testid="text-product-price">{money(price)}</p><p className="mt-6 max-w-md leading-7 text-[#547080]">{product.description}</p>{product.variants?.length ? <div className="mt-8"><p className="mb-3 text-xs font-bold uppercase tracking-[.15em] text-[#547080]">Choose a size</p><div className="flex gap-3">{product.variants.map((item) => <button key={item.label} onClick={() => setVariant(item)} className={`rounded-xl border px-5 py-3 text-sm font-semibold ${variant?.label === item.label ? 'border-[#1688c6] bg-[#e3f3f7] text-[#1688c6]' : 'border-[#cfe5ea] bg-white text-[#547080]'}`} data-testid={`button-variant-${item.label.toLowerCase()}`}>{item.label} <span className="ml-2 text-xs">{money(item.price)}</span></button>)}</div></div> : null}<div className="mt-8 flex gap-3"><div className="flex items-center rounded-full border border-[#cfe5ea] bg-white"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 text-[#547080]" aria-label="Decrease quantity" data-testid="button-decrease-quantity"><Minus size={16} /></button><span className="w-8 text-center text-sm font-bold" data-testid="text-product-quantity">{quantity}</span><button onClick={() => setQuantity(quantity + 1)} className="p-3 text-[#547080]" aria-label="Increase quantity" data-testid="button-increase-quantity"><Plus size={16} /></button></div><button onClick={() => { add(product.id, quantity, variant); setLocation('/cart'); }} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1688c6] px-6 py-3 text-sm font-bold text-white hover:bg-[#1179ae]" data-testid="button-add-to-cart"><ShoppingBag size={17} /> Add to cart</button></div></div></div>{related.length > 0 && <section className="mt-24 border-t border-[#cfe5ea] pt-12"><h2 className="font-display text-3xl text-[#173b61]">More from {product.category}</h2><div className="mt-7 grid gap-5 sm:grid-cols-3">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}</div></Shell>;
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
  return <Shell><div className="mx-auto max-w-7xl px-5 pb-24 pt-14 lg:px-8"><div className="mb-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Your selection</p><h1 className="mt-3 font-display text-5xl text-[#173b61]">Your cart</h1></div><div className="grid gap-8 lg:grid-cols-[1fr_360px]"><div className="space-y-3">{cart.map((line) => { const product = products.find((item) => item.id === line.productId); if (!product) return null; const key = cartKey(line); const linePrice = line.variant?.price ?? product.price; return <div key={key} className="flex gap-4 rounded-2xl border border-[#cfe5ea] bg-white p-4"><div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#e3f3f7] sm:h-32 sm:w-32"><ProductImage product={product} variant={product.variants?.find((item) => item.label === line.variant?.label)} /></div><div className="flex min-w-0 flex-1 flex-col justify-between"><div><div className="flex justify-between gap-2"><div><Link href={`/product/${product.id}`} className="font-display text-xl text-[#173b61]" data-testid={`link-cart-product-${product.id}`}>{product.name}</Link>{line.variant && <p className="mt-1 text-xs text-[#6b8490]">Size: {line.variant.label}</p>}</div><button onClick={() => remove(key)} className="text-[#849aa2] hover:text-[#b94d45]" aria-label={`Remove ${product.name}`} data-testid={`button-remove-${product.id}`}><Trash2 size={17} /></button></div></div><div className="flex items-center justify-between"><div className="flex items-center rounded-full border border-[#cfe5ea]"><button onClick={() => update(key, line.quantity - 1)} className="p-2 text-[#547080]" aria-label="Decrease item quantity" data-testid={`button-cart-decrease-${product.id}`}><Minus size={13} /></button><span className="w-7 text-center text-sm" data-testid={`text-cart-quantity-${product.id}`}>{line.quantity}</span><button onClick={() => update(key, line.quantity + 1)} className="p-2 text-[#547080]" aria-label="Increase item quantity" data-testid={`button-cart-increase-${product.id}`}><Plus size={13} /></button></div><span className="font-bold text-[#1688c6]" data-testid={`text-line-total-${product.id}`}>{money(linePrice * line.quantity)}</span></div></div></div> })}</div><aside className="h-fit rounded-2xl bg-[#173b61] p-6 text-white"><h2 className="font-display text-2xl">Order summary</h2><div className="mt-7 space-y-4 text-sm"><div className="flex justify-between text-[#c9dce2]"><span>Subtotal</span><span data-testid="text-subtotal">{money(subtotal)}</span></div><div className="flex justify-between text-[#c9dce2]"><span>Shipping</span><span data-testid="text-shipping">{shipping ? money(shipping) : 'Free'}</span></div><div className="border-t border-[#41617b] pt-4"><div className="flex justify-between text-base font-bold"><span>Total</span><span data-testid="text-cart-total">{money(subtotal + shipping)}</span></div></div></div>{shipping > 0 && <p className="mt-5 text-xs leading-5 text-[#bfd5de]">Shipping is free on orders of ₹2,999 or more.</p>}<Link href="/checkout" className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#efb34f] px-5 py-3.5 text-sm font-bold text-[#173b61]" data-testid="link-checkout">Continue to checkout <ArrowRight size={16} /></Link></aside></div></div></Shell>;
}

function About() { return <AboutContent Shell={Shell} />; }

function Impact() {
  const items = [{ icon: Users, title: 'Supporting artisans', copy: 'Choosing handmade helps create space for the people and skills behind each product.' }, { icon: Sparkles, title: 'Preserving craftsmanship', copy: 'Traditional skills stay visible and relevant when we bring them into everyday life.' }, { icon: Leaf, title: 'Sustainable choices', copy: 'Thoughtful, lasting objects invite us to buy with care and keep with intention.' }, { icon: HeartHandshake, title: 'Community connection', copy: 'A meaningful purchase can become a small bridge between people, place and purpose.' }];
  const gallery = [galleryImg0, galleryImg1, galleryImg2, galleryImg6];

  return <Shell><div className="mx-auto max-w-7xl px-5 pb-24 pt-14 lg:px-8"><div className="max-w-4xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Why it matters</p><h1 className="mt-4 font-display text-5xl leading-tight text-[#173b61] sm:text-7xl">The impact is in the connection.</h1><p className="mt-6 max-w-4xl text-lg leading-8 text-[#547080]">Mrudugandh has developed a growing ecosystem of organisations and individual beneficiaries whose products and skills we support through market access and promotion. We source and promote bamboo products from Sampurna Bamboo Kendra, Melghat, which are made by tribals, supporting community-based livelihoods. We collaborate with Corvee Foundation and ICS Foundation, Pune, promoting products created by their community beneficiaries, including those from denotified tribal communities.</p></div>

  <div className="mt-16 grid gap-4 sm:grid-cols-2">{items.map(({ icon: Icon, title, copy }, index) => <div key={title} className={`rounded-2xl p-7 ${index % 2 ? 'bg-[#f9f1df]' : 'bg-[#e3f3f7]'}`}><div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1688c6]"><Icon size={21} /></div><h2 className="mt-10 font-display text-2xl text-[#173b61]">{title}</h2><p className="mt-3 max-w-sm leading-7 text-[#547080]">{copy}</p></div>)}</div>

  <div className="mt-20">
    <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6] mb-6">Moments of impact</p>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {gallery.map((img, i) => (
        <div key={i} className={`overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2 row-span-2' : ''} ${i === 3 ? 'sm:col-span-2' : ''}`}>
          <img src={img} alt="Impact moment" className="w-full h-full object-cover aspect-square transition-transform duration-700 hover:scale-105" />
        </div>
      ))}
    </div>
  </div>

  <div className="mt-20 grid gap-10 rounded-3xl bg-[#173b61] p-8 text-white lg:grid-cols-[1fr_auto] lg:items-center lg:p-14"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#efb34f]">A simple invitation</p><h2 className="mt-4 max-w-xl font-display text-4xl leading-tight">Bring Home Something Meaningful.</h2><p className="mt-4 max-w-lg leading-7 text-[#c8dce4]">Explore pieces that make everyday spaces feel more personal—and keep the connection moving.</p></div><Link href="/shop" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#efb34f] px-6 py-3.5 text-sm font-bold text-[#173b61]" data-testid="link-impact-shop">Shop with purpose <ArrowRight size={16} /></Link></div></div></Shell>;
}

function LegacyContact() {
  const [sent, setSent] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);

  return <Shell><div className="mx-auto max-w-6xl px-5 pb-24 pt-14 lg:px-8"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Stay connected</p><h1 className="mt-4 font-display text-5xl text-[#173b61] sm:text-6xl">We would love to hear from you.</h1><p className="mt-5 leading-7 text-[#547080]">Have a question about a product or your order? Send us a note, or leave a review.</p></div><div className="mt-14 grid gap-10 lg:grid-cols-[.7fr_1.3fr]"><div className="rounded-2xl bg-[#e3f3f7] p-7"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Contact details</p><div className="mt-8 space-y-6 text-sm text-[#547080]"><div><p className="font-bold text-[#173b61]">Phone</p><p className="mt-1">+91 86683 31267 / +91 88309 65756</p></div><div><p className="font-bold text-[#173b61]">Email</p><p className="mt-1">mrudugandh.lIp@gmail.com</p></div><div><p className="font-bold text-[#173b61]">Address</p><p className="mt-1">C/o - 35, Phatak Baug, Navi Peth, Sadashiv Peth, Pune, Maharashtra 411030</p></div></div></div><form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="rounded-2xl border border-[#cfe5ea] bg-white p-6 shadow-[0_5px_20px_rgba(17,55,91,.04)] sm:p-8">{sent ? <div className="flex min-h-[280px] flex-col items-center justify-center text-center"><Sparkles className="text-[#1688c6]" size={42} /><h2 className="mt-5 font-display text-3xl text-[#173b61]">Review received!</h2><p className="mt-2 text-[#6a8390]">Thank you for sharing your experience with us. It means the world to our artisans.</p><button onClick={() => { setSent(false); setPhoto(null); }} type="button" className="mt-6 text-sm font-bold text-[#1688c6]" data-testid="button-send-another">Submit another review</button></div> : <><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Share your experience</p><h2 className="mt-2 font-display text-2xl text-[#173b61]">Give us a review about your product!</h2><div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="Your name" name="contact-name" required /><Field label="Email address" name="contact-email" type="email" required /></div>

  <div className="mt-5">
    <label className="block text-sm font-semibold text-[#31516a]">Purchase Photo (optional)</label>
    <div className="mt-2 flex items-center gap-4">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-4 py-3 text-sm text-[#547080] hover:border-[#1688c6] transition-colors">
        <Package size={16} /> Choose Image
        <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
      </label>
      {photo && <div className="flex items-center gap-3 overflow-hidden rounded-lg border border-[#cfe5ea] pr-3 bg-white">
        <div className="h-12 w-12 shrink-0 bg-[#e3f3f7]">
          <img src={URL.createObjectURL(photo)} alt="Preview" className="h-full w-full object-cover" />
        </div>
        <span className="truncate text-xs font-semibold text-[#31516a] max-w-[120px]">{photo.name}</span>
        <button type="button" onClick={() => setPhoto(null)} className="text-[#a84e47] hover:text-[#7d3a35]"><X size={14} /></button>
      </div>}
    </div>
  </div>

  <label className="mt-5 block text-sm font-semibold text-[#31516a]">Your Review<textarea required rows={4} className="mt-2 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] p-3 text-sm outline-none focus:border-[#1688c6]" data-testid="input-contact-message" placeholder="What do you think about the product?" /></label><button type="submit" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1688c6] px-6 py-3.5 text-sm font-bold text-white" data-testid="button-submit-contact">Submit Review <ArrowRight size={16} /></button></>}</form></div></div></Shell>;
}

function Contact() {
  const { isSignedIn } = useAuth();
  const createReview = useCreateReview();
  const queryClient = useQueryClient();
  const [photo, setPhoto] = useState<File | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSignedIn) { setError("Please sign in before submitting a review."); return; }
    setBusy(true); setError("");
    try {
      const form = new FormData(event.currentTarget);
      const imagePaths: string[] = [];
      if (photo) {
        const upload = await requestReviewImageUploadUrl({ name: photo.name, size: photo.size, contentType: photo.type as any });
        const response = await fetch(upload.uploadURL, { method: "PUT", headers: { "Content-Type": photo.type }, body: photo });
        if (!response.ok) throw new Error("Could not upload the purchase photo.");
        imagePaths.push(upload.objectPath);
      }
      await createReview.mutateAsync({ data: { message: String(form.get("message") || "").trim(), imagePaths } });
      await queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
      setSent(true); setPhoto(null); event.currentTarget.reset();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not submit your review. Please try again."); }
    finally { setBusy(false); }
  };
  return <Shell><div className="mx-auto max-w-6xl px-5 pb-24 pt-14 lg:px-8"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Stay connected</p><h1 className="mt-4 font-display text-5xl text-[#173b61] sm:text-6xl">We would love to hear from you.</h1><p className="mt-5 leading-7 text-[#547080]">Have a question about a product or your order? Send us a note, or leave a review.</p></div><div className="mt-14 grid gap-10 lg:grid-cols-[.7fr_1.3fr]"><div className="rounded-2xl bg-[#e3f3f7] p-7"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Contact details</p><div className="mt-8 space-y-6 text-sm text-[#547080]"><div><p className="font-bold text-[#173b61]">Phone</p><p className="mt-1">+91 86683 31267 / +91 88309 65756</p></div><div><p className="font-bold text-[#173b61]">Email</p><p className="mt-1">mrudugandh.llp@gmail.com</p></div><div><p className="font-bold text-[#173b61]">Address</p><p className="mt-1">C/o - 35, Phatak Baug, Navi Peth, Sadashiv Peth, Pune, Maharashtra 411030</p></div></div></div><form onSubmit={submit} className="rounded-2xl border border-[#cfe5ea] bg-white p-6 shadow-[0_5px_20px_rgba(17,55,91,.04)] sm:p-8">{sent ? <div className="flex min-h-[280px] flex-col items-center justify-center text-center"><Sparkles className="text-[#1688c6]" size={42} /><h2 className="mt-5 font-display text-3xl text-[#173b61]">Review received!</h2><p className="mt-2 text-[#6a8390]">Thank you for sharing your experience with us. It means the world to our artisans.</p><button onClick={() => setSent(false)} type="button" className="mt-6 text-sm font-bold text-[#1688c6]">Submit another review</button></div> : <><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Share your experience</p><h2 className="mt-2 font-display text-2xl text-[#173b61]">Give us a review about your product!</h2>{!isSignedIn && <p className="mt-4 rounded-lg bg-[#f9f1df] p-3 text-sm text-[#8a6835]">Please sign in to submit a review.</p>}{error && <p className="mt-4 rounded-lg bg-[#fae5e1] p-3 text-sm text-[#a84e47]">{error}</p>}<label className="mt-6 block text-sm font-semibold text-[#31516a]">Purchase Photo (optional)<input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="mt-2 block w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] p-3 text-sm" />{photo && <span className="mt-1 block text-xs text-[#6a8390]">{photo.name}</span>}</label><label className="mt-5 block text-sm font-semibold text-[#31516a]">Your Review<textarea name="message" required rows={4} className="mt-2 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] p-3 text-sm outline-none focus:border-[#1688c6]" placeholder="What do you think about the product?" /></label><button disabled={!isSignedIn || busy} type="submit" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1688c6] px-6 py-3.5 text-sm font-bold text-white disabled:opacity-50">{busy ? "Submitting…" : "Submit Review"} <ArrowRight size={16} /></button></>}</form></div></div></Shell>;
}

function Field({ label, name, type = 'text', required = false, value, onChange }: { label: string; name: string; type?: string; required?: boolean; value?: string; onChange?: (e: ChangeEvent<HTMLInputElement>) => void }) {
  return <label className="block text-sm font-semibold text-[#31516a]">{label}<input name={name} type={type} required={required} value={value} onChange={onChange} className="mt-2 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-3 py-3 text-sm font-normal outline-none focus:border-[#1688c6]" data-testid={`input-${name}`} /></label>;
}

function Checkout() {
  const { products } = useProducts();
  const { cart, subtotal, clear } = useCart();
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const createOrder = useCreateOrder();
  const cancelOrder = useCancelOrder();
  const [, setLocation] = useLocation();
  const shipping = subtotal >= 2999 ? 0 : 100;
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [persistedOrderId, setPersistedOrderId] = useState<string | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckout | null>(null);

  if (!cart.length && !showSuccess) return <Shell><Empty title="Nothing to check out" copy="Your cart is empty. Start with something meaningful." href="/shop" action="Go to shop" /></Shell>;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = data.get('name') as string;
    const mobile = data.get('mobile') as string;
    const pin = data.get('pin') as string;
    const address = data.get('address') as string;

    const itemsList = cart.map(line => {
      const p = products.find(item => item.id === line.productId);
      return `${p?.name || 'Item'}${line.variant ? ` (${line.variant.label})` : ''} x ${line.quantity}`;
    }).join(', ');

    const totalAmount = subtotal + shipping;
    const text = `New Order Request from Website! Items: ${itemsList}. Total: ₹${totalAmount}. Address: ${name}, ${address}, PIN: ${pin}, Phone: ${mobile}.`;

    const url = `https://wa.me/918668331267?text=${encodeURIComponent(text)}`;
    if (!isSignedIn) {
      setLocation('/sign-in');
      return;
    }
    setShowDecision(true);
    setError('');
    setPendingCheckout({ name, mobile, pin, address, itemsList, totalAmount, text, url });
  };

  const proceed = async () => {
    const data = pendingCheckout;
    if (isSubmitting || !data) return;
    const whatsappWindow = window.open('', '_blank');
    if (!whatsappWindow) {
      setError('Popup blocked. Please allow popups for this site to open WhatsApp.');
      return;
    }
    setIsSubmitting(true);
    try {
      const order = persistedOrderId ? null : await createOrder.mutateAsync({
        data: {
          fullName: data.name,
          phone: data.mobile,
          pin: data.pin,
          address: data.address,
          items: cart.map((line) => ({
            productId: line.productId,
            variant: line.variant?.label ?? null,
            quantity: line.quantity,
          })),
        },
      });
      if (order) setPersistedOrderId(order.id);
      whatsappWindow.location.href = data.url;
      localStorage.setItem('mrudugandh-order', JSON.stringify({ number: order?.number ?? persistedOrderId, total: order?.total ?? data.totalAmount }));
      clear();
      setPendingCheckout(null);
      setShowDecision(false);
      setShowSuccess(true);
    } catch (err) {
      whatsappWindow.close();
      setError(err instanceof Error ? err.message : 'Could not save your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelCheckout = async () => {
    const reason = cancelReason === 'Other' ? otherReason.trim() : cancelReason;
    const data = pendingCheckout;
    if (!reason || isSubmitting || !data) return;
    setIsSubmitting(true);
    try {
      const created = persistedOrderId ? { id: persistedOrderId } : await createOrder.mutateAsync({
        data: {
          fullName: data.name, phone: data.mobile, pin: data.pin, address: data.address,
          items: cart.map((line) => ({ productId: line.productId, variant: line.variant?.label ?? null, quantity: line.quantity })),
        },
      });
      await cancelOrder.mutateAsync({ id: created.id, data: { cancellationReason: reason } });
      setError('');
      clear();
      setPendingCheckout(null);
      setShowCancellation(false);
      setShowDecision(false);
      setLocation('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the cancellation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <Shell>
    {showDecision && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#153a67]/60 p-5 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
          <h2 className="font-display text-2xl text-[#173b61]">Do you want to proceed to WhatsApp to confirm your order and make the payment?</h2>
          <div className="mt-7 grid gap-3">
            <button disabled={isSubmitting} onClick={proceed} className="rounded-full bg-[#1688c6] px-5 py-3.5 text-sm font-bold text-white disabled:opacity-50">Yes, Proceed to WhatsApp</button>
            <button disabled={isSubmitting} onClick={() => setShowCancellation(true)} className="rounded-full border border-[#cfe5ea] px-5 py-3.5 text-sm font-bold text-[#173b61] disabled:opacity-50">No, Cancel Order</button>
          </div>
        </div>
      </div>
    )}
    {showCancellation && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#153a67]/60 p-5 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
          <h2 className="font-display text-2xl text-[#173b61]">Why are you cancelling?</h2>
          <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="mt-5 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-3 py-3 text-sm">
            <option value="">Select a reason</option><option>Ordered by mistake</option><option>Changed my mind</option><option>Testing</option><option>Other</option>
          </select>
          {cancelReason === 'Other' && <textarea value={otherReason} onChange={(e) => setOtherReason(e.target.value)} required rows={3} placeholder="Tell us why" className="mt-3 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] p-3 text-sm" />}
          <div className="mt-6 flex gap-3">
            <button disabled={isSubmitting || !cancelReason || (cancelReason === 'Other' && !otherReason.trim())} onClick={cancelCheckout} className="flex-1 rounded-full bg-[#a84e47] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">Confirm cancellation</button>
            <button disabled={isSubmitting} onClick={() => setShowCancellation(false)} className="rounded-full border border-[#cfe5ea] px-4 py-3 text-sm font-bold text-[#173b61]">Back</button>
          </div>
        </div>
      </div>
    )}
    {showSuccess && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#153a67]/60 p-5 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e3f3f7] text-[#1688c6]">
            <CircleCheck size={32} />
          </div>
          <h2 className="mt-5 font-display text-2xl text-[#173b61]">Request Sent</h2>
          <p className="mt-3 text-[#547080] leading-6">Your order request has been sent! Our team will message you on WhatsApp shortly to confirm your order and share the payment QR code.</p>
          <button
            onClick={() => setLocation('/order-confirmation')}
            className="mt-8 flex w-full justify-center rounded-full bg-[#1688c6] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#157bb3]"
          >
            Continue
          </button>
        </div>
      </div>
    )}
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-14 lg:px-8">
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Almost there</p>
        <h1 className="mt-3 font-display text-5xl text-[#173b61]">Checkout</h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="rounded-2xl border border-[#cfe5ea] bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl text-[#173b61]">Delivery details</h2>
          <p className="mt-2 text-sm text-[#6a8390]">This is a demo checkout for the college project.</p>
          {error && <p className="mt-4 rounded-lg bg-[#fae5e1] p-3 text-sm text-[#a84e47]" data-testid="status-checkout-error">{error}</p>}
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <Field label="Full Name" name="name" required />
            <Field label="Phone Number" name="mobile" type="tel" required />
            <Field label="PIN code" name="pin" required />
          </div>
          <label className="mt-5 block text-sm font-semibold text-[#31516a]">
            Delivery Address
            <textarea required name="address" rows={3} className="mt-2 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] p-3 text-sm font-normal outline-none focus:border-[#1688c6]" data-testid="input-address" />
          </label>
          <div className="mt-6 rounded-xl bg-[#f9f1df] p-4 text-sm leading-relaxed text-[#8a6835]">
            <strong>Policy:</strong> 100% Advance Payment via UPI. No COD. All items are final sale with strict no-refund/no-return policy. Pre-dispatch verification photos will be sent for your approval.
          </div>
          <button type="submit" className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-[#1688c6] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#157bb3]" data-testid="button-place-order">
            Send Order Request via WhatsApp <ArrowRight size={16} />
          </button>
        </form>
        <aside className="h-fit rounded-2xl bg-[#f9f1df] p-6">
          <h2 className="font-display text-2xl text-[#173b61]">Order summary</h2>
          <div className="mt-6 space-y-4">
            {cart.map((line) => {
              const p = products.find((item) => item.id === line.productId);
              if (!p) return null;
              return (
                <div key={cartKey(line)} className="flex justify-between gap-3 text-sm">
                  <span className="text-[#547080]">{p.name}{line.variant ? ` · ${line.variant.label}` : ''} × {line.quantity}</span>
                  <span className="font-semibold text-[#173b61]">{money((line.variant?.price ?? p.price) * line.quantity)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-6 space-y-3 border-t border-[#ead7b6] pt-5 text-sm">
            <div className="flex justify-between text-[#547080]"><span>Subtotal</span><span data-testid="text-checkout-subtotal">{money(subtotal)}</span></div>
            <div className="flex justify-between text-[#547080]"><span>Shipping</span><span>{shipping ? money(shipping) : 'Free'}</span></div>
            <div className="flex justify-between pt-2 text-base font-bold text-[#173b61]"><span>Total</span><span data-testid="text-checkout-total">{money(subtotal + shipping)}</span></div>
          </div>
        </aside>
      </div>
    </div>
  </Shell>;
}

function Confirmation() {
  const [order] = useState(() => { try { return JSON.parse(localStorage.getItem('mrudugandh-order') || 'null'); } catch { return null; } });
  return <Shell><div className="mx-auto max-w-2xl px-5 py-20 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#d9eef2] text-[#1688c6]"><CircleCheck size={42} /></div><p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Order placed</p><h1 className="mt-3 font-display text-5xl text-[#173b61]">Thank you for choosing handmade.</h1><p className="mx-auto mt-5 max-w-lg leading-7 text-[#547080]">Your demo order has been recorded. Every thoughtful choice helps keep connection and craftsmanship close.</p>{order && <div className="mx-auto mt-10 rounded-2xl bg-[#f9f1df] p-6 text-left"><div className="flex justify-between border-b border-[#ead7b6] pb-4 text-sm"><span className="text-[#6a8390]">Order number</span><strong className="text-[#173b61]" data-testid="text-order-number">{order.number}</strong></div><div className="flex justify-between pt-4 text-sm"><span className="text-[#6a8390]">Order total</span><strong className="text-[#173b61]" data-testid="text-confirmation-total">{money(order.total)}</strong></div></div>}<Link href="/shop" className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#1688c6] px-6 py-3.5 text-sm font-bold text-white" data-testid="link-confirmation-shop">Continue exploring <ArrowRight size={16} /></Link></div></Shell>;
}

function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        setLocation('/admin/sign-in');
      } else {
        const email = user.primaryEmailAddress?.emailAddress.toLowerCase();
        if (email !== 'athinamankar007@gmail.com' && email !== 'mrudugandh.llp@gmail.com') {
          signOut().then(() => setLocation('/'));
        }
      }
    }
  }, [user, isLoaded, setLocation, signOut]);

  if (!isLoaded || !user) return null;
  const email = user.primaryEmailAddress?.emailAddress.toLowerCase();
  if (email !== 'athinamankar007@gmail.com' && email !== 'mrudugandh.llp@gmail.com') return null;

  return <>{children}</>;
}

function Admin() {
  return <AdminGuard><AdminPanel /></AdminGuard>;
}

function AdminSignInPage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = `${basePath}/admin/sign-in`;
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e3f3f7] px-5 py-12">
      <SignIn
        routing="path"
        path={path}
        forceRedirectUrl={`${basePath}/admin`}
        appearance={{
          theme: shadcn,
          elements: {
            socialButtonsBlockButton: { display: 'none' },
            dividerRow: { display: 'none' },
            footerAction: { display: 'none' },
          },
        }}
      />
    </div>
  );
}

function SignInPage() {
  const path = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/sign-in`;
  return <div className="flex min-h-screen items-center justify-center bg-[#e3f3f7] px-5 py-12"><SignIn routing="path" path={path} signUpUrl={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sign-up`} appearance={{ theme: shadcn }} /></div>;
}

function SignUpPage() {
  const path = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/sign-up`;
  return <div className="flex min-h-screen items-center justify-center bg-[#e3f3f7] px-5 py-12"><SignUp routing="path" path={path} signInUrl={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sign-in`} appearance={{ theme: shadcn }} /></div>;
}

function Account() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const ordersQuery = useListOrders({ query: { queryKey: [...getListOrdersQueryKey(), user?.id], enabled: isLoaded && Boolean(isSignedIn) } });
  const cancelOrder = useCancelOrder();
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [other, setOther] = useState('');
  const chosenReason = reason === 'Other' ? other.trim() : reason;

  return <Shell><div className="mx-auto max-w-4xl px-5 pb-24 pt-14 lg:px-8">
    <div className="mb-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1688c6]">Your Account</p><h1 className="mt-3 font-display text-5xl text-[#173b61]">My Profile</h1></div>
    <Show when="signed-in">
      <div className="mb-12 rounded-3xl bg-[#e3f3f7] p-8">
        <div className="flex items-center gap-6">
          <UserButton appearance={{ elements: { userButtonAvatarBox: "h-16 w-16" } }} />
          <div>
            <h2 className="font-display text-2xl text-[#173b61]">{user?.firstName} {user?.lastName}</h2>
            <p className="mt-1 text-sm text-[#547080]">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
      </div>

      <h2 className="mb-6 font-display text-3xl text-[#173b61]">Order History</h2>
      {ordersQuery.isLoading ? <CatalogMessage title="Loading your orders…" copy="Fetching your order history." /> : ordersQuery.isError ? <CatalogMessage title="Orders unavailable" copy="Please refresh and try again." /> : ordersQuery.data?.length ? <div className="space-y-4">{ordersQuery.data.map((order) => <div key={order.id} className="rounded-2xl border border-[#cfe5ea] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#cfe5ea] pb-6">
          <div><p className="text-sm font-bold text-[#1688c6]">Order #{order.number}</p><p className="mt-1 text-xs text-[#6a8390]">{new Date(order.createdAt).toLocaleDateString()}</p></div>
          <div className="text-right"><p className="font-display text-xl text-[#173b61]">{money(order.total)}</p><span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${order.status === 'Cancelled' ? 'bg-[#fae5e1] text-[#a84e47]' : 'bg-[#e3f3f7] text-[#1688c6]'}`}>{order.status || 'Pending'}</span></div>
        </div>
        <div className="mt-6 space-y-3">{order.itemSnapshots.map((item: any, i) => <div key={i} className="flex justify-between text-sm"><span className="text-[#547080]">{item.name || item.productId} {item.variant ? `· ${item.variant}` : ''} × {item.quantity}</span><span className="text-[#173b61]">{item.price ? money(item.price * item.quantity) : ''}</span></div>)}</div>
        {order.cancellationReason && <p className="mt-5 rounded-lg bg-[#fae5e1] p-3 text-sm text-[#a84e47]">Cancellation reason: {order.cancellationReason}</p>}
        {order.status === 'Pending' && <button onClick={() => setCancelTarget(order.id)} className="mt-6 rounded-full border border-[#f2c7c2] px-4 py-2 text-xs font-bold text-[#a84e47]">Cancel Order</button>}
      </div>)}</div> : <div className="rounded-2xl border border-dashed border-[#9ecbd5] bg-[#edf8f9] py-16 text-center">
        <ShoppingBag className="mx-auto text-[#1688c6]" size={28} />
        <h3 className="mt-4 font-display text-xl text-[#173b61]">No orders yet</h3>
        <p className="mt-2 text-sm text-[#6b8490]">When you place an order, it will appear here.</p>
        <Link href="/shop" className="mt-5 inline-block text-sm font-bold text-[#1688c6]">Explore the shop</Link>
      </div>}
      </Show>
      {cancelTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#153a67]/60 p-5"><div className="w-full max-w-md rounded-2xl bg-white p-7"><h2 className="font-display text-2xl text-[#173b61]">Cancel Order</h2><select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-5 w-full rounded-xl border border-[#cfe5ea] bg-[#f7fcfc] px-3 py-3 text-sm"><option value="">Select a reason</option><option>Ordered by mistake</option><option>Changed my mind</option><option>Testing</option><option>Other</option></select>{reason === 'Other' && <textarea value={other} onChange={(e) => setOther(e.target.value)} className="mt-3 w-full rounded-xl border border-[#cfe5ea] p-3 text-sm" placeholder="Tell us why" /> }<div className="mt-6 flex gap-3"><button disabled={!chosenReason || cancelOrder.isPending} onClick={async () => { await cancelOrder.mutateAsync({ id: cancelTarget, data: { cancellationReason: chosenReason } }); await ordersQuery.refetch(); setCancelTarget(null); setReason(''); setOther(''); }} className="flex-1 rounded-full bg-[#a84e47] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">Confirm cancellation</button><button onClick={() => setCancelTarget(null)} className="rounded-full border border-[#cfe5ea] px-4 py-3 text-sm font-bold text-[#173b61]">Back</button></div></div></div>}
    <Show when="signed-out">
      <div className="rounded-2xl bg-[#e3f3f7] p-10 text-center">
        <User className="mx-auto text-[#1688c6]" size={32} />
        <h2 className="mt-5 font-display text-3xl text-[#173b61]">Sign in to your account</h2>
        <p className="mt-3 text-[#547080]">Manage your orders and stay connected.</p>
        <Link href="/sign-in" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#1688c6] px-6 py-3.5 text-sm font-bold text-white">Sign in <ArrowRight size={16} /></Link>
      </div>
    </Show>
  </div></Shell>;
}

function Initiatives() { return <InitiativesContent Shell={Shell} />; }

function Router() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); document.title = location === '/' ? 'Mrudugandh Social Connect' : `Mrudugandh · ${location.slice(1).split('/')[0]}`; }, [location]);
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/shop" component={Shop} /><Route path="/product/:id" component={ProductDetail} /><Route path="/about" component={About} /><Route path="/impact" component={Impact} /><Route path="/initiatives" component={Initiatives} /><Route path="/contact" component={Contact} /><Route path="/cart" component={Cart} /><Route path="/checkout" component={Checkout} /><Route path="/order-confirmation" component={Confirmation} /><Route path="/account" component={Account} /><Route path="/admin" component={Admin} /><Route path="/admin/sign-in" component={AdminSignInPage} /><Route path="/admin/sign-in/:rest*" component={AdminSignInPage} /><Route path="/sign-in" component={SignInPage} /><Route path="/sign-in/:rest*" component={SignInPage} /><Route path="/sign-up" component={SignUpPage} /><Route path="/sign-up/:rest*" component={SignUpPage} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

const queryClient = new QueryClient();
function App() {
  return <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY} appearance={{ theme: shadcn }}><QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><ProductsProvider><CartProvider><Router /></CartProvider></ProductsProvider></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider></ClerkProvider>;
}

export default App;
