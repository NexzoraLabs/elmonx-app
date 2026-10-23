import { escapeSearch } from '@/services/catalog-filters';

import { API_BASE_URL } from '@/config/env';
import { apiFetch, readJson } from '@/services/http';
import i18n from '@/i18n';

export type Brand = {
  _id: string;
  title: string;
  description: string;
  image: string;
};

type BrandsListResponse = {
  status: number;
  message: string;
  data: Brand[];
  total_records: number;
};

/** Website Artists page: all brands, optional server-side search sent as `filter`. */
export async function fetchBrands(search = ''): Promise<Brand[]> {
  const params = new URLSearchParams({ get_all_records: 'True' });
  if (search.trim()) params.append('filter', escapeSearch(search));
  const response = await apiFetch(`${API_BASE_URL}/brands/list?${params.toString()}`);
  if (!response.ok) {
    throw new Error(i18n.t('Failed to load artists ({{status}})', { status: response.status }));
  }
  const json = await readJson<BrandsListResponse>(response);
  return json.data;
}
