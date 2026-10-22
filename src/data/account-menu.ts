import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type AccountRow = {
  key: string;
  label: string;
  icon: IoniconName;
  type?: 'toggle';
};

export type AccountSection = {
  title: string;
  rows: AccountRow[];
};

export const ACCOUNT_SECTIONS: AccountSection[] = [
  {
    title: 'ACCOUNT',
    rows: [
      { key: 'personal-information', label: 'Personal Information', icon: 'id-card-outline' },
      { key: 'settings', label: 'Settings', icon: 'settings-outline' },
      { key: 'language', label: 'Language', icon: 'language-outline' },
      { key: 'connections', label: 'Connections', icon: 'people-outline' },
    ],
  },
  {
    title: 'REWARDS & ACTIVITY',
    rows: [
      { key: 'app-rewards', label: 'App Rewards', icon: 'storefront-outline' },
      { key: 'challenges', label: 'Quests, Earn XP', icon: 'trophy-outline' },
      { key: 'leaderboard', label: 'Leaderboard', icon: 'bar-chart-outline' },
    ],
  },
  {
    title: 'Collectables',
    rows: [
      // One entry — the screen has Vault / Wallet / Auctions tabs (swipeable).
      { key: 'my-collectables', label: 'My Collectables', icon: 'layers-outline' },
      { key: 'doodles-physicals', label: 'Doodles Physicals', icon: 'cube-outline' },
      // Opens Unity's Multi-Viewer with every owned 3D collectible (hooks/use-multi-viewer.ts).
      { key: 'multi-viewer', label: 'Multi-Viewer', icon: 'grid-outline' },
    ],
  },
  {
    title: 'PAYMENTS & ORDERS',
    rows: [
      { key: 'my-wallet', label: 'My Wallet', icon: 'wallet-outline' },
      { key: 'promo-code', label: 'Promo Code', icon: 'pricetag-outline' },
      { key: 'shipping-address', label: 'Shipping Address', icon: 'location-outline' },
    ],
  },
];
