import type { Drop } from '@/services/drops-api';

export type HomeBanner = {
  id: string;
  mobileImageUrl: string | null;
  desktopImageUrl: string | null;
  linkType: string | null;
  linkUrl: string | null;
  collectionId: string | null;
  collectionTitle: string | null;
};

export type StoreItems = {
  banners: HomeBanner[];
  upcoming: Drop[];
  featured: Drop[];
  collectibles: Drop[];
};

type RawBanner = {
  _id?: string;
  mobile_banner?: string | null;
  desktop_banner?: string | null;
  link_type?: string | null;
  link_url?: string | null;
  collection_data?: { _id: string; title: string } | null;
};

type StoreBlock =
  | { homeBanners: RawBanner[] }
  | { upcoming: Drop[] }
  | { featured: Drop[] }
  | { collectibles: Drop[] }
  | { blogs: unknown[] }
  | { promo_title: string };

type StoreResponse = {
  status: number;
  message: string;
  data: StoreBlock[];
};

export async function fetchStoreItems(): Promise<StoreItems> {
  const response = await fetch('https://api.elmonx.com/api/store/store');
  if (!response.ok) {
    throw new Error(`Failed to load store (${response.status})`);
  }
  const json: StoreResponse = await response.json();
  if (json.status !== 200 || !Array.isArray(json.data)) {
    throw new Error('Unexpected store response');
  }

  let banners: HomeBanner[] = [];
  let upcoming: Drop[] = [];
  let featured: Drop[] = [];
  let collectibles: Drop[] = [];

  for (const block of json.data) {
    if ('homeBanners' in block) {
      banners = block.homeBanners.map((b, i) => ({
        id: b._id ?? String(i),
        mobileImageUrl: b.mobile_banner ?? null,
        desktopImageUrl: b.desktop_banner ?? null,
        linkType: b.link_type ?? null,
        linkUrl: b.link_url ?? null,
        collectionId: b.collection_data?._id ?? null,
        collectionTitle: b.collection_data?.title ?? null,
      }));
    } else if ('upcoming' in block) {
      upcoming = Array.isArray(block.upcoming) ? block.upcoming : [];
    } else if ('featured' in block) {
      featured = Array.isArray(block.featured) ? block.featured : [];
    } else if ('collectibles' in block) {
      collectibles = Array.isArray(block.collectibles) ? block.collectibles : [];
    }
  }

  return { banners, upcoming, featured, collectibles };
}
