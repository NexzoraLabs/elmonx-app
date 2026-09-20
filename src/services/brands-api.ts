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

export async function fetchBrands(): Promise<Brand[]> {
  const response = await fetch(`${API_BASE_URL}/brands/list?get_all_records=True`);
  if (!response.ok) {
    throw new Error(`Failed to load artists (${response.status})`);
  }
  const json: BrandsListResponse = await response.json();
  return json.data;
}
