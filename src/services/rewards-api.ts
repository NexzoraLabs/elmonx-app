import { API_BASE_URL } from '@/config/env';
import { apiFetch, assertSuccess, getJson as fetchJson, readJson, type ApiEnvelope as BaseEnvelope } from '@/services/http';

type ApiEnvelope<T> = BaseEnvelope<T> & { pagination?: Pagination };

const getJson = <T,>(path: string, token?: string): Promise<ApiEnvelope<T>> =>
  fetchJson<ApiEnvelope<T>>(`${API_BASE_URL}${path}`, token);

export type Pagination = {
  current_page: number;
  items_per_page: number;
  total_items: number;
  total_pages: number;
};

export type PointsTransaction = {
  type: string;
  createdAt: string;
  tx_type: 'credit' | 'debit';
  amount: number;
};

export type UserPointsData = {
  total_earned: number;
  total_earned_count: number;
  total_redeemed: number;
  total_redeemed_count: number;
  net_balance: number;
  transactions: PointsTransaction[];
  pagination: Pagination;
};

export async function getUserPoints(
  token: string,
  params: { current_page: number; items_per_page: number }
): Promise<UserPointsData> {
  const query = new URLSearchParams({
    current_page: String(params.current_page),
    items_per_page: String(params.items_per_page),
  });
  const envelope = await getJson<UserPointsData>(`/rewards/user-points?${query.toString()}`, token);
  return assertSuccess(envelope);
}

export type RewardStatus = 'available' | 'pending' | 'complete' | 'done';

/** One capped social action as returned in `progress[]` — point values/caps are backend-owned. */
export type SocialActionProgress = {
  action: string;
  label: string;
  status: RewardStatus;
  points_per_action: number;
  daily_limit: number;
  completed_today: number;
  remaining_today: number;
  max_points_today: number;
  earned_today: number;
  claimed_today: number;
  claimable_points: number;
  is_capped: boolean;
  no_drops_available?: boolean;
};

/** Keyed by task name (e.g. `daily_login`) -> status, plus a few named extras. */
export type RewardTasks = {
  [taskKey: string]: RewardStatus | number | string | boolean | SocialActionProgress[] | undefined;
  progress?: SocialActionProgress[];
  claimable_points?: number;
  points_earned_today?: number;
  max_points_per_day?: number;
  daily_goal?: number;
  goal_actions_today?: number;
  goal_actions_remaining?: number;
  goal_met_today?: boolean;
  goal_claimed_today?: boolean;
  current_streak?: number;
  streak_expires_at?: string;
  week_complete_days?: number;
  monthly_complete_days?: number;
  next_reset_at?: string;
  follow_count?: number;
  follower_count?: number;
};

export async function getTasks(token: string, type: 'actions' | 'social' = 'actions'): Promise<RewardTasks> {
  const envelope = await getJson<RewardTasks>(`/rewards/tasks?type=${type}`, token);
  return assertSuccess(envelope);
}

/** `type` is the reward key, `action` is the tasks bucket it belongs to (matches the website). */
export async function claimTask(
  token: string,
  type: string,
  action: 'actions' | 'social' = 'actions'
): Promise<{ message: string }> {
  const envelope = await getJson<{ message: string }>(`/rewards/claim?type=${type}&action=${action}`, token);
  assertSuccess(envelope);
  return { message: envelope.message ?? '' };
}

export async function spinReward(token: string): Promise<{ reward_label: string; points_assigned: number }> {
  const response = await apiFetch(`${API_BASE_URL}/rewards/spin`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const envelope = await readJson<ApiEnvelope<{ reward_label: string; points_assigned: number }>>(response);
  return assertSuccess(envelope);
}

export type LeaderboardUser = {
  _id: string;
  user_id: string;
  user_name: string;
  full_name?: string;
  avatar?: string;
  points: number;
  level?: number;
  tier_name?: string;
};

export type LeaderboardData = {
  top_three: LeaderboardUser[];
  rankings: LeaderboardUser[];
  pagination: Pagination;
};

/** Public endpoint — no auth required. */
export async function getLeaderboard(params: {
  current_page: number;
  items_per_page: number;
}): Promise<LeaderboardData> {
  const query = new URLSearchParams({
    current_page: String(params.current_page),
    items_per_page: String(params.items_per_page),
  });
  const envelope = await getJson<LeaderboardData>(`/rewards/leaderboard?${query.toString()}`);
  return assertSuccess(envelope);
}

export type ProfileLevel = {
  level: number;
  current_xp: number;
  xp_for_current_level: number;
  xp_for_next_level: number;
  xp_into_level: number;
  xp_to_next_level: number;
  progress_percent: number;
  is_max_level: boolean;
};

export type ProfileTier = {
  tier: number;
  name: string;
  min_level: number;
  max_level: number;
};

export type ProfileStats = {
  user_name: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  total_post_likes: number;
  total_post_comments: number;
  profile_views_count: number;
  level: ProfileLevel;
  tier: ProfileTier;
};

export async function getAccountSettings(token: string): Promise<{ user_name: string }> {
  const envelope = await getJson<{ user_name: string }>('/user/profile', token);
  return assertSuccess(envelope);
}

export async function getProfileStats(token: string, username: string): Promise<ProfileStats> {
  const envelope = await getJson<ProfileStats>(`/profile/${encodeURIComponent(username)}/stats`, token);
  return assertSuccess(envelope);
}
