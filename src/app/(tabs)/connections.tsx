import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles, useAppColors } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import * as feedApi from '@/services/feed-api';
import type {
  BlockedListItem,
  FollowListItem,
  FollowRequestItem,
} from '@/services/feed-api';
import { useTranslation } from 'react-i18next';
import { TabIndicator } from '@/components/motion';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TABS: Tab[] = ['followers', 'following', 'blocked'];

type Tab = 'followers' | 'following' | 'blocked';

const PAGE_SIZE = 20;
const DEFAULT_AVATAR = 'https://assets.elmonx.com/default.png';

function avatar(url?: string | null): string {
  return url && url !== 'images/avatar/default.png' ? url : DEFAULT_AVATAR;
}

export default function ConnectionsScreen() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { token, user } = useAuth();
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialIndex = params.tab === 'following' ? 1 : params.tab === 'blocked' ? 2 : 0;
  const [tabIndex, setTabIndex] = useState(initialIndex);
  const scrollRef = useRef<ScrollView>(null);
  const myUserId = (user as { _id?: string })?._id ?? '';

  const goToTab = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setTabIndex(index);
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setTabIndex(index);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('Connections')}</Text>
        <View style={styles.backButton} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabs}>
        {TABS.map((key, i) => {
          const active = tabIndex === i;
          const label = key.charAt(0).toUpperCase() + key.slice(1);
          return (
            <Pressable key={key} style={styles.tab} onPress={() => goToTab(i)}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t(label)}</Text>
              <TabIndicator active={active} style={[styles.tabIndicator, styles.tabIndicatorActive]} />
            </Pressable>
          );
        })}
      </View>

      {/* Swipeable pages */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        contentOffset={{ x: initialIndex * SCREEN_WIDTH, y: 0 }}
        onMomentumScrollEnd={handleMomentumEnd}
        style={styles.pager}>
        <View style={styles.page}>
          <FollowersList token={token} userId={myUserId} />
        </View>
        <View style={styles.page}>
          <FollowingList token={token} userId={myUserId} />
        </View>
        <View style={styles.page}>
          <BlockedList token={token} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────── Followers ─────────────────────────────────

function FollowersList({ token, userId }: { token: string | null; userId: string }) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const [requests, setRequests] = useState<FollowRequestItem[]>([]);
  const [followers, setFollowers] = useState<FollowListItem[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const load = useCallback(async (p: number) => {
    if (!token || !userId) return;
    if (p === 1) setLoading(true);
    try {
      const [fwRes, reqRes, ingRes] = await Promise.allSettled([
        feedApi.getFollowers(token, userId, p, PAGE_SIZE),
        p === 1 ? feedApi.getFollowRequests(token, 1, 50) : Promise.resolve(null),
        p === 1 ? feedApi.getFollowing(token, userId, 1, 50) : Promise.resolve(null),
      ]);

      if (ingRes.status === 'fulfilled' && ingRes.value) {
        const ids = new Set((ingRes.value.data ?? []).map((r) => r.user._id));
        setFollowingIds(ids);
      }
      if (reqRes.status === 'fulfilled' && reqRes.value) {
        setRequests(reqRes.value.data ?? []);
      }
      if (fwRes.status === 'fulfilled') {
        const data = (fwRes.value as { data?: FollowListItem[]; total_count?: number }).data ?? [];
        const total = (fwRes.value as { total_count?: number }).total_count ?? data.length;
        setFollowers((prev) => (p === 1 ? data : [...prev, ...data]));
        setTotalPages(Math.ceil(total / PAGE_SIZE));
        setPage(p);
      }
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load(1);
  }, [load]);

  const setBusy = (id: string, busy: boolean) =>
    setBusyIds((prev) => {
      const n = new Set(prev);
      if (busy) n.add(id);
      else n.delete(id);
      return n;
    });

  const handleAccept = async (req: FollowRequestItem) => {
    if (!token) return;
    setBusy(req._id, true);
    try {
      await feedApi.acceptFollowRequest(token, req.user._id);
      setRequests((prev) => prev.filter((r) => r._id !== req._id));
    } finally {
      setBusy(req._id, false);
    }
  };

  const handleReject = async (req: FollowRequestItem) => {
    if (!token) return;
    setBusy(req._id, true);
    try {
      await feedApi.rejectFollowRequest(token, req.user._id);
      setRequests((prev) => prev.filter((r) => r._id !== req._id));
    } finally {
      setBusy(req._id, false);
    }
  };

  const handleFollowBack = async (item: FollowListItem) => {
    if (!token) return;
    const uid = item.user._id;
    setBusy(uid, true);
    const isFollowing = followingIds.has(uid);
    try {
      if (isFollowing) {
        await feedApi.unfollowUser(token, uid);
        setFollowingIds((prev) => { const n = new Set(prev); n.delete(uid); return n; });
      } else {
        await feedApi.followUser(token, uid);
        setFollowingIds((prev) => new Set([...prev, uid]));
      }
    } finally {
      setBusy(uid, false);
    }
  };

  if (loading) return <ActivityIndicator style={styles.centeredLoader} color={AppColors.link} />;

  const header = requests.length > 0 ? (
    <View style={styles.requestsSection}>
      <Text style={styles.subHeader}>{t('Follow Requests ({{n}})', { n: requests.length })}</Text>
      {requests.map((req) => (
        <View key={req._id} style={styles.userRow}>
          <AvatarImage url={req.user.profile_avatar} />
          <Pressable
            style={styles.userInfo}
            onPress={() => router.push({ pathname: '/profile/[id]', params: { id: req.user.user_name } })}>
            <Text style={styles.userName}>@{req.user.user_name}</Text>
          </Pressable>
          <View style={styles.actionBtns}>
            <Pressable
              style={[styles.btn, styles.btnPrimary, busyIds.has(req._id) && styles.btnDisabled]}
              disabled={busyIds.has(req._id)}
              onPress={() => handleAccept(req)}>
              <Text style={styles.btnPrimaryText}>{t('Accept')}</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnSecondary, busyIds.has(req._id) && styles.btnDisabled]}
              disabled={busyIds.has(req._id)}
              onPress={() => handleReject(req)}>
              <Text style={styles.btnSecondaryText}>{t('Decline')}</Text>
            </Pressable>
          </View>
        </View>
      ))}
      <View style={styles.divider} />
    </View>
  ) : null;

  return (
    <FlatList
      data={followers}
      keyExtractor={(item) => item.user._id}
      ListHeaderComponent={header}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onEndReachedThreshold={0.4}
      onEndReached={() => { if (page < totalPages) load(page + 1); }}
      ListEmptyComponent={<EmptyState label={t('No followers yet')} />}
      renderItem={({ item }) => {
        const isFollowing = followingIds.has(item.user._id);
        return (
          <View style={styles.userRow}>
            <AvatarImage url={item.user.profile_avatar} />
            <Pressable
              style={styles.userInfo}
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.user.user_name } })}>
              <Text style={styles.userName}>@{item.user.user_name}</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, isFollowing ? styles.btnSecondary : styles.btnPrimary, busyIds.has(item.user._id) && styles.btnDisabled]}
              disabled={busyIds.has(item.user._id)}
              onPress={() => handleFollowBack(item)}>
              <Text style={isFollowing ? styles.btnSecondaryText : styles.btnPrimaryText}>
                {isFollowing ? t('Following', { context: 'button' }) : t('Follow Back')}
              </Text>
            </Pressable>
          </View>
        );
      }}
    />
  );
}

// ─────────────────────────────── Following ─────────────────────────────────

function FollowingList({ token, userId }: { token: string | null; userId: string }) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const [following, setFollowing] = useState<FollowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const load = useCallback(async (p: number) => {
    if (!token || !userId) return;
    if (p === 1) setLoading(true);
    try {
      const res = await feedApi.getFollowing(token, userId, p, PAGE_SIZE);
      const data = (res as { data?: FollowListItem[] }).data ?? [];
      const total = (res as { total_count?: number }).total_count ?? data.length;
      setFollowing((prev) => (p === 1 ? data : [...prev, ...data]));
      setTotalPages(Math.ceil(total / PAGE_SIZE));
      setPage(p);
    } catch {
      // Keep whatever was already loaded on a transient failure.
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load(1);
  }, [load]);

  const setBusy = (id: string, busy: boolean) =>
    setBusyIds((prev) => {
      const n = new Set(prev);
      if (busy) n.add(id);
      else n.delete(id);
      return n;
    });

  const handleUnfollow = async (item: FollowListItem) => {
    if (!token) return;
    setBusy(item.user._id, true);
    try {
      await feedApi.unfollowUser(token, item.user._id);
      setFollowing((prev) => prev.filter((r) => r.user._id !== item.user._id));
    } finally {
      setBusy(item.user._id, false);
    }
  };

  if (loading) return <ActivityIndicator style={styles.centeredLoader} color={AppColors.link} />;

  return (
    <FlatList
      data={following}
      keyExtractor={(item) => item.user._id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onEndReachedThreshold={0.4}
      onEndReached={() => { if (page < totalPages) load(page + 1); }}
      ListEmptyComponent={<EmptyState label={t('Not following anyone yet')} />}
      renderItem={({ item }) => (
        <View style={styles.userRow}>
          <AvatarImage url={item.user.profile_avatar} />
          <Pressable
            style={styles.userInfo}
            onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.user.user_name } })}>
            <Text style={styles.userName}>@{item.user.user_name}</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnSecondary, busyIds.has(item.user._id) && styles.btnDisabled]}
            disabled={busyIds.has(item.user._id)}
            onPress={() => handleUnfollow(item)}>
            <Text style={styles.btnSecondaryText}>{t('Unfollow')}</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

// ─────────────────────────────── Blocked ───────────────────────────────────

function BlockedList({ token }: { token: string | null }) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const [blocked, setBlocked] = useState<BlockedListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const load = useCallback(async (p: number) => {
    if (!token) return;
    if (p === 1) setLoading(true);
    try {
      const res = await feedApi.getBlockedUsers(token, p, PAGE_SIZE);
      const data = (res as { data?: BlockedListItem[] }).data ?? [];
      const total = (res as { total_count?: number }).total_count ?? data.length;
      setBlocked((prev) => (p === 1 ? data : [...prev, ...data]));
      setTotalPages(Math.ceil(total / PAGE_SIZE));
      setPage(p);
    } catch {
      // Keep whatever was already loaded on a transient failure.
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load(1);
  }, [load]);

  const setBusy = (id: string, busy: boolean) =>
    setBusyIds((prev) => {
      const n = new Set(prev);
      if (busy) n.add(id);
      else n.delete(id);
      return n;
    });

  const handleUnblock = async (item: BlockedListItem) => {
    if (!token) return;
    setBusy(item.user._id, true);
    try {
      await feedApi.unblockUser(token, item.user._id);
      setBlocked((prev) => prev.filter((r) => r.user._id !== item.user._id));
    } finally {
      setBusy(item.user._id, false);
    }
  };

  if (loading) return <ActivityIndicator style={styles.centeredLoader} color={AppColors.link} />;

  return (
    <FlatList
      data={blocked}
      keyExtractor={(item) => item.user._id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onEndReachedThreshold={0.4}
      onEndReached={() => { if (page < totalPages) load(page + 1); }}
      ListEmptyComponent={<EmptyState label={t('No blocked users')} />}
      renderItem={({ item }) => (
        <View style={styles.userRow}>
          <AvatarImage url={item.user.profile_avatar} />
          <Pressable
            style={styles.userInfo}
            onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.user.user_name } })}>
            <Text style={styles.userName}>@{item.user.user_name}</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnDanger, busyIds.has(item.user._id) && styles.btnDisabled]}
            disabled={busyIds.has(item.user._id)}
            onPress={() => handleUnblock(item)}>
            <Text style={styles.btnDangerText}>{t('Unblock')}</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

// ─────────────────────────────── Shared ────────────────────────────────────

function AvatarImage({ url }: { url?: string | null }) {
  const styles = useStyles();
  const src = avatar(url);
  return (
    <Image
      source={{ uri: src }}
      style={styles.avatar}
      contentFit="cover"
      transition={100}
    />
  );
}

function EmptyState({ label }: { label: string }) {
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <View style={styles.empty}>
      <Ionicons name="people-outline" size={32} color={AppColors.textSecondary} />
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  headerTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabLabel: {
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    paddingBottom: 10,
  },
  tabLabelActive: {
    color: AppColors.textPrimary,
    fontWeight: '600',
  },
  tabIndicator: {
    alignSelf: 'stretch',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: {
    backgroundColor: AppColors.textPrimary,
  },
  pager: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  centeredLoader: {
    paddingVertical: 48,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  requestsSection: {
    marginBottom: 8,
  },
  subHeader: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginVertical: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.surface,
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: AppColors.textPrimary,
  },
  btnPrimaryText: {
    color: AppColors.background,
    fontSize: 12,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  btnSecondaryText: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  btnDanger: {
    backgroundColor: 'rgba(255,69,58,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.3)',
  },
  btnDangerText: {
    color: AppColors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
}));
