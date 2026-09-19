export const COLLECTIONS_CATEGORY_TABS = [
  'Collections',
  'Collectibles',
  'Partners',
  'Art',
  'Artists',
] as const;

export type CollectionCategory = 'Collectibles' | 'Partners' | 'Art';

export type CollectionGridItem = {
  id: string;
  title: string;
  dropDate: string;
  color: string;
  category: CollectionCategory;
  dismissible?: boolean;
};

const COLLECTIBLES: CollectionGridItem[] = [
  { id: 'col-1', title: 'Dagger from the Tomb of Tutankhamun', dropDate: '10 Nov 27', color: '#8A6A2E', category: 'Collectibles' },
  { id: 'col-2', title: 'Trading Card Vault', dropDate: '12 Nov 27', color: '#1B1F2E', category: 'Collectibles' },
  { id: 'col-3', title: 'Ming Dynasty Vase', dropDate: '14 Nov 27', color: '#2E5FB4', category: 'Collectibles', dismissible: true },
  { id: 'col-4', title: 'Roman Coin Set', dropDate: '16 Nov 27', color: '#C79A3A', category: 'Collectibles' },
  { id: 'col-5', title: 'Samurai Katana Replica', dropDate: '18 Nov 27', color: '#4A4A4A', category: 'Collectibles' },
  { id: 'col-6', title: 'Victorian Pocket Watch', dropDate: '20 Nov 27', color: '#8A6A2E', category: 'Collectibles' },
  { id: 'col-7', title: 'Ancient Greek Amphora', dropDate: '22 Nov 27', color: '#B4442E', category: 'Collectibles', dismissible: true },
  { id: 'col-8', title: 'Ivory Chess Set', dropDate: '24 Nov 27', color: '#E8E8E8', category: 'Collectibles' },
  { id: 'col-9', title: 'Ottoman Silk Tapestry', dropDate: '26 Nov 27', color: '#7B3FF2', category: 'Collectibles' },
  { id: 'col-10', title: 'Ediacaran Fossil Cast', dropDate: '28 Nov 27', color: '#2AB3A6', category: 'Collectibles' },
];

const PARTNERS: CollectionGridItem[] = [
  { id: 'ptn-1', title: 'Nike x ElmonX Drop', dropDate: '02 Dec 27', color: '#1B1F2E', category: 'Partners' },
  { id: 'ptn-2', title: 'Adidas Originals Vault', dropDate: '04 Dec 27', color: '#2E5FB4', category: 'Partners' },
  { id: 'ptn-3', title: 'Marvel Studios Collection', dropDate: '06 Dec 27', color: '#B4442E', category: 'Partners', dismissible: true },
  { id: 'ptn-4', title: 'Warner Bros Classics', dropDate: '08 Dec 27', color: '#4A4A4A', category: 'Partners' },
  { id: 'ptn-5', title: 'Disney Vault Rarities', dropDate: '10 Dec 27', color: '#7B3FF2', category: 'Partners' },
  { id: 'ptn-6', title: 'Coca-Cola Heritage Set', dropDate: '12 Dec 27', color: '#B4442E', category: 'Partners' },
  { id: 'ptn-7', title: 'Ferrari Legacy Series', dropDate: '14 Dec 27', color: '#8A2E2E', category: 'Partners', dismissible: true },
  { id: 'ptn-8', title: 'Rolex Timepiece Archive', dropDate: '16 Dec 27', color: '#C79A3A', category: 'Partners' },
  { id: 'ptn-9', title: 'Louis Vuitton Trunk Series', dropDate: '18 Dec 27', color: '#8A6A2E', category: 'Partners' },
  { id: 'ptn-10', title: 'National Geographic Explorer Set', dropDate: '20 Dec 27', color: '#2AB3A6', category: 'Partners' },
];

const ART: CollectionGridItem[] = [
  { id: 'art-1', title: 'Patrick Hughes Gallery', dropDate: '10 Nov 27', color: '#C9C2B2', category: 'Art', dismissible: true },
  { id: 'art-2', title: 'Monet: Impressions of Light', dropDate: '10 Nov 27', color: '#4A5A8A', category: 'Art', dismissible: true },
  { id: 'art-3', title: 'Piet Mondrian Doodles', dropDate: '10 Nov 27', color: '#E8E8E8', category: 'Art' },
  { id: 'art-4', title: 'Van Gogh Masterpieces Vol. 1', dropDate: '10 Nov 27', color: '#8A4A2E', category: 'Art' },
  { id: 'art-5', title: 'Picasso Blue Period', dropDate: '12 Nov 27', color: '#2E5FB4', category: 'Art' },
  { id: 'art-6', title: 'Da Vinci Sketches Collection', dropDate: '14 Nov 27', color: '#8A6A2E', category: 'Art' },
  { id: 'art-7', title: 'Rembrandt Light Studies', dropDate: '16 Nov 27', color: '#4A4A4A', category: 'Art' },
  { id: 'art-8', title: 'Dali Surreal Dreams', dropDate: '18 Nov 27', color: '#C79A3A', category: 'Art' },
  { id: 'art-9', title: 'Basquiat Crown Series', dropDate: '20 Nov 27', color: '#B4442E', category: 'Art' },
  { id: 'art-10', title: 'Warhol Pop Editions', dropDate: '22 Nov 27', color: '#7B3FF2', category: 'Art' },
];

export const COLLECTIONS_GRID: CollectionGridItem[] = [...COLLECTIBLES, ...PARTNERS, ...ART];
