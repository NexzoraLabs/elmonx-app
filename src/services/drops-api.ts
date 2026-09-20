import type { CollectionGridItem } from '@/data/collections-mock';

const API_BASE_URL = 'https://api.elmonx.com/api';

export type DropImage = {
  original_name: string;
  original_key: string;
  original_url: string;
  field_name: string;
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

export async function fetchFeaturedDrops(): Promise<Drop[]> {
  const params = new URLSearchParams();
  params.append('access', 'open');
  params.append('status', 'Featured');
  params.append('is_deleted', 'False');
  params.append('current_page', '1');
  params.append('items_per_page', '15');
  params.append('type', 'Eth_Product');
  params.append('type', 'Layer_2');
  params.append('type', 'Polygon');

  const response = await fetch(`${API_BASE_URL}/drop/list_sell?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to load drops (${response.status})`);
  }
  const json: DropListResponse = await response.json();
  return json.data;
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

export function dropToGridItem(drop: Drop): CollectionGridItem {
  return {
    id: drop._id,
    title: drop.title,
    dropDate: formatDropDate(drop.release_date),
    color: '#1B1F2E',
    category: 'Collectibles',
    imageUrl: drop.images[0]?.original_url,
    isBlindBox: drop.is_blind_box,
  };
}
