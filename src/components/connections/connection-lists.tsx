import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useConnectionsStyles as useStyles } from '@/components/connections/connections-styles';
import { useAppColors } from '@/context/theme-context';
import * as feedApi from '@/services/feed-api';
import type { BlockedListItem, FollowListItem, FollowRequestItem } from '@/services/feed-api';
import { appendUnique } from '@/services/http';
import { resolveAvatar } from '@/services/profile-api';

// The three Connections tabs (followers incl. requests, following, blocked).

const PAGE_SIZE = 20;

// ─────────────────────────────── Followers ─────────────────────────────────

export function FollowersList({ token, userId }: { token: string | null; userId: string }) {
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
        setFollowers((prev) => appendUnique(p === 1 ? [] : prev, data, (r) => r.user._id));
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

export function FollowingList({ token, userId }: { token: string | null; userId: string }) {
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
      setFollowing((prev) => appendUnique(p === 1 ? [] : prev, data, (r) => r.user._id));
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

export function BlockedList({ token }: { token: string | null }) {
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
      setBlocked((prev) => appendUnique(p === 1 ? [] : prev, data, (r) => r.user._id));
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
  const src = resolveAvatar(url ?? undefined);
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
