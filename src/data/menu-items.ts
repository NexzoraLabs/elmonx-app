import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type MenuItem = {
  key: string;
  label: string;
  icon: IoniconName;
};

export const ACCOUNT_MENU_ITEMS: MenuItem[] = [
  { key: 'explorer', label: 'Explorer', icon: 'compass-outline' },
  { key: 'community', label: 'Community', icon: 'people-outline' },
  { key: 'blogs', label: 'Blogs', icon: 'newspaper-outline' },
  { key: 'news', label: 'News', icon: 'megaphone-outline' },
  { key: 'profile', label: 'Profile', icon: 'person-outline' },
  { key: 'faqs', label: 'FAQs', icon: 'help-circle-outline' },
  { key: 'terms', label: 'Terms & Conditions', icon: 'document-text-outline' },
  { key: 'privacy', label: 'Privacy Policy', icon: 'shield-outline' },
];
