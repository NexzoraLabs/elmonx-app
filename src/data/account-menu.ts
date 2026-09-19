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
      { key: 'account', label: 'Account', icon: 'person-outline' },
      { key: 'personal-information', label: 'Personal Information', icon: 'id-card-outline' },
      { key: 'settings', label: 'Settings', icon: 'settings-outline' },
    ],
  },
  {
    title: 'REWARDS & ACTIVITY',
    rows: [
      { key: 'app-rewards', label: 'App Rewards', icon: 'storefront-outline' },
      { key: 'challenges', label: 'Challenges', icon: 'trophy-outline' },
      { key: 'leaderboard', label: 'Leaderboard', icon: 'bar-chart-outline' },
    ],
  },
  {
    title: 'COLLECTIONS',
    rows: [
      { key: 'my-wallet-collectables', label: 'My Wallet Collectables', icon: 'layers-outline' },
      { key: 'my-vault-collectables', label: 'My Vault Collectables', icon: 'shield-checkmark-outline' },
      { key: 'doodles-physicals', label: 'Doodles Physicals', icon: 'cube-outline' },
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
  {
    title: 'PREFERENCES',
    rows: [{ key: 'dark-mode', label: 'Dark Mode', icon: 'moon-outline', type: 'toggle' }],
  },
];
