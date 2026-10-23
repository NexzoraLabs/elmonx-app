import { API_BASE_URL } from '@/config/env';
import { getJson as fetchJson } from '@/services/http';
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
  const envelope = await fetchJson<Envelope<T>>(`${API_BASE_URL}${path}`, token);
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

/**
 * Every X-Coin transaction in [from, to) (the user's own month boundaries — the backend filters on
 * `date_from` / `date_to`), paging through the history. Used by the statement export.
 */
export async function getCaratHistoryBetween(token: string, from: Date, to: Date): Promise<CaratTransaction[]> {
  const pageSize = 200;
  const rows: CaratTransaction[] = [];
  for (let page = 1; page <= 50; page++) {
    const query = new URLSearchParams({
      current_page: String(page),
      items_per_page: String(pageSize),
      date_from: from.toISOString(),
      date_to: to.toISOString(),
    });
    const envelope = await getJson<CaratTransaction[]>(`/wallet/getCaratHistory?${query.toString()}`, token);
    const batch = Array.isArray(envelope.data) ? envelope.data : [];
    rows.push(...batch);
    if (batch.length < pageSize || rows.length >= (envelope.totalCount ?? Infinity)) break;
  }
  return rows;
}

/** CSV (RFC 4180, CRLF) of a statement — same columns as the website export. */
export function buildStatementCsv(rows: CaratTransaction[]): string {
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const header = ['Date', 'Type', 'Amount (X-Coins)', 'Balance (X-Coins)', 'Description', 'Transaction ID', 'Source'];
  const lines = rows.map((tx) => {
    const credit = transactionDirection(tx) === 'Credit';
    const amount = Math.abs(tx.amount || 0);
    return [
      new Date(tx.created_at).toISOString(),
      credit ? 'Credit' : 'Debit',
      credit ? amount : -amount,
      tx.balance ?? 0,
      tx.message || tx.transactionContext || 'Transaction',
      tx.transaction_id || tx._id,
      tx.plateform || 'Elmonx',
    ]
      .map(escape)
      .join(',');
  });
  return [header.map(escape).join(','), ...lines].join('\r\n');
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
