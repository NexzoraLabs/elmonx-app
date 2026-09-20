import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryTabs } from '@/components/home/category-tabs';
import { ArtistListRow } from '@/components/collections/artist-list-row';
import { CollectionGridCard } from '@/components/collections/collection-grid-card';
import { CollectionsHeader } from '@/components/collections/collections-header';
import { DEFAULT_FILTERS, FiltersModal, type CollectionFilters } from '@/components/collections/filters-modal';
import { AppColors } from '@/constants/app-colors';
import { ARTISTS } from '@/data/artists-mock';
import { COLLECTIONS_CATEGORY_TABS, COLLECTIONS_GRID, type CollectionGridItem } from '@/data/collections-mock';
import { dropToGridItem, fetchFeaturedDrops } from '@/services/drops-api';

export default function CollectionsScreen() {
  const [category, setCategory] = useState<string>(COLLECTIONS_CATEGORY_TABS[0]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filters, setFilters] = useState<CollectionFilters>(DEFAULT_FILTERS);
  const scrollRef = useRef<ScrollView>(null);

  const [collectibles, setCollectibles] = useState<CollectionGridItem[]>([]);
  const [collectiblesLoading, setCollectiblesLoading] = useState(true);
  const [collectiblesError, setCollectiblesError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchFeaturedDrops()
      .then((drops) => {
        if (cancelled) return;
        setCollectibles(drops.map(dropToGridItem));
        setCollectiblesError(false);
      })
      .catch(() => {
        if (!cancelled) setCollectiblesError(true);
      })
      .finally(() => {
        if (!cancelled) setCollectiblesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [category]);

  const gridItems =
    category === 'Collectibles'
      ? collectibles
      : COLLECTIONS_GRID.filter((item) => item.category === category);
  const isSingleColumn = category === 'Collections';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CollectionsHeader onPressFilter={() => setFiltersVisible(true)} />
      <CategoryTabs
        categories={COLLECTIONS_CATEGORY_TABS}
        selected={category}
        onSelect={setCategory}
        underline
      />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {category === 'Artists' ? (
          ARTISTS.map((artist) => <ArtistListRow key={artist.id} artist={artist} />)
        ) : category === 'Collectibles' && collectiblesLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={AppColors.textPrimary} />
          </View>
        ) : category === 'Collectibles' && collectiblesError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Couldn&apos;t load collectibles. Pull to try again later.</Text>
          </View>
        ) : gridItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nothing here yet.</Text>
          </View>
        ) : (
          <View style={isSingleColumn ? styles.list : styles.grid}>
            {gridItems.map((item) => (
              <CollectionGridCard
                key={item.id}
                item={item}
                layout={isSingleColumn ? 'single' : 'grid'}
              />
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
  list: {
    gap: 20,
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
