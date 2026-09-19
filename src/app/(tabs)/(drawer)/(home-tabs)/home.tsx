import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArPhotoTile } from '@/components/home/ar-photo-item';
import { CategoryTabs } from '@/components/home/category-tabs';
import { CollectibleCard } from '@/components/home/collectible-card';
import { CollectorTile } from '@/components/home/collector-item';
import { CommunityPostCard } from '@/components/home/community-post-card';
import { DropCard } from '@/components/home/drop-card';
import { ExploreCollectionCard } from '@/components/home/explore-collection-card';
import { FeaturedCarousel } from '@/components/home/featured-carousel';
import { FeaturedDropCard } from '@/components/home/featured-drop-card';
import { FilterChip } from '@/components/home/filter-chip';
import { HomeHeader } from '@/components/home/home-header';
import { LeavingSoonCard } from '@/components/home/leaving-soon-card';
import { SectionHeader } from '@/components/home/section-header';
import { WorldCategoryCard } from '@/components/home/world-category-card';
import { AppColors } from '@/constants/app-colors';
import {
  AR_PHOTOS,
  CATEGORY_TABS,
  COLLECTIBLES,
  COLLECTION_FILTERS,
  COMMUNITY_POSTS,
  ELITE_COLLECTORS,
  EXPLORE_COLLECTIONS,
  FEATURED_BANNERS,
  FEATURED_DROPS,
  ICONIC_WORLDS,
  LEAVING_SOON,
  UPCOMING_DROPS,
  type CollectionItem,
} from '@/data/home-mock';

export default function HomeScreen() {
  const [category, setCategory] = useState<string>(CATEGORY_TABS[0]);
  const [collectionFilter, setCollectionFilter] = useState<CollectionItem['category']>('Art');

  const filteredCollections = EXPLORE_COLLECTIONS.filter(
    (item) => item.category === collectionFilter
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <HomeHeader />
        <CategoryTabs categories={CATEGORY_TABS} selected={category} onSelect={setCategory} />

        <FeaturedCarousel banners={FEATURED_BANNERS} />

        <View style={styles.section}>
          <SectionHeader title="Upcoming Drops" onPressSeeAll={() => {}} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}>
            {UPCOMING_DROPS.map((item) => (
              <DropCard key={item.id} item={item} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader eyebrow="Featured Drop" title="Discover New Drops" onPressSeeAll={() => {}} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}>
            {FEATURED_DROPS.map((item) => (
              <FeaturedDropCard key={item.id} item={item} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Collectibles" onPressSeeAll={() => {}} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}>
            {COLLECTIBLES.map((item) => (
              <CollectibleCard key={item.id} item={item} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="AR Photos" onPressSeeAll={() => {}} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}>
            {AR_PHOTOS.map((item) => (
              <ArPhotoTile key={item.id} item={item} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Explore Iconic Worlds" />
          <View style={styles.grid}>
            {ICONIC_WORLDS.map((item) => (
              <WorldCategoryCard key={item.id} item={item} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Leaving Soon" onPressSeeAll={() => {}} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}>
            {LEAVING_SOON.map((item) => (
              <LeavingSoonCard key={item.id} item={item} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Elite Collectors" onPressSeeAll={() => {}} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}>
            {ELITE_COLLECTORS.map((item) => (
              <CollectorTile key={item.id} item={item} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Community Posts" onPressSeeAll={() => {}} />
          {COMMUNITY_POSTS.map((post) => (
            <CommunityPostCard key={post.id} post={post} />
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Explore Collections" />
          <View style={styles.filterRow}>
            {COLLECTION_FILTERS.map((filter) => (
              <FilterChip
                key={filter}
                label={filter}
                active={filter === collectionFilter}
                onPress={() => setCollectionFilter(filter)}
              />
            ))}
          </View>
          <View style={styles.grid}>
            {filteredCollections.map((item) => (
              <ExploreCollectionCard key={item.id} item={item} />
            ))}
          </View>
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
    paddingBottom: 32,
  },
  section: {
    marginTop: 28,
  },
  horizontalList: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    paddingHorizontal: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
});
