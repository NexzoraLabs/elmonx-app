import { Platform } from 'react-native';

import { API_BASE_URL } from '@/config/env';
import { apiFetch, readJson } from '@/services/http';
import i18n from '@/i18n';

/** Same rule as the website's wallet validator: an Ethereum address. */
export const WALLET_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
/** Backend `buyAppDrop`: 1–10 per purchase. */
export const MAX_PURCHASE_QUANTITY = 10;

type Envelope<T> = { status: number; success?: boolean; message?: string; data?: T };

/** X-Coin balance — same source as the website's checkout (`GET wallet/getCarat`). */
export async function getXCoinBalance(token: string): Promise<number> {
  const response = await apiFetch(`${API_BASE_URL}/wallet/getCarat`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await readJson<Envelope<{ available_balance?: number }>>(response);
  return body.status === 200 ? Number(body.data?.available_balance ?? 0) : 0;
}

export type BuyLayer2Result =
  | { ok: true; nftName?: string }
  | { ok: false; message: string };

/**
 * Website "Buy With X-Coins" (`POST marketplace/buy_layer2_nft`). Every rule (sale window,
 * whitelist + buy limit, balance, country block, UK verification) is enforced server-side; a
 * failure comes back as HTTP 200/201 with `status !== 200` and a user-facing `message`.
 */
export async function buyLayer2Nft(
  token: string,
  payload: { drop_id: string; wallet_address: string; quantity: number },
): Promise<BuyLayer2Result> {
  const response = await apiFetch(`${API_BASE_URL}/marketplace/buy_layer2_nft`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      // Recorded on the purchase for the sales reports (backend middleware/platform).
      'X-Client-Platform': Platform.OS,
    },
    body: JSON.stringify(payload),
  });
  const body = await readJson<Envelope<{ name?: string }>>(response);
  if (body.status === 200) return { ok: true, nftName: body.data?.name };
  return { ok: false, message: body.message || i18n.t('Something went wrong!') };
}

/**
 * Drop Wallet — the address a user saves once and reuses at checkout (old app "Save Wallet",
 * `user-app-wallet` routes). Returns null when none is saved yet.
 *
 * These two routes answer `{ success, message, data }` — no `status` field — and get-wallet says
 * `success: 400` with `data: {}` when nothing is saved (not an error). So: HTTP status decides
 * success, `data.wallet_address` decides whether a wallet exists.
 */
export async function getSavedWallet(token: string): Promise<string | null> {
  const response = await apiFetch(`${API_BASE_URL}/user-app-wallet/get-wallet`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(i18n.t('Unable to load your saved wallet.'));
  const body = await readJson<{ data?: { wallet_address?: string } }>(response);
  return body.data?.wallet_address?.trim() || null;
}

export async function saveWallet(token: string, walletAddress: string): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/user-app-wallet/save-wallet`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address: walletAddress }),
  });
  const body = await readJson<{ success?: number; message?: string }>(response).catch(() => ({}) as { success?: number; message?: string });
  if (!response.ok || body.success !== 200) throw new Error(i18n.t('Unable to Save User Wallet Address!'));
}
