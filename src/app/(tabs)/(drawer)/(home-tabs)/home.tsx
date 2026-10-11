import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArPhotoTile } from '@/components/home/ar-photo-item';
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
  COLLECTION_FILTERS,
  COMMUNITY_POSTS,
  ELITE_COLLECTORS,
  EXPLORE_COLLECTIONS,
  ICONIC_WORLDS,
  LEAVING_SOON,
  type CollectionItem,
} from '@/data/home-mock';
import type { CollectionGridItem } from '@/data/collections-mock';
import type { HomeBanner } from '@/services/home-api';
import { fetchStoreItems } from '@/services/home-api';
import { dropToGridItem } from '@/services/drops-api';

export default function HomeScreen() {
  const [collectionFilter, setCollectionFilter] = useState<CollectionItem['category']>('Art');

  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [upcoming, setUpcoming] = useState<CollectionGridItem[]>([]);
  const [featured, setFeatured] = useState<CollectionGridItem[]>([]);
  const [collectibles, setCollectibles] = useState<CollectionGridItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchStoreItems()
      .then((items) => {
        if (cancelled) return;
        setBanners(items.banners);
        setUpcoming(items.upcoming.map((d) => dropToGridItem(d, 'Collectibles')));
        setFeatured(items.featured.map((d) => dropToGridItem(d, 'Collectibles')));
        setCollectibles(items.collectibles.map((d) => dropToGridItem(d, 'Collectibles')));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCollections = EXPLORE_COLLECTIONS.filter(
    (item) => item.category === collectionFilter
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <HomeHeader />

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={AppColors.textSecondary} />
          </View>
        ) : (
          <>
            {banners.length > 0 ? <FeaturedCarousel banners={banners} /> : null}

            {upcoming.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Upcoming Drops" onPressSeeAll={() => {}} />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}>
                  {upcoming.map((item) => (
                    <DropCard key={item.id} item={item} />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {featured.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader eyebrow="Featured Drop" title="Discover New Drops" onPressSeeAll={() => {}} />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}>
                  {featured.map((item) => (
                    <FeaturedDropCard key={item.id} item={item} />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {collectibles.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Collectibles" onPressSeeAll={() => {}} />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}>
                  {collectibles.map((item) => (
                    <CollectibleCard key={item.id} item={item} />
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </>
        )}

        {/* ElmonX 101 — content not shown in app; View All opens website */}
        <View style={styles.section}>
          <SectionHeader
            title="ElmonX 101"
            onPressSeeAll={() => WebBrowser.openBrowserAsync('https://elmonx.com/articles')}
          />
        </View>

        {/* News — content not shown in app; View All opens website */}
        <View style={styles.section}>
          <SectionHeader
            title="News"
            onPressSeeAll={() => WebBrowser.openBrowserAsync('https://elmonx.com/news')}
          />
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
  loadingRow: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  section: {
    marginTop: 32,
  },
  horizontalList: {
    flexDirection: 'row',
    gap: 12,
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
