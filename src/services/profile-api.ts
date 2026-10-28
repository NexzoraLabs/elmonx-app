import { API_BASE_URL } from '@/config/env';
import { apiFetch, assertSuccess as assertEnvelope, readJson, type ApiEnvelope } from '@/services/http';
import { appendLocalFile } from '@/services/upload-file';

// Bundled default avatar, shown wherever a user has no avatar. New file name on
// purpose so a cached copy of the old default image never shows.
export const DEFAULT_AVATAR: number = require('@/assets/images/default-profile.webp');

/** A real avatar URL, or the bundled default image (an `expo-image` `source`). */
export type AvatarSource = string | number;

// The backend still stores/returns the old default image for users with no
// avatar/cover (relative path, CDN URL, raw S3 URL) — all mean "none".
const LEGACY_DEFAULT_AVATARS = new Set([
  'images/avatar/default.png',
  'https://assets.elmonx.com/default.png',
  'https://elmonx-uploads.s3.eu-west-2.amazonaws.com/default.png',
]);

// HTTP 200 comes back even for logical failures; 201 in the body means a validation error here.
const assertSuccess = <T,>(envelope: ApiEnvelope<T>): T => assertEnvelope(envelope, { rejectStatus201: true });

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
  });
  return assertSuccess(await readJson<ApiEnvelope<T>>(response));
}

const jsonPost = (body: object = {}): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/** `profile_avatar_url` can be a Ready Player Me 3D model (.glb) — not displayable as an image. */
export function isImageUrl(path?: string): path is string {
  return Boolean(path) && !/\.(glb|gltf)(\?|$)/i.test(path as string);
}

/** A displayable avatar the user actually set (not a 3D model, not the old default image). */
export function isRealAvatar(path?: string): path is string {
  return isImageUrl(path) && !LEGACY_DEFAULT_AVATARS.has(path);
}

export function resolveAvatar(path?: string): AvatarSource {
  return isRealAvatar(path) ? path : DEFAULT_AVATAR;
}

export function resolveCover(path?: string): string | undefined {
  if (!path || LEGACY_DEFAULT_AVATARS.has(path)) return undefined;
  return path;
}

// ---- Header ----

export type MyProfileHeader = {
  userId: string;
  userName: string;
  avatar: AvatarSource;
  cover?: string;
  createdAt?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
};

type UserProfileResponse = { _id: string; user_name: string; profile_avatar?: string; created_at?: string };
type StatsResponse = { posts_count?: number; followers_count?: number; following_count?: number };
type PublicProfileResponse = { cover_image?: string };

/** Mirrors the website: `user/profile` → username → `profile/:username/stats` + `profile/:username` (cover). */
export async function getMyProfileHeader(token: string): Promise<MyProfileHeader> {
  const me = await request<UserProfileResponse>('/user/profile', token);
  const username = encodeURIComponent(me.user_name);
  const [stats, publicProfile] = await Promise.all([
    request<StatsResponse>(`/profile/${username}/stats`, token).catch(() => ({}) as StatsResponse),
    request<PublicProfileResponse>(`/profile/${username}`, token).catch(() => ({}) as PublicProfileResponse),
  ]);
  return {
    userId: me._id,
    userName: me.user_name,
    avatar: resolveAvatar(me.profile_avatar),
    cover: resolveCover(publicProfile.cover_image),
    createdAt: me.created_at,
    postsCount: stats.posts_count ?? 0,
    followersCount: stats.followers_count ?? 0,
    followingCount: stats.following_count ?? 0,
  };
}

// ---- Posts / reposts ----

export type PostAuthor = { _id: string; user_name: string; profile_avatar?: string; profile_avatar_url?: string };

export type Post = {
  _id: string;
  content?: string;
  images?: string[];
  created_at: string;
  likes_count?: number;
  is_liked?: boolean;
  comments_count?: number;
  reposts_count?: number;
  views_count?: number;
  author?: PostAuthor;
};

export type UserRepost = {
  _id: string;
  comment?: string;
  created_at: string;
  original_unavailable?: boolean;
  likes_count?: number;
  is_liked?: boolean;
  comments_count?: number;
  reposted_by?: PostAuthor;
  post?: Post;
};

export const POSTS_PAGE_SIZE = 10;

const pageQuery = (page: number) => `current_page=${page}&items_per_page=${POSTS_PAGE_SIZE}`;

export async function getMyPosts(token: string, page: number): Promise<Post[]> {
  return (await request<Post[]>(`/post/my-posts?${pageQuery(page)}`, token)) ?? [];
}

export async function getUserReposts(token: string, userId: string, page: number): Promise<UserRepost[]> {
  return (await request<UserRepost[]>(`/feed/user/${userId}/reposts?${pageQuery(page)}`, token)) ?? [];
}

export async function togglePostLike(token: string, postId: string) {
  return request<{ liked: boolean; likes_count: number }>(`/post/${postId}/like`, token, jsonPost());
}

export async function toggleRepostLike(token: string, repostId: string) {
  return request<{ liked: boolean; likes_count: number }>(`/post/repost/${repostId}/like`, token, jsonPost());
}

/** Calling it again on an already-reposted post undoes the repost. */
export async function toggleRepost(token: string, postId: string) {
  return request<{ reposted: boolean }>(`/post/${postId}/repost`, token, jsonPost());
}

export async function deletePost(token: string, postId: string): Promise<void> {
  await request<unknown>(`/post/${postId}`, token, { method: 'DELETE' });
}

export async function deleteRepost(token: string, repostId: string): Promise<void> {
  await request<unknown>(`/post/repost/${repostId}`, token, { method: 'DELETE' });
}

// ---- Avatar / cover upload (multipart) ----

async function uploadImage(token: string, path: string, field: string, uri: string) {
  const form = new FormData();
  appendLocalFile(form, field, uri);
  return request<Record<string, string>>(path, token, { method: 'POST', body: form });
}

export async function uploadAvatar(token: string, uri: string): Promise<string> {
  const data = await uploadImage(token, '/user/avatar_update', 'profile_avatar', uri);
  return data.profile_avatar;
}

export async function uploadCover(token: string, uri: string): Promise<string> {
  const data = await uploadImage(token, '/user/cover_image_update', 'cover_image', uri);
  return data.cover_image;
}
