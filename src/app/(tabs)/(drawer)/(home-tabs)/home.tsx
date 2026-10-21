import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuctionCardHome } from '@/components/home/auction-card';
import { BlogCard } from '@/components/home/blog-card';
import { CollectibleCard } from '@/components/home/collectible-card';
import { DropCard } from '@/components/home/drop-card';
import { FeaturedCarousel } from '@/components/home/featured-carousel';
import { FeaturedDropCard } from '@/components/home/featured-drop-card';
import { HomeHeader } from '@/components/home/home-header';
import { NewsCard } from '@/components/home/news-card';
import { SectionHeader } from '@/components/home/section-header';
import { Image } from 'expo-image';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
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
import { followUser, getSuggestedUsers, type SuggestedUser, unfollowUser } from '@/services/feed-api';
import { isImageUrl } from '@/services/profile-api';

function CollectorRow({ user, token }: { user: SuggestedUser; token: string | null }) {
  const [following, setFollowing] = useState(!!user.is_following);
  const [busy, setBusy] = useState(false);

  const avatarUrl = isImageUrl(user.profile_avatar) ? user.profile_avatar : null;

  async function toggle() {
    if (!token || busy) return;
    setBusy(true);
    try {
      if (following) {
        await unfollowUser(token, user._id);
        setFollowing(false);
      } else {
        await followUser(token, user._id);
        setFollowing(true);
      }
    } catch { /* silent */ } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.collectorCard}>
      <View style={styles.collectorAvatarWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: AppColors.border }]} />
        )}
      </View>
      <Text style={styles.collectorName} numberOfLines={1}>{user.user_name}</Text>
      {token ? (
        <Pressable
          style={[styles.followBtn, following && styles.followBtnActive]}
          onPress={toggle}
          disabled={busy}>
          <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const { token } = useAuth();
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [upcoming, setUpcoming] = useState<CollectionGridItem[]>([]);
  const [featured, setFeatured] = useState<CollectionGridItem[]>([]);
  const [collectibles, setCollectibles] = useState<CollectionGridItem[]>([]);
  const [blogs, setBlogs] = useState<HomeBlog[]>([]);
  const [promoTitle, setPromoTitle] = useState<string | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [auctions, setAuctions] = useState<AuctionCard[]>([]);
  const [collectors, setCollectors] = useState<SuggestedUser[]>([]);
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
        const [store, newsData, auctionRes, collectorRes] = await Promise.allSettled([
          fetchStoreItems(),
          fetchNews(),
          fetchAuctions({ limit: 12 }),
          getSuggestedUsers(null, 10),
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

        if (collectorRes.status === 'fulfilled') {
          const users = collectorRes.value as SuggestedUser[];
          setCollectors(Array.isArray(users) ? users.slice(0, 8) : []);
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <HomeHeader />

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
                  title="ElmonX Auctions"
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

            {blogs.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader
                  title="ElmonX 101"
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
                  title="ElmonX 101"
                  onPressSeeAll={() => WebBrowser.openBrowserAsync('https://elmonx.com/articles')}
                />
              </View>
            )}

            {news.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader
                  title="News"
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
                  title="News"
                  onPressSeeAll={() => WebBrowser.openBrowserAsync('https://elmonx.com/news')}
                />
              </View>
            )}

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

            {collectors.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Suggested Collectors" onPressSeeAll={() => {}} />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}>
                  {collectors.map((u) => (
                    <CollectorRow key={u._id} user={u} token={token} />
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </>
        )}
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
  collectorCard: {
    width: 90,
    alignItems: 'center',
    gap: 6,
  },
  collectorAvatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: AppColors.surface,
    overflow: 'hidden',
  },
  collectorName: {
    color: AppColors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: AppColors.buttonPrimaryBg,
  },
  followBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  followBtnText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 11,
    fontWeight: '700',
  },
  followBtnTextActive: {
    color: AppColors.textSecondary,
  },
});
