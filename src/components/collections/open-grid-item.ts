import { router } from 'expo-router';

import type { CollectionGridItem } from '@/data/collections';

/**
 * Where a drop / collection card goes. An individual blind box item (Collectibles with
 * `individual=True`) has its own page; its `id` is the item, not a drop, so `/drop/<id>` would say
 * "No drop found". Every card (grids and the Home rows) must go through here.
 */
export function openGridItem(item: CollectionGridItem) {
  if (item.parentDropId) {
    router.push({ pathname: '/blindbox-item/[dropId]/[itemId]', params: { dropId: item.parentDropId, itemId: item.id } });
    return;
  }
  router.push({ pathname: item.category === 'Collections' ? '/collection/[id]' : '/drop/[id]', params: { id: item.id } });
}
