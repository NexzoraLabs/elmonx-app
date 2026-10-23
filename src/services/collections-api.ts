import {
  appendCatalogParams,
  DEFAULT_CATALOG_FILTERS,
  type CatalogFilters,
} from '@/services/catalog-filters';
import type { CollectionGridItem } from '@/data/collections';
import { formatDropDate, type PagedResult } from '@/services/drops-api';

import { API_BASE_URL } from '@/config/env';
import { apiFetch, readJson } from '@/services/http';
import i18n from '@/i18n';
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

export async function fetchCollectionsList(
  page: number,
  filters: CatalogFilters = DEFAULT_CATALOG_FILTERS,
  search = ''
): Promise<PagedResult<CollectionListItem>> {
  const params = new URLSearchParams({
    is_deleted: 'False',
    current_page: String(page),
    items_per_page: String(ITEMS_PER_PAGE),
  });
  appendCatalogParams(params, 'Collections', filters, search);

  const response = await apiFetch(`${API_BASE_URL}/collections/list?${params.toString()}`);
  if (!response.ok) {
    throw new Error(i18n.t('Failed to load collections ({{status}})', { status: response.status }));
  }
  const json = await readJson<CollectionsListResponse>(response);
  return { items: json.data, totalRecords: json.total_records };
}

export function collectionListItemToGridItem(item: CollectionListItem): CollectionGridItem {
  return {
    id: item._id,
    title: item.title,
    description: item.description,
    dropDate: formatDropDate(item.nearest_release_date),
    isUpcoming: item.nearest_release_date ? new Date(item.nearest_release_date) > new Date() : false,
    color: '#1B1F2E',
    category: 'Collections',
    imageUrl: item.image,
  };
}
