const API_BASE_URL = 'https://api.elmonx.com/api';

class CollectiblesApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CollectiblesApiError';
  }
}

async function getJson<T>(path: string, token: string, params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}${path}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return (await response.json()) as T;
}

function assertOk(body: { status?: number | boolean; success?: boolean; message?: string }) {
  // HTTP 200 comes back even for logical failures, so check the body.
  if (body.success === false || (typeof body.status === 'number' && body.status >= 400)) {
    throw new CollectiblesApiError(body.message || 'Something went wrong.');
  }
}

/** "War Things #24" -> "24", same regex as the website. */
export function editionFromName(name?: string): string | undefined {
  return name?.match(/#(\S+)$/)?.[1];
}

export function shortenAddress(address?: string): string {
  if (!address) return '';
  return address.length > 10 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

export type CollectibleCardData = {
  key: string;
  name: string;
  image?: string;
  edition?: string;
  tokenId?: string;
  ownerWallet?: string;
};

// ---- Vault ("App (Vaulted)") ----

export type VaultNft = {
  _id: string;
  token_id?: string;
  wallet_address?: string;
  image_url?: string;
  title?: string;
  meta_data?: { meta_data?: { name?: string; image?: string } };
};

export function vaultNftToCard(nft: VaultNft): CollectibleCardData {
  const name = nft.meta_data?.meta_data?.name || nft.title || 'Untitled';
  return {
    key: nft._id,
    name,
    image: nft.meta_data?.meta_data?.image || nft.image_url,
    edition: editionFromName(name),
    tokenId: nft.token_id,
    ownerWallet: nft.wallet_address,
  };
}

export async function getVaultNfts(
  token: string,
  page: number,
  itemsPerPage: number
): Promise<{ items: VaultNft[]; totalCount: number }> {
  const body = await getJson<{ status?: number; success?: boolean; message?: string; data?: VaultNft[]; total_count?: number }>(
    '/marketplace/user_nfts',
    token,
    { network_type: 'Eth', status: 'Private', current_page: String(page), items_per_page: String(itemsPerPage) }
  );
  assertOk(body);
  return { items: body.data ?? [], totalCount: body.total_count ?? 0 };
}

// ---- Wallet ("Web") ----

export type WalletNft = {
  contract?: string;
  tokenId?: string;
  name?: string;
  image_url?: string;
  matched?: { image?: { url?: string }[] }[];
};

export function walletNftToCard(nft: WalletNft, ownerWallet: string, index: number): CollectibleCardData {
  const name = nft.name || 'Untitled';
  return {
    key: `${nft.contract ?? 'nft'}-${nft.tokenId ?? index}`,
    name,
    image: nft.matched?.[0]?.image?.[0]?.url || nft.image_url,
    edition: editionFromName(name),
    tokenId: nft.tokenId,
    ownerWallet,
  };
}

/** The backend proxies OpenSea and filters to ElmonX contracts; paging is cursor-based via `page_key`. */
export async function getWalletNfts(
  token: string,
  walletAddress: string,
  pageKey?: string
): Promise<{ items: WalletNft[]; pageKey?: string }> {
  const params: Record<string, string> = { wallet_address: walletAddress, network: 'eth' };
  if (pageKey) params.page_key = pageKey;
  const body = await getJson<{ success?: boolean; message?: string; data?: WalletNft[]; page_key?: string }>(
    '/elmonx_nft/account',
    token,
    params
  );
  assertOk(body);
  return { items: body.data ?? [], pageKey: body.page_key || undefined };
}

// ---- Doodles Physicals ----

export type DoodlesRedemption = {
  _id: string;
  token_id?: string;
  meta_data?: { name?: string; token_id?: string }[];
  images?: { image?: string }[];
  shipping_details?: { courier?: string; tracking_number?: string };
};

export async function getDoodlesRedemptions(token: string, walletAddress: string): Promise<DoodlesRedemption[]> {
  const body = await getJson<{ status?: number; message?: string; data?: DoodlesRedemption[] }>(
    '/doodles/user-transactions',
    token,
    { wallet_address: walletAddress }
  );
  assertOk(body);
  return body.data ?? [];
}
