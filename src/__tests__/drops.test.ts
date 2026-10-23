import { describe, expect, it } from '@jest/globals';
import { dropToGridItem, slugify, type Drop } from '@/services/drops-api';

const baseDrop = {
  _id: 'drop1',
  title: 'Parent drop',
  description: '',
  price: 10,
  type: 'Layer_2',
  total_editions: 10,
  consumed_editions: 2,
  is_blind_box: false,
  images: [{ original_url: 'https://img/drop.png' }],
  release_date: '2026-01-01T00:00:00Z',
} as unknown as Drop;

describe('dropToGridItem', () => {
  it('uses the drop id for a normal drop', () => {
    const item = dropToGridItem(baseDrop);
    expect(item.id).toBe('drop1');
    expect(item.parentDropId).toBeUndefined();
    expect(item.priceKind).toBe('xcoin');
  });

  it('uses the blind box item id (unique key) and remembers the parent drop', () => {
    const item = dropToGridItem({
      ...baseDrop,
      is_blind_box: true,
      blind_box_items_data: { _id: 'item7', title: 'Item', total_editions: 5, consumed_editions: 5, image: [], rarity: 'Rare' },
    } as unknown as Drop);
    expect(item.id).toBe('item7');
    expect(item.parentDropId).toBe('drop1');
    expect(item.rarity).toBe('Rare');
  });
});

describe('slugify', () => {
  it('matches the website slug', () => {
    expect(slugify('Nymphéas en fleur, 1914-17 ')).toBe('nymphas_en_fleur_191417_');
  });
});
