import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryTabs } from '@/components/home/category-tabs';
import { ArtistListRow } from '@/components/collections/artist-list-row';
import { CollectionGridCard } from '@/components/collections/collection-grid-card';
import { CollectionsHeader } from '@/components/collections/collections-header';
import { DEFAULT_FILTERS, FiltersModal, type CollectionFilters } from '@/components/collections/filters-modal';
import { AppColors } from '@/constants/app-colors';
import { ARTISTS } from '@/data/artists-mock';
import { COLLECTIONS_CATEGORY_TABS, COLLECTIONS_GRID } from '@/data/collections-mock';

export default function CollectionsScreen() {
  const [category, setCategory] = useState<string>(COLLECTIONS_CATEGORY_TABS[0]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filters, setFilters] = useState<CollectionFilters>(DEFAULT_FILTERS);

  const gridItems =
    category === 'Collections'
      ? COLLECTIONS_GRID
      : category === 'Favourites'
        ? COLLECTIONS_GRID.filter((item) => item.favourite)
        : COLLECTIONS_GRID.filter((item) => item.category === category);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CollectionsHeader onPressFilter={() => setFiltersVisible(true)} />
      <CategoryTabs
        categories={COLLECTIONS_CATEGORY_TABS}
        selected={category}
        onSelect={setCategory}
        underline
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {category === 'Artists' ? (
          ARTISTS.map((artist) => <ArtistListRow key={artist.id} artist={artist} />)
        ) : gridItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nothing here yet.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {gridItems.map((item) => (
              <CollectionGridCard key={item.id} item={item} />
            ))}
          </View>
        )}
      </ScrollView>

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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 20,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
});
