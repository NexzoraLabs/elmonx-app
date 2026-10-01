import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UserAvatar } from '@/components/account/user-avatar';
import { feedRowToItem, type FeedItem } from '@/components/feed/post-card';
import { PostList } from '@/components/feed/post-list';
import { SuggestedUsersStrip } from '@/components/feed/suggested-users-strip';
import { SegmentTabs } from '@/components/social/segment-tabs';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import { useCurrentUserId } from '@/hooks/use-current-user-id';
import * as feedApi from '@/services/feed-api';
import { onFeedChanged } from '@/services/feed-events';

const SEGMENTS = ['For you', 'Following'] as const;
type Segment = (typeof SEGMENTS)[number];

export default function FeedScreen() {
  const { token, user } = useAuth();
  const currentUserId = useCurrentUserId();
  const [segment, setSegment] = useState<Segment>('For you');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Drops responses from a tab the user already switched away from.
  const requestRef = useRef(0);

  const load = useCallback(
    async (which: Segment, nextPage: number) => {
      const requestId = ++requestRef.current;
      if (nextPage === 1) setIsLoading(true);
      else setIsLoadingMore(true);
      try {
        const rows =
          which === 'For you'
            ? await feedApi.getForYouFeed(token, nextPage)
            : token
              ? await feedApi.getFollowingFeed(token, nextPage)
              : [];
        if (requestId !== requestRef.current) return;
        const batch = rows.map(feedRowToItem);
        setItems((prev) => {
          if (nextPage === 1) return batch;
          const seen = new Set(prev.map((item) => item.key));
          return [...prev, ...batch.filter((item) => !seen.has(item.key))];
        });
        setPage(nextPage);
        setHasMore(rows.length === feedApi.FEED_PAGE_SIZE);
        setMessage(null);
      } catch (e) {
        if (requestId === requestRef.current) setMessage(e instanceof Error ? e.message : 'Unable to load the feed.');
      } finally {
        if (requestId === requestRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [token]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load('For you', 1);
  }, [load]);

  // Refresh after a post is created elsewhere (compose screen).
  useEffect(() => onFeedChanged(() => load(segment, 1)), [load, segment]);

  const handleSelect = (option: string) => {
    const next = option as Segment;
    if (next === segment) {
      load(next, 1);
      return;
    }
    setSegment(next);
    setItems([]);
    setHasMore(true);
    load(next, 1);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load(segment, 1);
    setIsRefreshing(false);
  };

  const header = (
    <View>
      <Pressable style={({ pressed }) => [styles.composeRow, pressed && styles.pressed]} onPress={() => router.push('/create-post')}>
        <UserAvatar user={user} size={40} />
        <Text style={styles.composePlaceholder}>What&apos;s new?</Text>
        <Ionicons name="image-outline" size={20} color={AppColors.textSecondary} />
      </Pressable>
      {segment === 'For you' ? <SuggestedUsersStrip /> : null}
    </View>
  );

  const empty = isLoading ? (
    <ActivityIndicator style={styles.loading} color={AppColors.link} />
  ) : (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={28} color={AppColors.textSecondary} />
      <Text style={styles.emptyTitle}>Nothing here yet</Text>
      <Text style={styles.emptySubtitle}>
        {message ?? (segment === 'Following' ? 'Posts from people you follow will show up here.' : 'No posts yet.')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Feed</Text>
        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search users"
            hitSlop={8}
            onPress={() => router.push('/user-search')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons name="search-outline" size={19} color={AppColors.textPrimary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create post"
            hitSlop={8}
            onPress={() => router.push('/create-post')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons name="add" size={22} color={AppColors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <SegmentTabs options={SEGMENTS} selected={segment} onSelect={handleSelect} />

      <PostList
        items={items}
        setItems={setItems}
        currentUserId={currentUserId}
        header={header}
        empty={empty}
        isLoadingMore={isLoadingMore}
        onEndReached={() => {
          if (!isLoading && !isLoadingMore && hasMore) load(segment, page + 1);
        }}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  topActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  composeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  composePlaceholder: {
    flex: 1,
    color: AppColors.textSecondary,
    fontSize: 14,
  },
  loading: {
    paddingVertical: 48,
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: AppColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
});
