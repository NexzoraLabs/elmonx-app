import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { compactCount, postToItem, userRepostToItem, type FeedItem } from '@/components/feed/post-card';
import { PostList } from '@/components/feed/post-list';
import { CoverBanner } from '@/components/profile/cover-banner';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import * as profileApi from '@/services/profile-api';
import type { MyProfileHeader } from '@/services/profile-api';

type Tab = 'posts' | 'reposts';

const SITE_URL = 'https://elmonx.com';

function formatMemberSince(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function ProfileTabScreen() {
  const { token, updateUser } = useAuth();
  const [header, setHeader] = useState<MyProfileHeader | null>(null);
  const [tab, setTab] = useState<Tab>('posts');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Drops responses from a tab the user has already switched away from.
  const listRequest = useRef(0);

  const loadHeader = useCallback(async () => {
    if (!token) return null;
    try {
      const data = await profileApi.getMyProfileHeader(token);
      setHeader(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load your profile.');
      return null;
    }
  }, [token]);

  const loadList = useCallback(
    async (which: Tab, nextPage: number, userId?: string) => {
      if (!token) return;
      const requestId = ++listRequest.current;
      if (nextPage === 1) setIsLoadingList(true);
      else setIsLoadingMore(true);
      try {
        let batch: FeedItem[] = [];
        if (which === 'posts') {
          batch = (await profileApi.getMyPosts(token, nextPage)).map(postToItem);
        } else if (userId) {
          batch = (await profileApi.getUserReposts(token, userId, nextPage)).map(userRepostToItem);
        }
        if (requestId !== listRequest.current) return;
        setItems((prev) => (nextPage === 1 ? batch : [...prev, ...batch]));
        setPage(nextPage);
        setHasMore(batch.length === profileApi.POSTS_PAGE_SIZE);
      } catch (e) {
        if (requestId === listRequest.current) setError(e instanceof Error ? e.message : 'Unable to load posts.');
      } finally {
        if (requestId === listRequest.current) {
          setIsLoadingList(false);
          setIsLoadingMore(false);
        }
      }
    },
    [token]
  );

  const reloadAll = useCallback(
    async (which: Tab) => {
      setError(null);
      const data = await loadHeader();
      await loadList(which, 1, data?.userId);
    },
    [loadHeader, loadList]
  );

  // Refresh whenever the tab comes into focus (e.g. back from Personal Information).
  useFocusEffect(
    useCallback(() => {
      reloadAll(tab);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- only on focus, tab switches reload separately
    }, [reloadAll])
  );

  const handleSelectTab = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    setItems([]);
    setHasMore(true);
    loadList(next, 1, header?.userId);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await reloadAll(tab);
    setIsRefreshing(false);
  };

  const pickAndUpload = async (kind: 'avatar' | 'cover') => {
    if (!token || uploading) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to change your picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: kind === 'avatar',
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(kind);
    try {
      if (kind === 'avatar') {
        const url = await profileApi.uploadAvatar(token, asset.uri, asset.mimeType);
        setHeader((prev) => (prev ? { ...prev, avatar: url } : prev));
        await updateUser({ profile_avatar: url, profile_avatar_url: url });
      } else {
        const url = await profileApi.uploadCover(token, asset.uri, asset.mimeType);
        setHeader((prev) => (prev ? { ...prev, cover: url } : prev));
      }
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleShareProfile = () => {
    if (!header) return;
    const url = `${SITE_URL}/profile/${header.userName}`;
    Share.share({ message: url, url });
  };

  const listHeader = (
    <View>
      <CoverBanner uri={header?.cover}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change cover image"
          hitSlop={8}
          onPress={() => pickAndUpload('cover')}
          style={({ pressed }) => [styles.coverEdit, pressed && styles.pressed]}>
          {uploading === 'cover' ? (
            <ActivityIndicator size="small" color={AppColors.textPrimary} />
          ) : (
            <Ionicons name="pencil" size={14} color={AppColors.textPrimary} />
          )}
        </Pressable>
      </CoverBanner>

      <View style={styles.info}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change profile picture"
          onPress={() => pickAndUpload('avatar')}
          style={styles.avatarWrap}>
          <Image
            source={{ uri: header?.avatar ?? profileApi.DEFAULT_AVATAR_URL }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.cameraBadge}>
            {uploading === 'avatar' ? (
              <ActivityIndicator size="small" color={AppColors.textPrimary} />
            ) : (
              <Ionicons name="camera" size={11} color={AppColors.textPrimary} />
            )}
          </View>
        </Pressable>

        <Text style={styles.name}>{header?.userName ?? ''}</Text>
        {header?.createdAt ? (
          <Text style={styles.memberSince}>Member since {formatMemberSince(header.createdAt)}</Text>
        ) : null}

        <View style={styles.statsRow}>
          <Stat value={compactCount(header?.postsCount)} label="Post" />
          <Stat value={compactCount(header?.followersCount)} label="Followers" />
          <Stat value={compactCount(header?.followingCount)} label="Followings" />
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={() => router.push('/personal-info')}>
            <Text style={styles.actionLabel}>Edit Profile</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={handleShareProfile}>
            <Text style={styles.actionLabel}>Share Profile</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tabs}>
        <Pressable style={styles.tab} onPress={() => handleSelectTab('posts')}>
          <View style={styles.tabContent}>
            <Ionicons
              name="reader-outline"
              size={18}
              color={tab === 'posts' ? AppColors.textPrimary : AppColors.textSecondary}
            />
            <Text style={[styles.tabLabel, tab === 'posts' && styles.tabLabelActive]}>Posts</Text>
          </View>
          <View style={[styles.tabIndicator, tab === 'posts' && styles.tabIndicatorActive]} />
        </Pressable>
        <Pressable style={styles.tab} onPress={() => handleSelectTab('reposts')}>
          <View style={styles.tabContent}>
            <Ionicons
              name="repeat-outline"
              size={20}
              color={tab === 'reposts' ? AppColors.textPrimary : AppColors.textSecondary}
            />
          </View>
          <View style={[styles.tabIndicator, tab === 'reposts' && styles.tabIndicatorActive]} />
        </Pressable>
      </View>
    </View>
  );

  const emptyText = tab === 'posts' ? "You haven't posted anything yet." : "You haven't reposted anything yet.";

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Profile</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={8}
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.iconPill, pressed && styles.pressed]}>
          <Ionicons name="settings-outline" size={20} color={AppColors.textPrimary} />
        </Pressable>
      </View>

      <PostList
        items={items}
        setItems={setItems}
        currentUserId={header?.userId ?? null}
        header={listHeader}
        empty={
          isLoadingList ? (
            <ActivityIndicator style={styles.listLoading} color={AppColors.link} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <Text style={styles.empty}>{emptyText}</Text>
          )
        }
        isLoadingMore={isLoadingMore}
        onEndReached={() => {
          if (!isLoadingList && !isLoadingMore && hasMore) loadList(tab, page + 1, header?.userId);
        }}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        onOwnPostDeleted={() =>
          setHeader((prev) => (prev ? { ...prev, postsCount: Math.max(0, prev.postsCount - 1) } : prev))
        }
      />
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
    paddingVertical: 10,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  coverEdit: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    paddingHorizontal: 20,
  },
  avatarWrap: {
    marginTop: -40,
    width: 84,
    height: 84,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: AppColors.background,
    backgroundColor: AppColors.surface,
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: AppColors.surface,
    borderWidth: 2,
    borderColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  memberSince: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 18,
  },
  stat: {
    flex: 1,
  },
  statValue: {
    color: AppColors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
  },
  statLabel: {
    color: AppColors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
  },
  tabLabel: {
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: AppColors.textPrimary,
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
  listLoading: {
    paddingVertical: 40,
  },
  error: {
    color: AppColors.danger,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  empty: {
    color: AppColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 40,
  },
});
