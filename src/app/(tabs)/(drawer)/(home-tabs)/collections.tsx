import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryTabs } from '@/components/home/category-tabs';
import { CollectionGridCard } from '@/components/collections/collection-grid-card';
import { CollectionsHeader } from '@/components/collections/collections-header';
import { AppColors } from '@/constants/app-colors';
import { COLLECTIONS_CATEGORY_TABS, COLLECTIONS_GRID } from '@/data/collections-mock';

export default function CollectionsScreen() {
  const [category, setCategory] = useState<string>(COLLECTIONS_CATEGORY_TABS[0]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CollectionsHeader />
      <CategoryTabs
        categories={COLLECTIONS_CATEGORY_TABS}
        selected={category}
        onSelect={setCategory}
        underline
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {COLLECTIONS_GRID.map((item) => (
            <CollectionGridCard key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
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
});
