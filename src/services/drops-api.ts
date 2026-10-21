import { Platform } from 'react-native';

import type { CollectionCategory, CollectionGridItem } from '@/data/collections-mock';
import { appendCatalogParams, DEFAULT_CATALOG_FILTERS, type CatalogFilters } from '@/services/catalog-filters';

import { API_BASE_URL } from '@/config/env';
const ITEMS_PER_PAGE = 15;

export type PagedResult<T> = {
  items: T[];
  totalRecords: number;
};

export type DropImage = {
  original_name: string;
  original_key: string;
  original_url: string;
  field_name: string;
};

export type UnityAssetFile = {
  original_name: string;
  original_key: string;
  original_url: string;
  field_name: string;
};

export type UnityAssetEntry = {
  Id: string;
  tokenId: string;
  multiframe: string;
  face: string | null;
  Android_assets: UnityAssetFile;
  IOS_assets: UnityAssetFile;
};

export type BlindBoxItemData = {
  _id: string;
  drop_id: string;
  title: string;
  description: string;
  total_editions: number;
  consumed_editions: number;
  rarity: string;
  image: { name: string; key: string; url: string }[];
  artist: string | null;
  unity_assets?: UnityAssetEntry[];
};

export type Drop = {
  _id: string;
  title: string;
  description: string;
  price: number;
  custom_eth_price: number;
  type: string;
  drop_edition: string;
  contract_address: string;
  images: DropImage[];
  unity_assets: UnityAssetEntry[];
  release_date: string;
  public_sale_date: string | null;
  sale_close_time: string | null;
  total_editions: number;
  consumed_editions: number;
  is_blind_box: boolean;
  is_sale_closed: boolean;
  is_open_drop: boolean;
  /**
   * Normal drop: array of all blind box items.
   * individual=True response: single object — the specific blind box item for this card.
   */
  blind_box_items_data: BlindBoxItemData[] | BlindBoxItemData;
  // Fields the website's drop page reads.
  collection_id?: string;
  sale_title?: 'Private' | 'Public' | string;
  is_sold?: boolean;
  customize_drop?: boolean;
  is_physical?: boolean;
  is_country_blocked?: boolean;
  block_country_list?: { name: string }[];
  royalty_percentage?: number | string | null;
  license?: string;
  licenses_data?: { _id: string; title: string; description?: string }[];
  opensea_link?: string;
  maket_view_btn?: string;
  drop_info_btn?: string;
  edition_type?: string;
  brands_data?: { _id: string; title: string; description?: string; image_url?: string };
  collections_data?: { _id: string; title: string; description?: string; image?: string };
  total_likes?: number;
  total_comments?: number;
  self_like?: boolean;
};

type DropListResponse = {
  status: number;
  message: string;
  data: Drop[];
  total_records: number;
};

export async function fetchFeaturedDrops(
  page: number,
  filters: CatalogFilters = DEFAULT_CATALOG_FILTERS,
  search = ''
): Promise<PagedResult<Drop>> {
  const params = new URLSearchParams();
  params.append('access', 'open');
  params.append('status', 'Featured');
  params.append('is_deleted', 'False');
  params.append('individual', 'True');
  params.append('current_page', String(page));
  params.append('items_per_page', String(ITEMS_PER_PAGE));
  // Adds `type` (defaults to Eth_Product/Layer_2/Polygon) plus search and filters.
  appendCatalogParams(params, 'Collectibles', filters, search);

  const response = await fetch(`${API_BASE_URL}/drop/list_sell?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to load drops (${response.status})`);
  }
  const json: DropListResponse = await response.json();
  return { items: json.data, totalRecords: json.total_records };
}

export async function fetchPartnerDrops(
  page: number,
  filters: CatalogFilters = DEFAULT_CATALOG_FILTERS,
  search = ''
): Promise<PagedResult<Drop>> {
  const params = new URLSearchParams();
  params.append('type', 'Collaborator');
  params.append('access', 'open');
  params.append('status', 'Featured');
  params.append('orderBy_field', 'sort_no');
  params.append('orderBy_mode', 'Asc');
  params.append('is_deleted', 'False');
  params.append('individual', 'True');
  params.append('current_page', String(page));
  params.append('items_per_page', String(ITEMS_PER_PAGE));
  appendCatalogParams(params, 'Partners', filters, search);

  const response = await fetch(`${API_BASE_URL}/drop/list_sell?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to load partner drops (${response.status})`);
  }
  const json: DropListResponse = await response.json();
  return { items: json.data, totalRecords: json.total_records };
}

const authHeaders = (token?: string | null): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};

/** Same call the website makes; the token is optional and only adds `self_like`. */
async function fetchDropList(params: URLSearchParams, token?: string | null): Promise<Drop[]> {
  const response = await fetch(`${API_BASE_URL}/drop/list_sell?${params.toString()}`, { headers: authHeaders(token) });
  if (!response.ok) {
    throw new Error(`Failed to load drop (${response.status})`);
  }
  const json: DropListResponse = await response.json();
  if (json.status !== 200 || !json.data) return [];
  return Array.isArray(json.data) ? json.data : [json.data];
}

export async function fetchDropById(dropId: string, token?: string | null): Promise<Drop | undefined> {
  return (await fetchDropList(new URLSearchParams({ access: 'open', drop_id: dropId }), token))[0];
}

/** The website's collection page: every drop in the collection (backend default page of 30). */
export async function fetchDropsByCollection(collectionId: string, token?: string | null): Promise<Drop[]> {
  return fetchDropList(new URLSearchParams({ access: 'open', collection_id: collectionId }), token);
}

export async function toggleDropLike(token: string, dropId: string): Promise<{ liked: boolean; likes_count: number }> {
  const response = await fetch(`${API_BASE_URL}/drop/${dropId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: '{}',
  });
  const json = (await response.json()) as { status?: number; message?: string; data?: { liked: boolean; likes_count: number } };
  if (!json.data || (json.status && json.status !== 200)) throw new Error(json.message || 'Unable to like.');
  return json.data;
}

export type Currency = 'GBP' | 'USD' | 'EUR' | 'ETH';
export type CurrencyRates = Record<Currency, number>;

// Website fallbacks when common/exchange_rate fails; base price is in GBP.
const FALLBACK_RATES: CurrencyRates = { GBP: 1, USD: 1.27, EUR: 1.2, ETH: 0.00041 };

export async function fetchCurrencyRates(): Promise<CurrencyRates> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`${API_BASE_URL}/common/exchange_rate`, { signal: controller.signal });
    clearTimeout(timer);
    const json = (await response.json()) as { data?: Partial<CurrencyRates> };
    return { ...FALLBACK_RATES, ...(json.data ?? {}) };
  } catch {
    return FALLBACK_RATES;
  }
}

export function formatPrice(priceGbp: number, currency: Currency, rates: CurrencyRates): string {
  const value = (priceGbp || 0) * rates[currency];
  if (currency === 'ETH') return `${value.toFixed(6)} ETH`;
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
  return `${symbol}${value.toFixed(2)}`;
}

/** Allowlist check for private Layer_2 drops: 200 = eligible, 201 = not eligible. */
export async function checkWhitelist(
  token: string | null,
  dropId: string,
  walletAddress: string
): Promise<{ status: number; allocated?: number; consumed?: number }> {
  const params = new URLSearchParams({ drop_id: dropId, wallet_address: walletAddress });
  const response = await fetch(`${API_BASE_URL}/marketplace/check_whitelist?${params.toString()}`, {
    headers: authHeaders(token),
  });
  return (await response.json()) as { status: number; allocated?: number; consumed?: number };
}

// Doodles / Wagner launch drops: the website hides rarity for these (environment.ts SPECIAL_DROP_IDS).
const SPECIAL_DROP_IDS = new Set([
  '6a1d70414f018acfe0e7b66e',
  '6a1d6f654f018acfe0e7b66d',
  '6a1d70674f018acfe0e7b66f',
  '69e8c080eeedd47165cfde58',
  '69e8c524eeedd47165cfe111',
]);

export function isSpecialDrop(dropId: string): boolean {
  return SPECIAL_DROP_IDS.has(dropId);
}

/** Website slugify: "Nymphéas en fleur, 1914-17 " -> "nymphas_en_fleur_191417_". */
export function slugify(value: string): string {
  return (value || 'untitled').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

export function formatDropDate(isoDate: string, withTime = false): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const day = date.toLocaleDateString('en-GB', { day: '2-digit' });
  const month = date.toLocaleDateString('en-GB', { month: 'short' });
  const year = date.toLocaleDateString('en-GB', { year: 'numeric' });
  if (!withTime) return `${day} ${month} ${year}`;
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${day} ${month} ${year} · ${time}`;
}

/** Picks the platform-appropriate Unity asset (iOS build vs Android build) for the "View in 3D" viewer. */
export function getPlatformUnityAsset(drop: Drop): UnityAssetFile | undefined {
  const entry = drop.unity_assets?.[0];
  if (!entry) return undefined;
  const asset = Platform.OS === 'ios' ? entry.IOS_assets : entry.Android_assets;
  return asset?.original_url ? asset : undefined;
}

export function dropToGridItem(drop: Drop, category: CollectionCategory = 'Collectibles'): CollectionGridItem {
  const isSoldOut = drop.is_sold === true || (drop.total_editions > 0 && drop.consumed_editions >= drop.total_editions);
  const priceKind: CollectionGridItem['priceKind'] =
    drop.type === 'Layer_2' ? 'xcoin' : drop.price === 0 ? 'airdrop' : 'gbp';

  // When individual=True, blind_box_items_data is a single object (not an array).
  // That single object is the specific blind box item for this card.
  const bbSingle =
    drop.is_blind_box && !Array.isArray(drop.blind_box_items_data)
      ? (drop.blind_box_items_data as BlindBoxItemData)
      : null;

  return {
    // Use the blind box item's own _id as the card id so keys stay unique across cards.
    id: bbSingle ? bbSingle._id : drop._id,
    title: bbSingle ? bbSingle.title : drop.title,
    description: drop.description,
    dropDate: formatDropDate(drop.release_date, true),
    isUpcoming: drop.release_date ? new Date(drop.release_date) > new Date() : false,
    color: '#1B1F2E',
    category,
    // Use blind box item's own image; fall back to parent drop image.
    imageUrl: bbSingle ? (bbSingle.image?.[0]?.url ?? drop.images?.[0]?.original_url) : drop.images?.[0]?.original_url,
    isBlindBox: Boolean(bbSingle) || drop.is_blind_box,
    // parentDropId set only for individual blind box items; navigation uses it as dropId.
    parentDropId: bbSingle ? drop._id : undefined,
    price: drop.price,
    priceKind,
    totalEditions: bbSingle ? bbSingle.total_editions : drop.total_editions,
    consumedEditions: bbSingle ? bbSingle.consumed_editions : drop.consumed_editions,
    isSoldOut,
    dropEdition: drop.drop_edition,
  };
}
