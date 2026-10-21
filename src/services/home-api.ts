import { API_BASE_URL } from '@/config/env';
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

export type HomeBlog = {
  id: string;
  title: string;
  excerpt: string;
  image: string | null;
  date: string;
  slug: string;
  category: string;
};

export type StoreItems = {
  banners: HomeBanner[];
  upcoming: Drop[];
  featured: Drop[];
  collectibles: Drop[];
  blogs: HomeBlog[];
  promoTitle: string | null;
};

type RawBanner = {
  _id?: string;
  mobile_banner?: string | null;
  desktop_banner?: string | null;
  link_type?: string | null;
  link_url?: string | null;
  collection_data?: { _id: string; title: string } | null;
};

type RawBlog = {
  _id?: string;
  title?: string;
  content?: string;
  cover_image?: string | null;
  created_at?: string;
  slug?: string;
  category?: string;
  read_time?: string;
};

type StoreBlock =
  | { homeBanners: RawBanner[] }
  | { upcoming: Drop[] }
  | { featured: Drop[] }
  | { collectibles: Drop[] }
  | { blogs: RawBlog[] }
  | { promo_title: string };

type StoreResponse = {
  status: number;
  message: string;
  data: StoreBlock[];
};

function extractExcerpt(html: string): string {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, '');
  return text.length > 150 ? text.slice(0, 150) + '…' : text;
}

export async function fetchStoreItems(): Promise<StoreItems> {
  const response = await fetch(`${API_BASE_URL}/store/store`);
  if (!response.ok) throw new Error(`Failed to load store (${response.status})`);
  const json: StoreResponse = await response.json();
  if (json.status !== 200 || !Array.isArray(json.data)) throw new Error('Unexpected store response');

  let banners: HomeBanner[] = [];
  let upcoming: Drop[] = [];
  let featured: Drop[] = [];
  let collectibles: Drop[] = [];
  let blogs: HomeBlog[] = [];
  let promoTitle: string | null = null;

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
    } else if ('blogs' in block) {
      blogs = (block.blogs ?? []).map((b: RawBlog, i: number) => ({
        id: b._id ?? String(i),
        title: b.title ?? '',
        excerpt: extractExcerpt(b.content ?? ''),
        image: b.cover_image ?? null,
        date: b.created_at ?? '',
        slug: b.slug ?? b._id ?? String(i),
        category: b.category ?? 'General',
      }));
    } else if ('promo_title' in block) {
      promoTitle = block.promo_title ?? null;
    }
  }

  return { banners, upcoming, featured, collectibles, blogs, promoTitle };
}

export type NewsItem = {
  _id: string;
  name: string;
  summary: string;
  source: string;
  category: string;
  created_at: string;
};

export async function fetchNews(): Promise<NewsItem[]> {
  const res = await fetch(
    'https://data.fungibull.com/api/common/x-news?start=1&limit=9',
  );
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}
