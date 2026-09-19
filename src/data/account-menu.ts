import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type AccountRow = {
  key: string;
  label: string;
  icon: IoniconName;
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
      { key: 'settings', label: 'Settings', icon: 'settings-outline' },
    ],
  },
  {
    title: 'REWARDS & ACTIVITY',
    rows: [
      { key: 'app-rewards', label: 'App Rewards & Challenges', icon: 'storefront-outline' },
      { key: 'social-rewards', label: 'Social Rewards & Challenges', icon: 'globe-outline' },
      { key: 'leaderboard', label: 'Leaderboard', icon: 'bar-chart-outline' },
    ],
  },
  {
    title: 'COLLECTIONS',
    rows: [
      { key: 'my-collectibles', label: 'My Collectibles', icon: 'layers-outline' },
      { key: 'doodles-physicals', label: 'Doodles Physicals', icon: 'cube-outline' },
    ],
  },
  {
    title: 'PAYMENTS & ORDERS',
    rows: [
      { key: 'my-wallet', label: 'My Wallet', icon: 'wallet-outline' },
      { key: 'transactions', label: 'Transactions', icon: 'swap-vertical-outline' },
      { key: 'promo-code', label: 'Promo Code', icon: 'pricetag-outline' },
      { key: 'shipping-address', label: 'Shipping Address', icon: 'location-outline' },
    ],
  },
  {
    title: 'SUPPORT & LEGAL',
    rows: [
      { key: 'faqs', label: 'ElmonX FAQs', icon: 'help-circle-outline' },
      { key: 'legal', label: 'Legal', icon: 'information-circle-outline' },
    ],
  },
];
