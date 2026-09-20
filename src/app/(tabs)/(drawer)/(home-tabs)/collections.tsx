import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryTabs } from '@/components/home/category-tabs';
import { ArtistsTabPage } from '@/components/collections/artists-tab-page';
import { CollectionsHeader } from '@/components/collections/collections-header';
import { CollectionsPager, type CollectionsPage } from '@/components/collections/collections-pager';
import { DEFAULT_FILTERS, FiltersModal, type CollectionFilters } from '@/components/collections/filters-modal';
import { PaginatedGridPage } from '@/components/collections/paginated-grid-page';
import { AppColors } from '@/constants/app-colors';
import { COLLECTIONS_CATEGORY_TABS } from '@/data/collections-mock';
import { collectionListItemToGridItem, fetchCollectionsList } from '@/services/collections-api';
import { dropToGridItem, fetchFeaturedDrops, fetchPartnerDrops } from '@/services/drops-api';

export default function CollectionsScreen() {
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filters, setFilters] = useState<CollectionFilters>(DEFAULT_FILTERS);
  const [pageIndex, setPageIndex] = useState(0);

  const handleSelectTab = (category: string) => {
    const index = COLLECTIONS_CATEGORY_TABS.indexOf(category as (typeof COLLECTIONS_CATEGORY_TABS)[number]);
    if (index !== -1) setPageIndex(index);
  };

  const pages: CollectionsPage[] = [
    {
      key: 'Collections',
      element: (
        <PaginatedGridPage
          layout="single"
          skeletonCount={3}
          emptyMessage="No collections yet."
          fetchPage={(page) =>
            fetchCollectionsList(page).then((result) => ({
              items: result.items.map(collectionListItemToGridItem),
              totalRecords: result.totalRecords,
            }))
          }
        />
      ),
    },
    {
      key: 'Collectibles',
      element: (
        <PaginatedGridPage
          layout="grid"
          emptyMessage="No collectibles yet."
          fetchPage={(page) =>
            fetchFeaturedDrops(page).then((result) => ({
              items: result.items.map((drop) => dropToGridItem(drop, 'Collectibles')),
              totalRecords: result.totalRecords,
            }))
          }
        />
      ),
    },
    {
      key: 'Partners',
      element: (
        <PaginatedGridPage
          layout="grid"
          emptyMessage="No partner drops yet."
          fetchPage={(page) =>
            fetchPartnerDrops(page).then((result) => ({
              items: result.items.map((drop) => dropToGridItem(drop, 'Partners')),
              totalRecords: result.totalRecords,
            }))
          }
        />
      ),
    },
    {
      key: 'Artists',
      element: <ArtistsTabPage />,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CollectionsHeader onPressFilter={() => setFiltersVisible(true)} />
      <CategoryTabs
        categories={COLLECTIONS_CATEGORY_TABS}
        selected={COLLECTIONS_CATEGORY_TABS[pageIndex]}
        onSelect={handleSelectTab}
        underline
      />

      <CollectionsPager pages={pages} selectedIndex={pageIndex} onIndexChange={setPageIndex} />

      <FiltersModal
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        filters={filters}
        onApply={setFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
});
