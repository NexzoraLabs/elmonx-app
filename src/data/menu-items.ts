import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type MenuItem = {
  key: string;
  label: string;
  icon: IoniconName;
};

export const ACCOUNT_MENU_ITEMS: MenuItem[] = [
  { key: 'my-collectibles', label: 'My Collectibles', icon: 'layers-outline' },
  { key: 'app-rewards', label: 'App Rewards', icon: 'storefront-outline' },
  { key: 'social-rewards', label: 'Social Rewards', icon: 'globe-outline' },
  { key: 'leaderboard', label: 'Leaderboard', icon: 'bar-chart-outline' },
  { key: 'favourites', label: 'Favourites', icon: 'heart-outline' },
  { key: 'explorer', label: 'Explorer', icon: 'compass-outline' },
  { key: 'community', label: 'Community', icon: 'people-outline' },
  { key: 'blogs', label: 'Blogs', icon: 'newspaper-outline' },
  { key: 'news', label: 'News', icon: 'megaphone-outline' },
  { key: 'profile', label: 'Profile', icon: 'person-outline' },
  { key: 'faqs', label: 'FAQs', icon: 'help-circle-outline' },
];

export const MARKET_MENU_ITEMS: MenuItem[] = [
  { key: 'browse-market', label: 'Browse Market', icon: 'cart-outline' },
  { key: 'my-listings', label: 'My Listings', icon: 'pricetags-outline' },
  { key: 'offers', label: 'Offers', icon: 'swap-horizontal-outline' },
];
