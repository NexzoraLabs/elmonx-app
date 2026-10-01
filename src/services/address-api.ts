const API_BASE_URL = 'https://api.elmonx.com/api';

type ApiEnvelope<T> = {
  status: number;
  success?: boolean;
  message: string;
  data?: T;
  addresses?: T;
  result?: T;
};

class AddressApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AddressApiError';
  }
}

function assertSuccess<T>(envelope: ApiEnvelope<T>, fallbackKeys: (keyof ApiEnvelope<T>)[] = []): T {
  if (envelope.success === false || (envelope.status && envelope.status >= 400)) {
    throw new AddressApiError(envelope.message || 'Something went wrong.');
  }
  if (envelope.data !== undefined) return envelope.data;
  for (const key of fallbackKeys) {
    const value = envelope[key];
    if (value !== undefined) return value as T;
  }
  return envelope.data as T;
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  return (await response.json()) as ApiEnvelope<T>;
}

/** Matches the server's `UserShippingAddress` schema exactly — it has no home/work/other
 * label field and no delete endpoint, only GET/POST (create-or-update via `_id`). */
export type ShippingAddress = {
  _id?: string;
  address_one: string;
  address_two?: string;
  town_city: string;
  county_state: string;
  postal_code: string;
  country: string;
  phone_number: string;
  country_code?: string;
  iso_code?: string;
  primary: boolean;
};

export async function getShippingAddresses(token: string): Promise<ShippingAddress[]> {
  const envelope = await request<ShippingAddress[]>('/user/user_address', token);
  return assertSuccess(envelope, ['addresses', 'result']) ?? [];
}

export async function saveShippingAddress(
  token: string,
  address: ShippingAddress
): Promise<{ message: string }> {
  const payload: Record<string, unknown> = {
    address_one: address.address_one,
    address_two: address.address_two || '',
    town_city: address.town_city,
    county_state: address.county_state,
    postal_code: address.postal_code,
    country: address.country,
    phone_number: address.phone_number,
    country_code: address.country_code || '',
    iso_code: address.iso_code || '',
    primary: address.primary,
    auto_used: true,
  };
  if (address._id) payload._id = address._id;

  const envelope = await request<{ message: string }>('/user/user_address', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  assertSuccess(envelope);
  return { message: envelope.message };
}
