const API_BASE_URL = 'https://api.elmonx.com/api';
/** Socket server (website `environment.socketUrl` for production) — default `/socket.io` path. */
export const CHAT_SOCKET_URL = 'https://api.elmonx.com';

type ApiEnvelope<T> = {
  status?: number;
  success?: boolean;
  message: string;
  data?: T;
};

class ChatApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatApiError';
  }
}

function assertSuccess<T>(envelope: ApiEnvelope<T>): T {
  // Errors come back as HTTP 200 with body `status: 201` (validation/business) or 440 (auth).
  if (envelope.success === false || (envelope.status && (envelope.status >= 400 || envelope.status === 201))) {
    throw new ChatApiError(envelope.message || 'Something went wrong.');
  }
  return envelope.data as T;
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
  });
  return assertSuccess((await response.json()) as ApiEnvelope<T>);
}

export type ChatParticipant = {
  _id: string;
  first_name?: string;
  last_name?: string;
  user_name: string;
  profile_avatar?: string;
  profile_avatar_url?: string;
};

export type ConversationItem = {
  conversation_id: string;
  participant: ChatParticipant;
  is_participant_online?: boolean;
  last_message?: string | null;
  last_message_at?: string;
  last_message_is_mine?: boolean;
  unread_count: number;
};

export type AttachmentType = 'image' | 'gif';

export type ChatMessage = {
  _id: string;
  conversation_id?: string;
  sender_id: string;
  receiver_id?: string;
  message?: string | null;
  attachment_url?: string | null;
  attachment_type?: AttachmentType | null;
  is_deleted?: boolean;
  is_read?: boolean;
  read_at?: string | null;
  created_at: string;
};

export const MAX_MESSAGE_LENGTH = 2000;

export async function getConversations(token: string): Promise<ConversationItem[]> {
  return (await request<ConversationItem[]>('/message/conversations?current_page=1&items_per_page=50', token)) ?? [];
}

/** Returns oldest → newest (API is newest-first). Fetching a thread also marks it read server-side. */
export async function getThread(token: string, conversationId: string): Promise<ChatMessage[]> {
  const items = await request<ChatMessage[]>(`/message/${conversationId}?current_page=1&items_per_page=50`, token);
  return [...(items ?? [])].reverse();
}

export async function sendMessageRest(
  token: string,
  payload: { receiver_id: string; message?: string; attachment_url?: string; attachment_type?: AttachmentType }
): Promise<ChatMessage> {
  return request<ChatMessage>('/message/send', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteMessageRest(token: string, messageId: string): Promise<void> {
  await request<unknown>(`/message/${messageId}`, token, { method: 'DELETE' });
}

/** Hides/clears the conversation for me (plural route — the website's singular URL 404s). */
export async function deleteConversation(token: string, conversationId: string): Promise<void> {
  await request<unknown>(`/message/conversations/${conversationId}`, token, { method: 'DELETE' });
}

export async function uploadChatImage(
  token: string,
  image: { uri: string; mimeType?: string; fileName?: string | null }
): Promise<{ attachment_url: string; attachment_type: AttachmentType }> {
  const form = new FormData();
  const name = image.fileName || image.uri.split('/').pop() || 'image.jpg';
  // React Native's FormData accepts a { uri, name, type } file descriptor; field name is `media`.
  form.append('media', { uri: image.uri, name, type: image.mimeType || 'image/jpeg' } as unknown as Blob);
  return request<{ attachment_url: string; attachment_type: AttachmentType }>('/message/upload-media', token, {
    method: 'POST',
    body: form,
  });
}

export type CanMessageReason = 'self' | 'not_found' | 'private_not_followed' | 'blocked' | null;

export async function canMessageUser(
  token: string,
  userId: string
): Promise<{ can_message: boolean; reason: CanMessageReason }> {
  return request<{ can_message: boolean; reason: CanMessageReason }>(`/message/can-message/${userId}`, token);
}

export function canMessageReasonText(reason: CanMessageReason): string {
  if (reason === 'blocked') return 'You cannot message this user.';
  if (reason === 'private_not_followed') return 'This user only accepts messages from people they follow.';
  if (reason === 'not_found') return 'This user is not available.';
  return 'You cannot message this user.';
}

export function messagePreview(message: Pick<ChatMessage, 'message' | 'attachment_type' | 'is_deleted'>): string {
  if (message.is_deleted) return 'Message removed';
  if (message.message) return message.message;
  if (message.attachment_type === 'gif') return 'GIF';
  if (message.attachment_type === 'image') return 'Photo';
  return '';
}
