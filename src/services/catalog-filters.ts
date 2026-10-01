// Filters for the Collections tab listings, mirroring the website's shared filter-modal
// (src/components/modals/filter-modal) and how each listing page maps it to query params.

export const BLOCKCHAIN_OPTIONS = ['All', 'Ethereum', 'Polygon'] as const;
export const DESTINATION_OPTIONS = ['All', 'Wallet', 'Vault'] as const;
export const EDITION_OPTIONS = ['all', 'Original', 'Animated', 'Artist Proof'] as const;

export type Blockchain = (typeof BLOCKCHAIN_OPTIONS)[number];
export type Destination = (typeof DESTINATION_OPTIONS)[number];
export type Edition = (typeof EDITION_OPTIONS)[number];

/** Which listing the filters belong to; Partners only gets Artist / Date / Price (like the website). */
export type CatalogTab = 'Collections' | 'Collectibles' | 'Partners';

export type CatalogFilters = {
  blockchain: Blockchain;
  destination: Destination;
  edition: Edition;
  brandIds: string[];
  categoryId: string | null;
  dateFrom: string;
  dateTo: string;
  priceMin: string;
  priceMax: string;
};

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  blockchain: 'All',
  destination: 'All',
  edition: 'all',
  brandIds: [],
  categoryId: null,
  dateFrom: '',
  dateTo: '',
  priceMin: '',
  priceMax: '',
};

export const ALL_DROP_TYPES = ['Eth_Product', 'Layer_2', 'Polygon'];

const BLOCKCHAIN_TYPES: Record<Exclude<Blockchain, 'All'>, string[]> = {
  Ethereum: ['Eth_Product', 'Layer_2'],
  Polygon: ['Polygon'],
};

const DESTINATION_TYPES: Record<Exclude<Destination, 'All'>, string[]> = {
  Wallet: ['Eth_Product'],
  Vault: ['Layer_2'],
};

/**
 * Website logic: intersect Blockchain × "Where it goes". If either is All the other is used alone.
 * No overlap → Collections omits `type`, Collectibles falls back to all three types.
 */
export function resolveDropTypes(filters: CatalogFilters, tab: CatalogTab): string[] | undefined {
  const fromChain = filters.blockchain === 'All' ? null : BLOCKCHAIN_TYPES[filters.blockchain];
  const fromDest = filters.destination === 'All' ? null : DESTINATION_TYPES[filters.destination];
  let types: string[] | undefined;
  if (fromChain && fromDest) {
    const overlap = fromChain.filter((t) => fromDest.includes(t));
    types = overlap.length ? overlap : undefined;
  } else {
    types = fromChain ?? fromDest ?? undefined;
  }
  if (tab === 'Collectibles') return types ?? ALL_DROP_TYPES;
  return types;
}

export function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

/** The backend drops the search straight into a regex; escape it so "(" etc. don't 400. */
export function escapeSearch(value: string): string {
  return value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Appends search + filter params exactly as the website's listing pages send them. */
export function appendCatalogParams(
  params: URLSearchParams,
  tab: CatalogTab,
  filters: CatalogFilters,
  search: string
) {
  if (search.trim()) params.append('filter', escapeSearch(search));

  if (tab !== 'Partners') {
    resolveDropTypes(filters, tab)?.forEach((type) => params.append('type', type));
    if (filters.edition !== 'all') params.append('drop_edition', filters.edition);
    if (filters.categoryId) params.append('category_id', filters.categoryId);
  }

  filters.brandIds.forEach((id) => params.append('brand_id', id));
  if (isValidDate(filters.dateFrom)) params.append('date_from', filters.dateFrom);
  if (isValidDate(filters.dateTo)) params.append('date_to', filters.dateTo);
  if (filters.priceMin.trim()) params.append('price_min', filters.priceMin.trim());
  if (filters.priceMax.trim()) params.append('price_max', filters.priceMax.trim());
}

// ---- Option lists (same endpoints as the website) ----

const API_BASE_URL = 'https://api.elmonx.com/api';
const EXCLUDED_CATEGORY_ID = '6560e333566936cc1c70e25f';

export type FilterOption = { _id: string; title: string };

export async function fetchFilterBrands(): Promise<FilterOption[]> {
  const response = await fetch(`${API_BASE_URL}/brands/list?is_deleted=False&get_all_records=True`);
  const json = (await response.json()) as { data?: FilterOption[] };
  return (json.data ?? []).filter((brand) => brand.title?.trim());
}

export async function fetchFilterCategories(): Promise<FilterOption[]> {
  const response = await fetch(`${API_BASE_URL}/categories/list?is_deleted=False&get_all_records=True`);
  const json = (await response.json()) as { data?: FilterOption[] };
  return (json.data ?? []).filter((category) => category._id !== EXCLUDED_CATEGORY_ID);
}
