import { API_BASE_URL } from '@/config/env';

export type AppNotification = {
  _id: string;
  user_id: string;
  drop_id?: string;
  users_nft_id?: string;
  title: string;
  message: string;
  type: string;
  platform: string;
  is_seen: boolean;
  seen_at?: string;
  ref_id?: string;
  created_at: string;
  drop_info?: {
    title: string;
    image_url: string;
  };
  users_nft?: {
    token_id: string;
    nft_name: string;
    nft_image: string;
  };
};

type NotifListResponse = {
  status?: number;
  success?: boolean;
  data?: AppNotification[] | { notifications?: AppNotification[]; result?: AppNotification[] };
  total?: number;
  total_count?: number;
};

function parseNotifications(res: NotifListResponse): { items: AppNotification[]; total: number } {
  let items: AppNotification[] = [];
  if (Array.isArray(res.data)) {
    items = res.data;
  } else if (res.data && typeof res.data === 'object') {
    const d = res.data as { notifications?: AppNotification[]; result?: AppNotification[] };
    items = d.notifications ?? d.result ?? [];
  }
  const total = res.total ?? res.total_count ?? items.length;
  return { items, total };
}

export async function getNotifications(
  token: string,
  page = 1,
  perPage = 10
): Promise<{ items: AppNotification[]; total: number }> {
  const res = await fetch(
    `${API_BASE_URL}/notifications/user_notifications?current_page=${page}&items_per_page=${perPage}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const json: NotifListResponse = await res.json();
  return parseNotifications(json);
}

export async function getUnreadCount(token: string): Promise<number> {
  const res = await fetch(`${API_BASE_URL}/notifications/unread_notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  return (json?.data?.count ?? json?.count ?? 0) as number;
}
