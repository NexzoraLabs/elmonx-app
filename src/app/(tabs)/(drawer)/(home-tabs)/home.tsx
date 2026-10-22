import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SuggestedUsersStrip } from '@/components/feed/suggested-users-strip';
import { AuctionCardHome } from '@/components/home/auction-card';
import { BlogCard } from '@/components/home/blog-card';
import { CollectibleCard } from '@/components/home/collectible-card';
import { DropCard } from '@/components/home/drop-card';
import { FeaturedCarousel } from '@/components/home/featured-carousel';
import { FeaturedDropCard } from '@/components/home/featured-drop-card';
import { HomeHeader } from '@/components/home/home-header';
import { NewsCard } from '@/components/home/news-card';
import { SectionHeader } from '@/components/home/section-header';
import { makeStyles, useAppColors } from '@/context/theme-context';
import {
  type AuctionCard,
  fetchAuctions,
} from '@/services/auction-api';
import { dropToGridItem } from '@/services/drops-api';
import {
  fetchNews,
  fetchStoreItems,
  type HomeBanner,
  type HomeBlog,
  type NewsItem,
  type StoreItems,
} from '@/services/home-api';
import type { CollectionGridItem } from '@/data/collections-mock';
import { useTranslation } from 'react-i18next';

export default function HomeScreen() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [upcoming, setUpcoming] = useState<CollectionGridItem[]>([]);
  const [featured, setFeatured] = useState<CollectionGridItem[]>([]);
  const [collectibles, setCollectibles] = useState<CollectionGridItem[]>([]);
  const [blogs, setBlogs] = useState<HomeBlog[]>([]);
  const [promoTitle, setPromoTitle] = useState<string | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [auctions, setAuctions] = useState<AuctionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockNow, setClockNow] = useState(() => Date.now());

  const nextChangeAt = useRef<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [store, newsData, auctionRes] = await Promise.allSettled([
          fetchStoreItems(),
          fetchNews(),
          fetchAuctions({ limit: 12 }),
        ]);

        if (cancelled) return;

        if (store.status === 'fulfilled') {
          const s: StoreItems = store.value;
          setBanners(s.banners);
          setUpcoming(s.upcoming.map((d) => dropToGridItem(d, 'Collectibles')));
          setFeatured(s.featured.map((d) => dropToGridItem(d, 'Collectibles')));
          setCollectibles(s.collectibles.map((d) => dropToGridItem(d, 'Collectibles')));
          setBlogs(s.blogs);
          setPromoTitle(s.promoTitle);
        }

        if (newsData.status === 'fulfilled') {
          setNews(newsData.value.slice(0, 6));
        }

        if (auctionRes.status === 'fulfilled' && auctionRes.value.status === 200) {
          setAuctions(auctionRes.value.data.items);
          nextChangeAt.current = auctionRes.value.data.next_change_at
            ? new Date(auctionRes.value.data.next_change_at).getTime()
            : null;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header stays pinned; only the content below scrolls (same as the other tabs). */}
      <HomeHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {promoTitle ? (
          <View style={styles.promoRow}>
            <Text style={styles.promoTitle}>{promoTitle}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={AppColors.textSecondary} />
          </View>
        ) : (
          <>
            {banners.length > 0 ? <FeaturedCarousel banners={banners} /> : null}

            {auctions.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader
                  title={t('ElmonX Auction')}
                  subtitle={t('Bid in X-coins. Nothing is charged until you win.')}
                  onPressSeeAll={() => router.push('/auctions')}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}>
                  {auctions.map((a) => (
                    <AuctionCardHome key={a._id} auction={a} now={clockNow} />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {upcoming.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title={t('Upcoming Drops')} onPressSeeAll={() => {}} />
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
                <SectionHeader
                  title={t('Featured Drops')}
                  // `t` makes a repeat tap re-select Collectibles even if the user swiped away since.
                  onPressSeeAll={() =>
                    router.navigate({ pathname: '/collections', params: { tab: 'Collectibles', t: String(Date.now()) } })
                  }
                />
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

            {blogs.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader
                  title={t('ElmonX 101')}
                  onPressSeeAll={() => WebBrowser.openBrowserAsync('https://elmonx.com/articles')}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}>
                  {blogs.map((b) => (
                    <BlogCard key={b.id} blog={b} />
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.section}>
                <SectionHeader
                  title={t('ElmonX 101')}
                  onPressSeeAll={() => WebBrowser.openBrowserAsync('https://elmonx.com/articles')}
                />
              </View>
            )}

            {news.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader
                  title={t('News')}
                  onPressSeeAll={() => WebBrowser.openBrowserAsync('https://elmonx.com/news')}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}>
                  {news.map((n) => (
                    <NewsCard key={n._id} item={n} />
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.section}>
                <SectionHeader
                  title={t('News')}
                  onPressSeeAll={() => WebBrowser.openBrowserAsync('https://elmonx.com/news')}
                />
              </View>
            )}

            {collectibles.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title={t('Collectibles')} onPressSeeAll={() => {}} />
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

            <SuggestedUsersStrip variant="home" />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((AppColors) => ({
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
  promoRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  promoTitle: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
  },
  section: {
    marginTop: 32,
  },
  horizontalList: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
}));
