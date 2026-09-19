import { COLLECTIONS_GRID } from '@/data/collections-mock';
import { FEATURED_BANNERS } from '@/data/home-mock';

export type DetailVariant = 'single' | 'blindBox';
export type Availability = 'available' | 'soldOut' | 'comingSoon';

/** Small deterministic hash so the same id always renders the same demo state. */
function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getDetailVariant(id: string): DetailVariant {
  return hashId(id) % 2 === 0 ? 'single' : 'blindBox';
}

export function getAvailability(id: string): Availability {
  const states: Availability[] = ['available', 'soldOut', 'comingSoon'];
  return states[hashId(id) % states.length];
}

export function getPrice(id: string): string {
  const price = 20 + (hashId(id) % 480);
  return price.toFixed(2);
}

export function getComingSoonTarget(id: string): number {
  const daysOut = 1 + (hashId(id) % 6);
  return Date.now() + daysOut * 24 * 60 * 60 * 1000;
}

export const DESCRIPTION_TEXT =
  'A unique piece from the ElmonX collection, verified and stored securely on-chain. Ownership includes full commercial usage rights within the ElmonX community.';

export const DETAILS_TEXT =
  'Format: Digital collectible\nBlockchain: ElmonX Ledger\nStorage: Secure vault with insured custody\nAuthenticity: Verified by ElmonX Authentication';

const RARITIES: ('common' | 'rare' | 'ultraRare')[] = ['common', 'rare', 'ultraRare'];

export type BlindBoxItem = {
  id: string;
  title: string;
  date: string;
  price: string;
  rarity: 'common' | 'rare' | 'ultraRare';
  color: string;
  imageUrl?: string;
};

export function getBlindBoxItems(excludeId: string, count = 4): BlindBoxItem[] {
  const pool = COLLECTIONS_GRID.filter((item) => item.id !== excludeId);
  const items: BlindBoxItem[] = [];
  for (let i = 0; i < count && i < pool.length; i += 1) {
    const item = pool[(hashId(excludeId) + i * 7) % pool.length];
    items.push({
      id: `${item.id}-${i}`,
      title: item.title,
      date: item.dropDate,
      price: getPrice(item.id + i),
      rarity: RARITIES[(hashId(item.id) + i) % RARITIES.length],
      color: item.color,
      imageUrl: item.imageUrl,
    });
  }
  return items;
}

export type DetailSource = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  imageUrl?: string;
};

export function findDetailSource(id: string): DetailSource | undefined {
  const gridItem = COLLECTIONS_GRID.find((entry) => entry.id === id);
  if (gridItem) {
    return {
      id: gridItem.id,
      title: gridItem.title,
      subtitle: `Drop Date : ${gridItem.dropDate}`,
      color: gridItem.color,
      imageUrl: gridItem.imageUrl,
    };
  }

  const banner = FEATURED_BANNERS.find((entry) => entry.id === id);
  if (banner) {
    return {
      id: banner.id,
      title: banner.dropTitle,
      subtitle: banner.dropSubtitle,
      color: banner.colors[1],
      imageUrl: banner.imageUrl,
    };
  }

  return undefined;
}
