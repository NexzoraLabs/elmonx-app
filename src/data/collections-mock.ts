export const COLLECTIONS_CATEGORY_TABS = [
  'Collections',
  'Collectibles',
  'Art',
  'Sculptures',
  'Toys',
  'Artists',
  'Favourites',
] as const;

export type CollectionCategory = 'Art' | 'Sculptures' | 'Toys' | 'Collectibles';

export type CollectionGridItem = {
  id: string;
  title: string;
  dropDate: string;
  color: string;
  category: CollectionCategory;
  dismissible?: boolean;
  favourite?: boolean;
};

export const COLLECTIONS_GRID: CollectionGridItem[] = [
  {
    id: 'c1',
    title: 'Patrick Hughes Gallery',
    dropDate: '10 Nov 27',
    color: '#C9C2B2',
    category: 'Art',
    dismissible: true,
    favourite: true,
  },
  {
    id: 'c2',
    title: 'Dagger from the Tomb of Tutankhamun',
    dropDate: '10 Nov 27',
    color: '#8A6A2E',
    category: 'Collectibles',
  },
  {
    id: 'c3',
    title: 'Monet: Impressions of Light',
    dropDate: '10 Nov 27',
    color: '#4A5A8A',
    category: 'Art',
    dismissible: true,
    favourite: true,
  },
  {
    id: 'c4',
    title: 'Piet Mondrian Doodles',
    dropDate: '10 Nov 27',
    color: '#E8E8E8',
    category: 'Toys',
  },
  {
    id: 'c5',
    title: 'Trading Card Vault',
    dropDate: '10 Nov 27',
    color: '#1B1F2E',
    category: 'Collectibles',
  },
  {
    id: 'c6',
    title: 'Van Gogh Masterpieces Vol. 1',
    dropDate: '10 Nov 27',
    color: '#8A4A2E',
    category: 'Art',
  },
];
