// Collections tab: the tab list and the card model every drop / collection grid renders.
export const COLLECTIONS_CATEGORY_TABS = ['Collections', 'Collectibles', 'Auctions', 'Partners', 'Artists'] as const;

export type CollectionCategory = 'Collections' | 'Collectibles' | 'Partners';

export type CollectionGridItem = {
  id: string;
  title: string;
  dropDate: string;
  color: string;
  category: CollectionCategory;
  dismissible?: boolean;
  imageUrl?: string;
  isBlindBox?: boolean;
  /** Set for individual blind box items returned by individual=True API; id = blindbox item _id, parentDropId = parent drop _id */
  parentDropId?: string;
  description?: string;
  isUpcoming?: boolean;
  price?: number;
  priceKind?: 'xcoin' | 'gbp' | 'airdrop';
  totalEditions?: number;
  consumedEditions?: number;
  isSoldOut?: boolean;
  dropEdition?: string;
  /** Individual blind box item's rarity (Regular / Rare / Secret Rare / Legendary) — hidden for special drops. */
  rarity?: string;
};
