import { API_BASE_URL } from '@/config/env';
const BASE = `${API_BASE_URL}/`;

export type AuctionStatus = 'Upcoming' | 'Live' | 'Ended' | 'Cancelled';

export type AuctionDropImage = {
  original_url?: string;
  url?: string;
};

export type AuctionCardDrop = {
  _id: string;
  title: string;
  image_url?: string | null;
  images?: AuctionDropImage[];
  artist?: string | null;
};

export type AuctionCard = {
  _id: string;
  status: AuctionStatus;
  start_time: string;
  end_time: string;
  editions: number;
  total_bids: number;
  strict_mode: boolean;
  extension_count: number;
  initial_price: number;
  clearing_price: number | null;
  current_price: number;
  leading_bid: number | null;
  drop: AuctionCardDrop;
};

export type AuctionList = {
  items: AuctionCard[];
  total: number;
  page: number;
  limit: number;
  next_change_at: string | null;
  server_time: string;
};

export type AuctionBid = {
  _id: string;
  rank: number | null;
  user_name: string | null;
  profile_avatar_url: string | null;
  wallet_address: string;
  amount: number;
  bid_time: string;
  status: 'Active' | 'Won' | 'Lost' | 'Removed';
  is_winning: boolean;
  is_mine: boolean;
  raises_count: number;
};

export type AuctionViewer = {
  needs_terms: boolean;
  is_banned: boolean;
  email_verified: boolean;
  my_bids_used: number;
  my_bids_left: number;
};

export type AuctionBlindBoxItem = {
  _id: string;
  title: string;
  description?: string;
  rarity?: string;
  artist?: string;
  total_editions?: number;
  image?: { url?: string; name?: string }[];
};

export type AuctionPageDrop = {
  _id: string;
  title: string;
  description?: string | null;
  images?: AuctionDropImage[];
  image_url?: string | null;
  artist?: string | null;
  rarity?: string | null;
  total_editions?: number;
  is_blind_box?: boolean;
  is_physical?: boolean;
  contract_address?: string | null;
  blind_box_items_data: AuctionBlindBoxItem[];
};

export type AuctionView = {
  _id: string;
  drop_id: string;
  status: AuctionStatus;
  cancelled: boolean;
  start_time: string;
  end_time: string;
  original_end_time: string;
  extension_count: number;
  initial_price: number;
  increment_percentage: number;
  editions: number;
  max_bids_per_wallet: number;
  max_bids_per_user: number;
  claim_window_hours: number;
  anti_snipe: { enabled: boolean; window_minutes: number; extension_minutes: number };
  strict_mode: boolean;
  total_bids: number;
  clearing_price: number | null;
  current_price?: number;
  min_next_bid: number;
  quick_bids: number[];
  winning_count: number;
  leading_bid: number | null;
  lowest_winning_bid: number | null;
  ranked_bids_total: number;
  bids: AuctionBid[];
  removed_bids: AuctionBid[];
  server_time: string;
  viewer?: AuctionViewer;
  wallet_bids_left?: number;
  drop?: AuctionPageDrop | null;
};

export type PlaceBidPayload = {
  amount: number;
  wallet_address: string;
  agree_terms?: boolean;
};

export type BidResult = {
  bid_id: string;
  auction: AuctionView;
};

export async function fetchAuctions(params: {
  status?: 'live' | 'upcoming' | 'ended';
  page?: number;
  limit?: number;
} = {}): Promise<{ status: number; data: AuctionList }> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const res = await fetch(`${BASE}auction/list${qs ? `?${qs}` : ''}`);
  return res.json();
}

export async function fetchAuction(
  auctionId: string,
  token: string | null,
  wallet?: string,
): Promise<{ status: number; data: AuctionView }> {
  const query = wallet ? `?wallet=${encodeURIComponent(wallet)}` : '';
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}auction/${auctionId}${query}`, { headers });
  return res.json();
}

export async function fetchAuctionState(
  auctionId: string,
  token: string | null,
  wallet?: string,
): Promise<{ status: number; data: AuctionView }> {
  const query = wallet ? `?wallet=${encodeURIComponent(wallet)}` : '';
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}auction/${auctionId}/state${query}`, { headers });
  return res.json();
}

export async function placeAuctionBid(
  auctionId: string,
  payload: PlaceBidPayload,
  token: string,
): Promise<{ status: number; data?: BidResult; message?: string }> {
  const res = await fetch(`${BASE}auction/${auctionId}/bid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function raiseAuctionBid(
  bidId: string,
  amount: number,
  walletAddress: string,
  token: string,
): Promise<{ status: number; data?: BidResult; message?: string }> {
  const res = await fetch(`${BASE}auction/bid/${bidId}/raise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount, wallet_address: walletAddress }),
  });
  return res.json();
}

export function auctionImage(
  drop: { images?: AuctionDropImage[]; image_url?: string | null } | null | undefined,
): string {
  const first = drop?.images?.[0];
  return (first?.original_url as string) || (first?.url as string) || drop?.image_url || '';
}

export function formatCountdown(ms: number): string {
  if (!(ms > 0)) return '0s';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (d > 0) return `${d}d ${pad(h)}h`;
  if (h > 0) return `${pad(h)}h ${pad(m)}m ${pad(sec)}s`;
  return `${pad(m)}m ${pad(sec)}s`;
}

export function editionsLabel(editions: number): string {
  return editions === 1 ? '1 of 1' : `${editions} editions · top ${editions} win`;
}

// ---- Auction Wins ----

export type AuctionWinStatus = 'Claim_Pending' | 'Processing' | 'Paid' | 'Transferred' | 'Transfer_Failed' | 'Expired';

export type AuctionWinItem = {
  _id: string;
  auction_id: string;
  drop_id: string;
  drop?: {
    _id: string;
    title: string;
    image_url?: string | null;
    images?: AuctionDropImage[];
    artist?: string | null;
    is_blind_box?: boolean;
    contract_address?: string | null;
  };
  rank: number;
  bid_amount: number;
  price: number;
  status: AuctionWinStatus;
  claim_deadline: string;
  paid_at: string | null;
  item_name: string | null;
  token_id: string | null;
  tx_hash: string | null;
  transferred_at: string | null;
  expired_at: string | null;
  wallet_address: string;
};

export type AuctionWinList = {
  items: AuctionWinItem[];
  total: number;
  page: number;
  limit: number;
  server_time: string;
};

type WinEnvelope<T> = { status?: number; success?: boolean; message?: string; data?: T };

export async function getMyAuctionWins(token: string, page = 1, limit = 20): Promise<WinEnvelope<AuctionWinList>> {
  const res = await fetch(`${BASE}auction/my-wins?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return (await res.json()) as WinEnvelope<AuctionWinList>;
}

export async function claimAuctionWin(token: string, winId: string): Promise<WinEnvelope<AuctionWinItem>> {
  const res = await fetch(`${BASE}auction/win/${winId}/claim`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  return (await res.json()) as WinEnvelope<AuctionWinItem>;
}
