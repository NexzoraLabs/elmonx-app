import type { Post, PostAuthor } from '@/services/profile-api';

const API_BASE_URL = 'https://api.elmonx.com/api';

type ApiEnvelope<T> = {
  status?: number;
  success?: boolean;
  message: string;
  data?: T;
};

class FeedApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeedApiError';
  }
}

function assertSuccess<T>(envelope: ApiEnvelope<T>): T {
  // Business errors come back as HTTP 200/201 with body `status: 201` (or >= 400).
  if (envelope.success === false || (envelope.status && (envelope.status >= 400 || envelope.status === 201))) {
    throw new FeedApiError(envelope.message || 'Something went wrong.');
  }
  return envelope.data as T;
}

async function request<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  return assertSuccess((await response.json()) as ApiEnvelope<T>);
}

const json = (method: string, body: object = {}): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const FEED_PAGE_SIZE = 10;
const pageQuery = (page: number, size = FEED_PAGE_SIZE) => `current_page=${page}&items_per_page=${size}`;

// ---- Feed lists ----

/** Feed rows are flat posts; reposts carry `is_repost` + `repost_id` (`_id` is the root post). */
export type FeedRow = Post & {
  is_repost?: boolean;
  repost_id?: string;
  reposted_by?: PostAuthor;
  repost_comment?: string | null;
  activity_date?: string;
  original_unavailable?: boolean;
};

export async function getForYouFeed(token: string | null, page: number): Promise<FeedRow[]> {
  return (await request<FeedRow[]>(`/post/list?${pageQuery(page)}`, token)) ?? [];
}

export async function getFollowingFeed(token: string, page: number): Promise<FeedRow[]> {
  return (await request<FeedRow[]>(`/feed/posts?${pageQuery(page)}`, token)) ?? [];
}

export async function getUserPosts(token: string | null, userId: string, page: number): Promise<Post[]> {
  return (await request<Post[]>(`/feed/user/${userId}/posts?${pageQuery(page)}`, token)) ?? [];
}

// ---- Create post ----

export const MAX_POST_CONTENT = 2000;
export const MAX_POST_IMAGES = 4;

export type LocalImage = { uri: string; mimeType?: string; fileName?: string | null };

export async function uploadPostImages(token: string, images: LocalImage[]): Promise<string[]> {
  const form = new FormData();
  images.forEach((image, index) => {
    const name = image.fileName || image.uri.split('/').pop() || `image-${index}.jpg`;
    // React Native's FormData accepts a { uri, name, type } file descriptor.
    form.append('images', { uri: image.uri, name, type: image.mimeType || 'image/jpeg' } as unknown as Blob);
  });
  const data = await request<{ images: string[] }>('/post/upload-image', token, { method: 'POST', body: form });
  return data.images ?? [];
}

export async function createPost(token: string, payload: { content?: string; images?: string[] }): Promise<Post> {
  return request<Post>('/post/create', token, json('POST', payload));
}

// ---- Comments / views / report ----

export type PostComment = {
  _id: string;
  comment: string;
  created_at: string;
  author?: PostAuthor;
};

/** A post, a repost (repost cards comment on the repost itself) or a drop — same comment API shape. */
export type CommentTarget = { kind: 'post' | 'repost' | 'drop'; id: string };

const commentBase = (target: CommentTarget) =>
  target.kind === 'post'
    ? `/post/${target.id}`
    : target.kind === 'repost'
      ? `/post/repost/${target.id}`
      : `/drop/${target.id}`;

export async function getComments(token: string | null, target: CommentTarget): Promise<PostComment[]> {
  return (await request<PostComment[]>(`${commentBase(target)}/comments?${pageQuery(1, 20)}`, token)) ?? [];
}

export async function addComment(token: string, target: CommentTarget, comment: string): Promise<PostComment> {
  return request<PostComment>(`${commentBase(target)}/comment`, token, json('POST', { comment }));
}

export async function deleteComment(token: string, target: CommentTarget, commentId: string): Promise<void> {
  await request<unknown>(`${commentBase(target)}/comment/${commentId}`, token, { method: 'DELETE' });
}

export async function recordPostView(token: string, postId: string): Promise<void> {
  await request<unknown>(`/post/${postId}/view`, token, json('POST'));
}

export const REPORT_REASONS = ['Spam', 'Harassment', 'Hate Speech', 'Nudity', 'Misinformation', 'Other'] as const;

export async function reportPost(token: string, postId: string, reason: string): Promise<void> {
  await request<unknown>(`/post/${postId}/report`, token, json('POST', { reason }));
}

// ---- Follow / block ----

export type RelationshipStatus = 'None' | 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled' | 'Self';

export async function getFollowStatus(token: string, userId: string): Promise<RelationshipStatus> {
  const data = await request<{ status?: RelationshipStatus }>(`/follow/status/${userId}`, token);
  return data?.status ?? 'None';
}

/** Private targets come back `Pending` (a request), public ones `Accepted`. */
export async function followUser(token: string, userId: string): Promise<RelationshipStatus> {
  const data = await request<{ status?: RelationshipStatus }>('/follow', token, json('POST', { user_id: userId }));
  return data?.status ?? 'Accepted';
}

/** Also withdraws a pending request. */
export async function unfollowUser(token: string, userId: string): Promise<void> {
  await request<unknown>(`/follow/${userId}`, token, { method: 'DELETE' });
}

export async function blockUser(token: string, userId: string): Promise<void> {
  await request<unknown>('/block', token, json('POST', { user_id: userId }));
}

export async function unblockUser(token: string, userId: string): Promise<void> {
  await request<unknown>(`/block/${userId}`, token, { method: 'DELETE' });
}

export async function getBlockStatus(token: string, userId: string): Promise<{ is_blocked: boolean; is_blocked_by: boolean }> {
  const data = await request<{ is_blocked?: boolean; is_blocked_by?: boolean }>(`/block/status/${userId}`, token);
  return { is_blocked: Boolean(data?.is_blocked), is_blocked_by: Boolean(data?.is_blocked_by) };
}

// ---- Users ----

export type SuggestedUser = {
  _id: string;
  user_name: string;
  profile_avatar?: string;
  profile_privacy?: 'Public' | 'Private';
  is_following?: boolean;
  relationship_status?: RelationshipStatus;
  followers_count?: number;
};

export async function getSuggestedUsers(token: string | null, limit = 10): Promise<SuggestedUser[]> {
  return (await request<SuggestedUser[]>(`/user/suggested?limit=${limit}`, token)) ?? [];
}

export async function searchUsers(token: string | null, query: string, page = 1): Promise<SuggestedUser[]> {
  const q = encodeURIComponent(query.trim());
  return (await request<SuggestedUser[]>(`/user/search?query=${q}&${pageQuery(page, 20)}`, token)) ?? [];
}

export type PublicProfile = {
  _id: string;
  user_name: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  profile_avatar?: string;
  cover_image?: string;
  profile_privacy?: 'Public' | 'Private';
  created_at?: string;
  relationship_status?: RelationshipStatus;
  is_private?: boolean;
};

export type PublicProfileStats = {
  posts_count?: number;
  followers_count?: number;
  following_count?: number;
};

/** Returns null when the user doesn't exist or either side has blocked the other (`data: []`). */
export async function getPublicProfile(token: string | null, username: string): Promise<PublicProfile | null> {
  const data = await request<PublicProfile | []>(`/profile/${encodeURIComponent(username)}`, token);
  if (!data || Array.isArray(data)) return null;
  return data;
}

export async function getPublicProfileStats(token: string | null, username: string): Promise<PublicProfileStats> {
  return (await request<PublicProfileStats>(`/profile/${encodeURIComponent(username)}/stats`, token)) ?? {};
}
