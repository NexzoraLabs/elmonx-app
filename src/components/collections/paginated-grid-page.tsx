import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { CollectionGridCard } from '@/components/collections/collection-grid-card';
import { SkeletonGrid } from '@/components/collections/skeleton-grid';
import { AppColors } from '@/constants/app-colors';
import type { CollectionGridItem } from '@/data/collections-mock';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import type { PagedResult } from '@/services/drops-api';

type PaginatedGridPageProps = {
  layout: 'grid' | 'single';
  fetchPage: (page: number) => Promise<PagedResult<CollectionGridItem>>;
  skeletonCount?: number;
  emptyMessage?: string;
  errorMessage?: string;
};

export function PaginatedGridPage({
  layout,
  fetchPage,
  skeletonCount = 6,
  emptyMessage = 'Nothing here yet.',
  errorMessage = "Couldn't load. Pull to try again later.",
}: PaginatedGridPageProps) {
  const { items, loading, loadingMore, error, loadMore } = usePaginatedList(fetchPage);

  if (loading) {
    return (
      <View style={styles.page}>
        <SkeletonGrid layout={layout} count={skeletonCount} />
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={[styles.page, styles.center]}>
        <Text style={styles.emptyText}>{errorMessage}</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.page, styles.center]}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.flexFill}
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={layout === 'grid' ? 2 : 1}
      columnWrapperStyle={layout === 'grid' ? styles.columnWrapper : undefined}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => <CollectionGridCard item={item} layout={layout} />}
      onEndReachedThreshold={0.4}
      onEndReached={loadMore}
      ItemSeparatorComponent={layout === 'single' ? () => <View style={styles.separator} /> : undefined}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator color={AppColors.textPrimary} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  flexFill: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  separator: {
    height: 20,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
