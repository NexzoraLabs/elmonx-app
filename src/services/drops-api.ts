import { Platform } from 'react-native';

import type { CollectionCategory, CollectionGridItem } from '@/data/collections-mock';

const API_BASE_URL = 'https://api.elmonx.com/api';
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
  blind_box_items_data: BlindBoxItemData[];
};

type DropListResponse = {
  status: number;
  message: string;
  data: Drop[];
  total_records: number;
};

export async function fetchFeaturedDrops(page: number): Promise<PagedResult<Drop>> {
  const params = new URLSearchParams();
  params.append('access', 'open');
  params.append('status', 'Featured');
  params.append('is_deleted', 'False');
  params.append('current_page', String(page));
  params.append('items_per_page', String(ITEMS_PER_PAGE));
  params.append('type', 'Eth_Product');
  params.append('type', 'Layer_2');
  params.append('type', 'Polygon');

  const response = await fetch(`${API_BASE_URL}/drop/list_sell?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to load drops (${response.status})`);
  }
  const json: DropListResponse = await response.json();
  return { items: json.data, totalRecords: json.total_records };
}

export async function fetchPartnerDrops(page: number): Promise<PagedResult<Drop>> {
  const params = new URLSearchParams();
  params.append('type', 'Collaborator');
  params.append('access', 'open');
  params.append('status', 'Featured');
  params.append('orderBy_field', 'sort_no');
  params.append('orderBy_mode', 'Asc');
  params.append('is_deleted', 'False');
  params.append('current_page', String(page));
  params.append('items_per_page', String(ITEMS_PER_PAGE));

  const response = await fetch(`${API_BASE_URL}/drop/list_sell?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to load partner drops (${response.status})`);
  }
  const json: DropListResponse = await response.json();
  return { items: json.data, totalRecords: json.total_records };
}

export async function fetchDropById(dropId: string): Promise<Drop | undefined> {
  const params = new URLSearchParams({ access: 'open', drop_id: dropId });
  const response = await fetch(`${API_BASE_URL}/drop/list_sell?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to load drop (${response.status})`);
  }
  const json: DropListResponse = await response.json();
  return json.data[0];
}

export function formatDropDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const day = date.toLocaleDateString('en-GB', { day: '2-digit' });
  const month = date.toLocaleDateString('en-GB', { month: 'short' });
  const year = date.toLocaleDateString('en-GB', { year: '2-digit' });
  return `${day} ${month} ${year}`;
}

/** Picks the platform-appropriate Unity asset (iOS build vs Android build) for the "View in 3D" viewer. */
export function getPlatformUnityAsset(drop: Drop): UnityAssetFile | undefined {
  const entry = drop.unity_assets?.[0];
  if (!entry) return undefined;
  const asset = Platform.OS === 'ios' ? entry.IOS_assets : entry.Android_assets;
  return asset?.original_url ? asset : undefined;
}

export function dropToGridItem(drop: Drop, category: CollectionCategory = 'Collectibles'): CollectionGridItem {
  return {
    id: drop._id,
    title: drop.title,
    dropDate: formatDropDate(drop.release_date),
    color: '#1B1F2E',
    category,
    imageUrl: drop.images[0]?.original_url,
    isBlindBox: drop.is_blind_box,
  };
}
