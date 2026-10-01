import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** The capped actions counting towards the Daily Social Goal, in render order. */
export const SOCIAL_ACTION_KEYS = ['create_post', 'post_comment', 'post_like'];

/** Drop tasks don't count towards the goal/streaks — rendered as their own block, last. */
export const DROP_ACTION_KEYS = ['drop_like', 'drop_comment'];

export const SOCIAL_ACTION_HINTS: Record<string, string> = {
  create_post: 'Post something today. A photo, or 5 characters of text.',
  post_comment: "Comment on someone's post. At least 3 characters. Multiple comments on the same post only count once.",
  post_like: "Like someone else's post. Your own posts don't count.",
  drop_like: "Like a drop you haven't liked before. Each drop pays once.",
  drop_comment: 'Comment on a drop. At least 10 characters. Each drop pays once.',
};

export const SOCIAL_ACTION_ICONS: Record<string, IoniconName> = {
  create_post: 'create-outline',
  post_comment: 'chatbubble-outline',
  post_like: 'heart-outline',
  drop_like: 'flame-outline',
  drop_comment: 'chatbubbles-outline',
};

export type FollowTierMeta = {
  key: string;
  title: string;
  description: string;
  points: number;
  goal: number;
};

export const FOLLOW_TIERS: FollowTierMeta[] = [
  { key: 'follow_20_accounts', title: 'Follow 20 Accounts', description: 'Follow 20 accounts to earn a one-time bonus.', points: 100, goal: 20 },
  { key: 'follow_50_accounts', title: 'Follow 50 Accounts', description: 'Keep going. Follow 50 accounts in total for another bonus.', points: 250, goal: 50 },
];

export const FOLLOWER_TIERS: FollowTierMeta[] = [
  { key: 'get_20_followers', title: 'Get 20 Followers', description: 'Reach 20 followers to earn a one-time bonus.', points: 150, goal: 20 },
  { key: 'get_50_followers', title: 'Get 50 Followers', description: 'Reach 50 followers in total for another bonus.', points: 250, goal: 50 },
];

/** Actions-tab keys that reset every midnight — once claimed, show a countdown instead of "Done". */
export const REPEATING_ACTION_KEYS = new Set(['daily_login', 'daily_spin']);
