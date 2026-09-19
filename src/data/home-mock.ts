import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type Rarity = 'common' | 'rare' | 'ultraRare';

export const CATEGORY_TABS = ['All', 'Trending', 'Popular', 'Upcoming'] as const;

export type FeaturedBanner = {
  id: string;
  eyebrow: string;
  title: string;
  dropTitle: string;
  dropSubtitle: string;
  endsAt: number;
  colors: [string, string];
  imageUrl?: string;
};

export const FEATURED_BANNERS: FeaturedBanner[] = [
  {
    id: 'mondrian',
    eyebrow: 'PIET MONDRIAN',
    title: 'Doodles',
    dropTitle: 'Patrick Hughes | Picassos',
    dropSubtitle: 'Thursday 8AM PT 30th July',
    endsAt: Date.now() + (5 * 24 * 60 + 24 * 60 + 40) * 60 * 1000,
    colors: ['#E4E7F5', '#B9C6F0'],
    imageUrl: 'https://assets.elmonx.com/collections/1787011204239_519406411.webp',
  },
  {
    id: 'basquiat',
    eyebrow: 'JEAN-MICHEL',
    title: 'Crowns',
    dropTitle: 'Alex Morgan | Icons',
    dropSubtitle: 'Friday 6PM PT 7th August',
    endsAt: Date.now() + (2 * 24 * 60 + 8 * 60 + 15) * 60 * 1000,
    colors: ['#FCE8D5', '#F2B880'],
    imageUrl: 'https://assets.elmonx.com/collections/1786316912555_113690215.webp',
  },
  {
    id: 'warhol',
    eyebrow: 'ANDY WARHOL',
    title: 'Prints',
    dropTitle: 'Taylor Swift | Editions',
    dropSubtitle: 'Sunday 12PM PT 16th August',
    endsAt: Date.now() + (9 * 24 * 60 + 2 * 60 + 5) * 60 * 1000,
    colors: ['#D9F2E6', '#8FD6B4'],
    imageUrl: 'https://assets.elmonx.com/collections/1785914933779_709184833.webp',
  },
];

export type DropItem = {
  id: string;
  title: string;
  expected: string;
  color: string;
};

export const UPCOMING_DROPS: DropItem[] = [
  { id: 'drop-1', title: 'Guardian Spirit', expected: '30 JUN 2026', color: '#7B3FF2' },
  { id: 'drop-2', title: 'Astro Cadet', expected: '30 JUL 2026', color: '#2AB3A6' },
  { id: 'drop-3', title: 'Neon Oracle', expected: '12 AUG 2026', color: '#E0637C' },
];

export type FeaturedDropItem = {
  id: string;
  title: string;
  date: string;
  color: string;
};

export const FEATURED_DROPS: FeaturedDropItem[] = [
  { id: 'fd-1', title: 'Excessive Incarceration', date: '22 Jul 27', color: '#B4442E' },
  { id: 'fd-2', title: 'Riot', date: '22 Jul 27', color: '#2E5FB4' },
  { id: 'fd-3', title: 'T206', date: '22 Jul 27', color: '#C79A3A' },
];

export type CollectibleItem = {
  id: string;
  title: string;
  date: string;
  price: string;
  rarity: Rarity;
  color: string;
};

export const COLLECTIBLES: CollectibleItem[] = [
  { id: 'col-1', title: 'Blue Butterfly', date: '10 Nov 27', price: '99.99', rarity: 'rare', color: '#2E5FB4' },
  { id: 'col-2', title: 'Crimson Statue', date: '10 Nov 27', price: '149.99', rarity: 'ultraRare', color: '#B4442E' },
  { id: 'col-3', title: 'Coral Reef', date: '18 Nov 27', price: '59.99', rarity: 'common', color: '#2AB3A6' },
  { id: 'col-4', title: 'Golden Mask', date: '02 Dec 27', price: '199.99', rarity: 'ultraRare', color: '#C79A3A' },
];

export type ArPhotoItem = {
  id: string;
  name: string;
  timeAgo: string;
  color: string;
};

export const AR_PHOTOS: ArPhotoItem[] = [
  { id: 'ar-1', name: 'Liam Carter', timeAgo: '3 hours ago', color: '#7B3FF2' },
  { id: 'ar-2', name: 'Sophia Bennett', timeAgo: '3 hours ago', color: '#E0637C' },
  { id: 'ar-3', name: 'Noah Reyes', timeAgo: '5 hours ago', color: '#2AB3A6' },
];

export type WorldCategory = {
  id: string;
  label: string;
  icon: IoniconName;
};

export const ICONIC_WORLDS: WorldCategory[] = [
  { id: 'mona-lisa', label: 'Mona Lisa', icon: 'image-outline' },
  { id: 'fine-art', label: 'Fine Art', icon: 'color-palette-outline' },
  { id: 'sculptures', label: 'Sculptures', icon: 'cube-outline' },
  { id: 'designer-toys', label: 'Designer Toys', icon: 'game-controller-outline' },
  { id: 'royal-collection', label: 'Royal Collection', icon: 'ribbon-outline' },
  { id: 'world-heritage', label: 'World Heritage', icon: 'earth-outline' },
];

export type LeavingSoonItem = {
  id: string;
  title: string;
  date: string;
  price: string;
  endsAt: number;
  color: string;
};

export const LEAVING_SOON: LeavingSoonItem[] = [
  {
    id: 'ls-1',
    title: 'Where The War Th...',
    date: '10 Nov 27',
    price: '99.99',
    endsAt: Date.now() + (2 * 24 * 60 + 19 * 60 + 40) * 60 * 1000,
    color: '#B4442E',
  },
  {
    id: 'ls-2',
    title: 'Coral Butterfly',
    date: '10 Nov 27',
    price: '99.99',
    endsAt: Date.now() + (1 * 24 * 60 + 4 * 60 + 12) * 60 * 1000,
    color: '#2E5FB4',
  },
];

export type CollectorItem = {
  id: string;
  name: string;
  level: number;
  rewardXp: number;
  color: string;
};

export const ELITE_COLLECTORS: CollectorItem[] = [
  { id: 'ec-1', name: 'Alex Morgan', level: 20, rewardXp: 5050, color: '#7B3FF2' },
  { id: 'ec-2', name: 'Taylor Swift', level: 20, rewardXp: 5050, color: '#E0637C' },
  { id: 'ec-3', name: 'Chris Evans', level: 20, rewardXp: 5050, color: '#2AB3A6' },
];

export type CommunityPost = {
  id: string;
  name: string;
  verified: boolean;
  isFollowing: boolean;
  timeAgo: string;
  caption: string;
  images: string[];
  likeCount: string;
  commentCount: string;
  viewCount: string;
  repostCount: string;
  shareCount: string;
  color: string;
};

export const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    name: 'Liam Carter',
    verified: true,
    isFollowing: false,
    timeAgo: '1d',
    caption:
      'Just acquired an incredible digital art piece! Thrilled to be part of this vibrant NFT community! #CryptoArt #DigitalCollectibles',
    images: ['#6B4F8A'],
    likeCount: '5.5k',
    commentCount: '297',
    viewCount: '297',
    repostCount: '10',
    shareCount: '10',
    color: '#2E5FB4',
  },
  {
    id: 'post-2',
    name: 'Evelyn Brooks',
    verified: false,
    isFollowing: false,
    timeAgo: '1d',
    caption:
      'Just minted a stunning new NFT that captures the essence of the digital age! Excited to share this journey with fellow art enthusiasts! #NFTArt #DigitalTreasures',
    images: ['#1B2A6B', '#3C8C3C'],
    likeCount: '5.5k',
    commentCount: '297',
    viewCount: '297',
    repostCount: '10',
    shareCount: '10',
    color: '#C77B4A',
  },
  {
    id: 'post-3',
    name: 'Sophia Bennett',
    verified: true,
    isFollowing: true,
    timeAgo: '2d',
    caption:
      'Finally completed my Mondrian Doodles set! The hunt for that last piece took three weeks. Worth every trade. #Doodles #Collector',
    images: ['#7B3FF2'],
    likeCount: '3.2k',
    commentCount: '184',
    viewCount: '184',
    repostCount: '6',
    shareCount: '6',
    color: '#7B3FF2',
  },
  {
    id: 'post-4',
    name: 'Chris Evans',
    verified: false,
    isFollowing: true,
    timeAgo: '3d',
    caption:
      'Reached Level 20 on the leaderboard this week. Grinding those social rewards paid off! #ElmonX #Leaderboard',
    images: ['#C79A3A'],
    likeCount: '4.1k',
    commentCount: '210',
    viewCount: '210',
    repostCount: '9',
    shareCount: '9',
    color: '#C79A3A',
  },
];

export type CollectionItem = {
  id: string;
  title: string;
  date: string;
  rarity: Rarity;
  category: 'Art' | 'Sculptures' | 'Toys';
  color: string;
};

export const COLLECTION_FILTERS = ['Art', 'Sculptures', 'Toys'] as const;

export const EXPLORE_COLLECTIONS: CollectionItem[] = [
  { id: 'ec1', title: 'Bruiser Liquid Sun', date: '15 Oct 31', rarity: 'common', category: 'Art', color: '#C79A3A' },
  { id: 'ec2', title: 'Boy Soldier', date: '15 Oct 31', rarity: 'rare', category: 'Sculptures', color: '#2E5FB4' },
];
