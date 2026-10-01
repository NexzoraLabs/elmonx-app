const API_BASE_URL = 'https://api.elmonx.com/api';

type ApiEnvelope = {
  status: boolean;
  message?: string;
  data?: unknown;
};

export type PromoCodeResult = {
  success: boolean;
  message: string;
};

function formatData(data: unknown): string {
  if (!data) return '';
  if (typeof data === 'string') return data;
  try {
    return Object.entries(data as Record<string, unknown>)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  } catch {
    return '';
  }
}

export async function applyPromoCode(
  token: string,
  code: string,
  walletAddress: string
): Promise<PromoCodeResult> {
  const response = await fetch(`${API_BASE_URL}/promo-codes/apply_promo_code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code, wallet_address: walletAddress }),
  });
  const envelope = (await response.json()) as ApiEnvelope;
  const extra = formatData(envelope.data);
  const baseMessage = envelope.status
    ? envelope.message || 'Success!'
    : envelope.message || 'Invalid promo code or wallet address';

  return {
    success: Boolean(envelope.status),
    message: extra ? `${baseMessage} (${extra})` : baseMessage,
  };
}
