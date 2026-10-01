import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArtistsTabPage } from '@/components/collections/artists-tab-page';
import { CollectionsHeader } from '@/components/collections/collections-header';
import { CollectionsPager, type CollectionsPage } from '@/components/collections/collections-pager';
import { FiltersModal } from '@/components/collections/filters-modal';
import { PaginatedGridPage } from '@/components/collections/paginated-grid-page';
import { CategoryTabs } from '@/components/home/category-tabs';
import { AppColors } from '@/constants/app-colors';
import { COLLECTIONS_CATEGORY_TABS } from '@/data/collections-mock';
import {
  DEFAULT_CATALOG_FILTERS,
  fetchFilterBrands,
  fetchFilterCategories,
  type CatalogFilters,
  type CatalogTab,
  type FilterOption,
} from '@/services/catalog-filters';
import { collectionListItemToGridItem, fetchCollectionsList } from '@/services/collections-api';
import { dropToGridItem, fetchFeaturedDrops, fetchPartnerDrops } from '@/services/drops-api';

type Chip = { key: string; label: string; clear: (f: CatalogFilters) => CatalogFilters };

function filterChips(filters: CatalogFilters, tab: CatalogTab, brands: FilterOption[], categories: FilterOption[]): Chip[] {
  const chips: Chip[] = [];
  if (tab !== 'Partners') {
    if (filters.blockchain !== 'All') chips.push({ key: 'chain', label: filters.blockchain, clear: (f) => ({ ...f, blockchain: 'All' }) });
    if (filters.destination !== 'All') chips.push({ key: 'dest', label: filters.destination, clear: (f) => ({ ...f, destination: 'All' }) });
    if (filters.edition !== 'all') chips.push({ key: 'edition', label: filters.edition, clear: (f) => ({ ...f, edition: 'all' }) });
    if (filters.categoryId) {
      const title = categories.find((c) => c._id === filters.categoryId)?.title.trim() ?? 'Category';
      chips.push({ key: 'category', label: title, clear: (f) => ({ ...f, categoryId: null }) });
    }
  }
  filters.brandIds.forEach((id) => {
    const title = brands.find((b) => b._id === id)?.title ?? 'Artist';
    chips.push({ key: `brand-${id}`, label: title, clear: (f) => ({ ...f, brandIds: f.brandIds.filter((b) => b !== id) }) });
  });
  if (filters.dateFrom || filters.dateTo) {
    chips.push({
      key: 'date',
      label: `${filters.dateFrom || '…'} → ${filters.dateTo || '…'}`,
      clear: (f) => ({ ...f, dateFrom: '', dateTo: '' }),
    });
  }
  if (filters.priceMin || filters.priceMax) {
    chips.push({
      key: 'price',
      label: `£${filters.priceMin || '0'} – ${filters.priceMax ? `£${filters.priceMax}` : 'any'}`,
      clear: (f) => ({ ...f, priceMin: '', priceMax: '' }),
    });
  }
  return chips;
}

export default function CollectionsScreen() {
  const [pageIndex, setPageIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filtersByTab, setFiltersByTab] = useState<Record<CatalogTab, CatalogFilters>>({
    Collections: DEFAULT_CATALOG_FILTERS,
    Collectibles: DEFAULT_CATALOG_FILTERS,
    Partners: DEFAULT_CATALOG_FILTERS,
  });
  const [brands, setBrands] = useState<FilterOption[]>([]);
  const [categories, setCategories] = useState<FilterOption[]>([]);

  const currentTab = COLLECTIONS_CATEGORY_TABS[pageIndex];
  const catalogTab: CatalogTab | null = currentTab === 'Artists' ? null : currentTab;

  // Website: 300ms debounce, server-side search sent as `filter`.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchText.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Filter option lists come from the same endpoints the website uses.
  useEffect(() => {
    fetchFilterBrands().then(setBrands).catch(() => {});
    fetchFilterCategories().then(setCategories).catch(() => {});
  }, []);

  const handleSelectTab = (category: string) => {
    const index = COLLECTIONS_CATEGORY_TABS.indexOf(category as (typeof COLLECTIONS_CATEGORY_TABS)[number]);
    if (index !== -1) setPageIndex(index);
  };

  const handleToggleSearch = () => {
    if (searchOpen) {
      setSearchText('');
      setSearch('');
    }
    setSearchOpen((prev) => !prev);
  };

  const setTabFilters = (tab: CatalogTab, filters: CatalogFilters) =>
    setFiltersByTab((prev) => ({ ...prev, [tab]: filters }));

  // Remount a page whenever its search/filters change so it reloads from page 1 (website behaviour).
  const pageKey = (tab: string) => `${tab}|${search}|${JSON.stringify(tab in filtersByTab ? filtersByTab[tab as CatalogTab] : {})}`;

  const pages: CollectionsPage[] = [
    {
      key: 'Collections',
      element: (
        <PaginatedGridPage
          key={pageKey('Collections')}
          layout="single"
          skeletonCount={3}
          emptyMessage={search ? `No collections found for "${search}".` : 'No collections yet.'}
          fetchPage={(page) =>
            fetchCollectionsList(page, filtersByTab.Collections, search).then((result) => ({
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
          key={pageKey('Collectibles')}
          layout="grid"
          emptyMessage={search ? `No collectibles found for "${search}".` : 'No collectibles yet.'}
          fetchPage={(page) =>
            fetchFeaturedDrops(page, filtersByTab.Collectibles, search).then((result) => ({
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
          key={pageKey('Partners')}
          layout="grid"
          emptyMessage={search ? `No partner drops found for "${search}".` : 'No partner drops yet.'}
          fetchPage={(page) =>
            fetchPartnerDrops(page, filtersByTab.Partners, search).then((result) => ({
              items: result.items.map((drop) => dropToGridItem(drop, 'Partners')),
              totalRecords: result.totalRecords,
            }))
          }
        />
      ),
    },
    {
      key: 'Artists',
      element: <ArtistsTabPage key={`Artists|${search}`} search={search} />,
    },
  ];

  const chips = catalogTab ? filterChips(filtersByTab[catalogTab], catalogTab, brands, categories) : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CollectionsHeader
        searchActive={searchOpen}
        onPressSearch={handleToggleSearch}
        onPressFilter={catalogTab ? () => setFiltersVisible(true) : undefined}
        activeFilterCount={chips.length}
      />

      {searchOpen ? (
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={AppColors.textSecondary} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={`Search ${currentTab.toLowerCase()}`}
            placeholderTextColor={AppColors.textPlaceholder}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {searchText ? (
            <Pressable hitSlop={8} onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={AppColors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <CategoryTabs
        categories={COLLECTIONS_CATEGORY_TABS}
        selected={currentTab}
        onSelect={handleSelectTab}
        underline
      />

      {catalogTab && chips.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsBar} contentContainerStyle={styles.chips}>
          {chips.map((chip) => (
            <Pressable
              key={chip.key}
              style={styles.chip}
              onPress={() => setTabFilters(catalogTab, chip.clear(filtersByTab[catalogTab]))}>
              <Text style={styles.chipText} numberOfLines={1}>
                {chip.label}
              </Text>
              <Ionicons name="close" size={13} color={AppColors.textSecondary} />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <CollectionsPager pages={pages} selectedIndex={pageIndex} onIndexChange={setPageIndex} />

      {catalogTab ? (
        <FiltersModal
          visible={filtersVisible}
          onClose={() => setFiltersVisible(false)}
          tab={catalogTab}
          filters={filtersByTab[catalogTab]}
          onApply={(filters) => setTabFilters(catalogTab, filters)}
          brands={brands}
          categories={categories}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 21,
    backgroundColor: AppColors.surface,
  },
  searchInput: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  chipsBar: {
    flexGrow: 0,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 220,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  chipText: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
});
