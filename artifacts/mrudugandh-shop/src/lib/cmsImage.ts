import sewing from '../../../../attached_assets/0_PHOTO-2026-09-19-15-10-28_1789840839387.jpg';
import exhibition from '../../../../attached_assets/2_PHOTO-2026-09-19-15-10-32_1789840839387.jpg';
import productWork from '../../../../attached_assets/IMG_4315_1790084546580.JPG';
import gullakWorkshop from '../../../../attached_assets/3_PHOTO-2026-09-19-15-10-33_1789840839387.jpg';
import gullakDisplay from '../../../../attached_assets/4_PHOTO-2026-09-19-15-10-34_1789840839387.jpg';
import gullakPainting from '../../../../attached_assets/5_PHOTO-2026-09-19-15-10-37_1789840839387.jpg';
import studentStallOne from '../../../../attached_assets/image_1792413513500.png';
import studentStallTwo from '../../../../attached_assets/IMG_4695_1790084554786.JPG';
import studentWork from '../../../../attached_assets/image_1792415028962.png';
import studentCommunity from '../../../../attached_assets/IMG_4621_1790084544307.JPG';
import studentNewStall from '../../../../attached_assets/image_1792417801806.png';
import donationClothes from '../../../../attached_assets/image_1792417764051.png';
import tanabanaVehicle from '../../../../attached_assets/IMG_4272_1790084549207.JPG';

export const assetTokens: Record<string, string> = {
  'asset:sewing': sewing, 'asset:exhibition': exhibition, 'asset:product-work': productWork,
  'asset:gullak-workshop': gullakWorkshop, 'asset:gullak-display': gullakDisplay, 'asset:gullak-painting': gullakPainting,
  'asset:student-stall-one': studentStallOne, 'asset:student-stall-two': studentStallTwo, 'asset:student-work': studentWork,
  'asset:student-community': studentCommunity, 'asset:student-new-stall': studentNewStall,
  'asset:donation-clothes': donationClothes, 'asset:tanabana-vehicle': tanabanaVehicle,
};

export const assetTokenList = Object.keys(assetTokens);

export function cmsImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('asset:')) return assetTokens[path] ?? null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/api/storage/')) return path;
  if (path.startsWith('/objects/') || path.startsWith('/public-objects/')) return `/api/storage${path}`;
  return `/api/storage/objects/${path.replace(/^\/+/, '')}`;
}
