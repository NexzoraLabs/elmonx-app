import type { CollectionGridItem } from '@/data/collections-mock';
import { formatDropDate, type PagedResult } from '@/services/drops-api';

const API_BASE_URL = 'https://api.elmonx.com/api';
const ITEMS_PER_PAGE = 9;

export type CollectionListItem = {
  _id: string;
  title: string;
  description: string;
  image: string;
  nearest_release_date: string;
};

type CollectionsListResponse = {
  status: number;
  message: string;
  data: CollectionListItem[];
  total_records: number;
};

export async function fetchCollectionsList(page: number): Promise<PagedResult<CollectionListItem>> {
  const params = new URLSearchParams({
    is_deleted: 'False',
    current_page: String(page),
    items_per_page: String(ITEMS_PER_PAGE),
  });

  const response = await fetch(`${API_BASE_URL}/collections/list?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to load collections (${response.status})`);
  }
  const json: CollectionsListResponse = await response.json();
  return { items: json.data, totalRecords: json.total_records };
}

export function collectionListItemToGridItem(item: CollectionListItem): CollectionGridItem {
  return {
    id: item._id,
    title: item.title,
    dropDate: formatDropDate(item.nearest_release_date),
    color: '#1B1F2E',
    category: 'Collections',
    imageUrl: item.image,
  };
}
