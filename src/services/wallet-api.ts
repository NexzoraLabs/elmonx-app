import { API_BASE_URL } from '@/config/env';
import i18n, { appLocale, currentLanguage } from '@/i18n';

// X-Coin wallet — same endpoints as the website's account/wallet page.

export type CaratBalance = {
  available_balance?: number;
  current_balance?: number;
};

export type CaratTransaction = {
  _id: string;
  transaction_id?: string | null;
  amount: number;
  balance?: number;
  currency?: string | null;
  message?: string | null;
  status?: string;
  transaction_type?: 'Debit' | 'Credit' | '';
  transactionContext?: string;
  plateform?: string;
  payment_method?: string;
  meta_data?: { meta_data?: { name?: string; tokenId?: string | number } } & Record<string, unknown>;
  created_at: string;
};

export const WALLET_PAGE_SIZE = 10;

type Envelope<T> = { status?: number; message?: string; data?: T; totalCount?: number };

async function getJson<T>(path: string, token: string): Promise<Envelope<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const envelope = (await response.json()) as Envelope<T>;
  if (envelope.status && envelope.status !== 200) {
    throw new Error(envelope.message || i18n.t('Something went wrong.'));
  }
  return envelope;
}

export async function getCaratBalance(token: string): Promise<number> {
  const envelope = await getJson<CaratBalance | []>('/wallet/getCarat', token);
  const data = envelope.data;
  return data && !Array.isArray(data) ? (data.available_balance ?? 0) : 0;
}

export async function getCaratHistory(
  token: string,
  page: number
): Promise<{ items: CaratTransaction[]; totalCount: number }> {
  const params = `current_page=${page}&items_per_page=${WALLET_PAGE_SIZE}`;
  const envelope = await getJson<CaratTransaction[]>(`/wallet/getCaratHistory?${params}`, token);
  const items = Array.isArray(envelope.data) ? envelope.data : [];
  return { items, totalCount: envelope.totalCount ?? items.length };
}

/** Website TransactionUtils: explicit type wins, else sign of the amount. */
export function transactionDirection(tx: CaratTransaction): 'Credit' | 'Debit' {
  const type = tx.transaction_type?.toLowerCase();
  if (type === 'debit') return 'Debit';
  if (type === 'credit') return 'Credit';
  return tx.amount > 0 ? 'Credit' : 'Debit';
}

export function formatWalletDate(iso?: string): string {
  if (!iso) return 'N/A';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(appLocale('en-GB'), {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: currentLanguage() === 'en',
  });
}
