export type ChallengeProgress = { key: 'week_complete_days' | 'monthly_complete_days'; goal: number };

export type ChallengeDefinition = {
  key: string;
  title: string;
  description: string;
  pointsLabel: string;
  /** When set, shows a "<n>/<goal> days" badge instead of a button until claimable. */
  progress?: ChallengeProgress;
  /** Daily-repeating tasks show a reset countdown instead of a permanent "Done" state. */
  isRepeating?: boolean;
  /** "Spin" instead of "Claim" — triggers the spin-reward endpoint instead of claim. */
  isSpin?: boolean;
  /** Purely informational row with no claim action at all (matches the live site). */
  isInfoOnly?: boolean;
};

export const CHALLENGES: ChallengeDefinition[] = [
  {
    key: 'daily_login',
    title: 'Daily Login',
    description: 'Log in each day to earn points',
    pointsLabel: '+10 XP',
    isRepeating: true,
  },
  {
    key: 'weekly_streak',
    title: 'Weekly Streak (7 consecutive days Login)',
    description: 'Keep your streak alive for 7 days straight to unlock bonus points',
    pointsLabel: '+100 XP',
    progress: { key: 'week_complete_days', goal: 7 },
  },
  {
    key: 'monthly_streak',
    title: 'Monthly Loyalty Login',
    description: 'Log in every day for 30 days to unlock and claim your reward.',
    pointsLabel: '+500 XP',
    progress: { key: 'monthly_complete_days', goal: 30 },
  },
  {
    key: 'complete_profile',
    title: 'Complete Profile',
    description: 'Fill out your profile details to earn points',
    pointsLabel: '+100 XP',
  },
  {
    key: 'shipping_address',
    title: 'Shipping Address',
    description: 'Add a shipping address to your account and earn points',
    pointsLabel: '+100 XP',
  },
  {
    key: 'first_purchase',
    title: 'First Ever App Digital Collectible Purchase',
    description: 'Make your first digital collectible purchase on App and earn bonus points',
    pointsLabel: '+500 XP',
  },
  {
    key: 'daily_spin',
    title: 'Daily Spin',
    description: 'Spin the wheel once a day for a chance at random XP rewards',
    pointsLabel: 'Luck',
    isRepeating: true,
    isSpin: true,
  },
  {
    key: 'any_store_purchase',
    title: 'Any store purchase',
    description: 'Earn points every time you buy something from the store',
    pointsLabel: '+50 XP',
    isInfoOnly: true,
  },
];
