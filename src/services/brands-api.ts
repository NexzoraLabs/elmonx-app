import { escapeSearch } from '@/services/catalog-filters';

const API_BASE_URL = 'https://api.elmonx.com/api';

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
  const response = await fetch(`${API_BASE_URL}/brands/list?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to load artists (${response.status})`);
  }
  const json: BrandsListResponse = await response.json();
  return json.data;
}
