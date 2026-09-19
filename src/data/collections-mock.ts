export const COLLECTIONS_CATEGORY_TABS = ['Collections', 'Collectibles', 'Partners', 'Artists'] as const;

export type CollectionCategory = 'Collectibles' | 'Partners';

export type CollectionGridItem = {
  id: string;
  title: string;
  dropDate: string;
  color: string;
  category: CollectionCategory;
  dismissible?: boolean;
  imageUrl?: string;
};

const COLLECTIBLES: CollectionGridItem[] = [
  { id: 'col-1', title: 'Dagger from the Tomb of Tutankhamun', dropDate: '10 Nov 27', color: '#8A6A2E', category: 'Collectibles', imageUrl: 'https://assets.elmonx.com/drops/1754296280985_180592430.png' },
  { id: 'col-2', title: 'Trading Card Vault', dropDate: '12 Nov 27', color: '#1B1F2E', category: 'Collectibles', imageUrl: 'https://assets.elmonx.com/drops/1754296290890_401984887.png' },
  { id: 'col-3', title: 'Ming Dynasty Vase', dropDate: '14 Nov 27', color: '#2E5FB4', category: 'Collectibles', dismissible: true, imageUrl: 'https://assets.elmonx.com/drops/1754296343717_967812359.png' },
  { id: 'col-4', title: 'Roman Coin Set', dropDate: '16 Nov 27', color: '#C79A3A', category: 'Collectibles', imageUrl: 'https://assets.elmonx.com/drops/1754296570143_148915379.png' },
  { id: 'col-5', title: 'Samurai Katana Replica', dropDate: '18 Nov 27', color: '#4A4A4A', category: 'Collectibles', imageUrl: 'https://assets.elmonx.com/drops/1754296379704_493235667.png' },
  { id: 'col-6', title: 'Victorian Pocket Watch', dropDate: '20 Nov 27', color: '#8A6A2E', category: 'Collectibles', imageUrl: 'https://assets.elmonx.com/drops/1754296355984_763057948.png' },
  { id: 'col-7', title: 'Ancient Greek Amphora', dropDate: '22 Nov 27', color: '#B4442E', category: 'Collectibles', dismissible: true, imageUrl: 'https://assets.elmonx.com/drops/1789583176853_744986190.webp' },
  { id: 'col-8', title: 'Ivory Chess Set', dropDate: '24 Nov 27', color: '#E8E8E8', category: 'Collectibles', imageUrl: 'https://assets.elmonx.com/drops/1789583054319_883137848.webp' },
  { id: 'col-9', title: 'Ottoman Silk Tapestry', dropDate: '26 Nov 27', color: '#7B3FF2', category: 'Collectibles', imageUrl: 'https://assets.elmonx.com/drops/1789582916156_421505741.webp' },
  { id: 'col-10', title: 'Ediacaran Fossil Cast', dropDate: '28 Nov 27', color: '#2AB3A6', category: 'Collectibles' },
];

const PARTNERS: CollectionGridItem[] = [
  { id: 'ptn-1', title: 'Nike x ElmonX Drop', dropDate: '02 Dec 27', color: '#1B1F2E', category: 'Partners', imageUrl: 'https://assets.elmonx.com/drops/1788902002254_929180894.webp' },
  { id: 'ptn-2', title: 'Adidas Originals Vault', dropDate: '04 Dec 27', color: '#2E5FB4', category: 'Partners', imageUrl: 'https://assets.elmonx.com/drops/1788901906033_261321574.webp' },
  { id: 'ptn-3', title: 'Marvel Studios Collection', dropDate: '06 Dec 27', color: '#B4442E', category: 'Partners', dismissible: true },
  { id: 'ptn-4', title: 'Warner Bros Classics', dropDate: '08 Dec 27', color: '#4A4A4A', category: 'Partners' },
  { id: 'ptn-5', title: 'Disney Vault Rarities', dropDate: '10 Dec 27', color: '#7B3FF2', category: 'Partners' },
  { id: 'ptn-6', title: 'Coca-Cola Heritage Set', dropDate: '12 Dec 27', color: '#B4442E', category: 'Partners' },
  { id: 'ptn-7', title: 'Ferrari Legacy Series', dropDate: '14 Dec 27', color: '#8A2E2E', category: 'Partners', dismissible: true },
  { id: 'ptn-8', title: 'Rolex Timepiece Archive', dropDate: '16 Dec 27', color: '#C79A3A', category: 'Partners' },
  { id: 'ptn-9', title: 'Louis Vuitton Trunk Series', dropDate: '18 Dec 27', color: '#8A6A2E', category: 'Partners' },
  { id: 'ptn-10', title: 'National Geographic Explorer Set', dropDate: '20 Dec 27', color: '#2AB3A6', category: 'Partners' },
];

export const COLLECTIONS_GRID: CollectionGridItem[] = [...COLLECTIBLES, ...PARTNERS];
