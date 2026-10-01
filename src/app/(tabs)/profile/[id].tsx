import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { compactCount, postToItem, userRepostToItem, type FeedItem } from '@/components/feed/post-card';
import { PostList } from '@/components/feed/post-list';
import { CoverBanner } from '@/components/profile/cover-banner';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import { canMessageReasonText, canMessageUser } from '@/services/chat-api';
import { useCurrentUserId } from '@/hooks/use-current-user-id';
import * as feedApi from '@/services/feed-api';
import type { PublicProfile, PublicProfileStats, RelationshipStatus } from '@/services/feed-api';
import * as profileApi from '@/services/profile-api';

type Tab = 'posts' | 'reposts';
const SITE_URL = 'https://elmonx.com';

function formatMemberSince(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Website's resolveFollowButtonState. */
function followButtonLabel(status: RelationshipStatus, isPrivate: boolean): string {
  if (status === 'Pending') return 'Requested';
  if (status === 'Accepted') return 'Following';
  return isPrivate ? 'Request' : 'Follow';
}

export default function PublicProfileScreen() {
  const { id: username } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const currentUserId = useCurrentUserId();
  const { conversations } = useChat();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stats, setStats] = useState<PublicProfileStats>({});
  const [notFound, setNotFound] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [status, setStatus] = useState<RelationshipStatus>('None');
  const [block, setBlock] = useState({ is_blocked: false, is_blocked_by: false });
  const [followBusy, setFollowBusy] = useState(false);

  const [tab, setTab] = useState<Tab>('posts');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const listRequest = useRef(0);

  const isPrivate = profile?.profile_privacy === 'Private';
  const isLocked = Boolean(profile?.is_private) && status !== 'Accepted';
  const canSeePosts = Boolean(profile) && !isLocked && !block.is_blocked && !block.is_blocked_by;

  const loadList = useCallback(
    async (which: Tab, nextPage: number, userId: string) => {
      const requestId = ++listRequest.current;
      if (nextPage === 1) setIsLoadingList(true);
      else setIsLoadingMore(true);
      try {
        const batch =
          which === 'posts'
            ? (await feedApi.getUserPosts(token, userId, nextPage)).map(postToItem)
            : token
              ? (await profileApi.getUserReposts(token, userId, nextPage)).map(userRepostToItem)
              : [];
        if (requestId !== listRequest.current) return;
        setItems((prev) => (nextPage === 1 ? batch : [...prev, ...batch]));
        setPage(nextPage);
        setHasMore(batch.length === feedApi.FEED_PAGE_SIZE);
      } catch {
        // Private/blocked profiles reject the list; the header already explains why.
      } finally {
        if (requestId === listRequest.current) {
          setIsLoadingList(false);
          setIsLoadingMore(false);
        }
      }
    },
    [token]
  );

  const loadProfile = useCallback(async () => {
    if (!username) return;
    setIsLoadingProfile(true);
    try {
      const [data, statsData] = await Promise.all([
        feedApi.getPublicProfile(token, username),
        feedApi.getPublicProfileStats(token, username).catch(() => ({}) as PublicProfileStats),
      ]);
      if (!data) {
        setNotFound(true);
        return;
      }
      setProfile(data);
      setStats(statsData);
      let nextStatus: RelationshipStatus = data.relationship_status ?? 'None';
      let nextBlock = { is_blocked: false, is_blocked_by: false };
      if (token) {
        const [followStatus, blockStatus] = await Promise.all([
          feedApi.getFollowStatus(token, data._id).catch(() => nextStatus),
          feedApi.getBlockStatus(token, data._id).catch(() => nextBlock),
        ]);
        nextStatus = followStatus;
        nextBlock = blockStatus;
      }
      setStatus(nextStatus);
      setBlock(nextBlock);
      const locked = Boolean(data.is_private) && nextStatus !== 'Accepted';
      if (!locked && !nextBlock.is_blocked && !nextBlock.is_blocked_by) loadList('posts', 1, data._id);
    } catch {
      setNotFound(true);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [token, username, loadList]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadProfile();
  }, [loadProfile]);

  // Opening your own username shows the Profile tab instead.
  useEffect(() => {
    if (profile && currentUserId && profile._id === currentUserId) router.replace('/profile');
  }, [profile, currentUserId]);

  const handleFollow = async () => {
    if (!token || !profile || followBusy) return;
    setFollowBusy(true);
    try {
      if (status === 'Accepted' || status === 'Pending') {
        await feedApi.unfollowUser(token, profile._id);
        if (status === 'Accepted') {
          setStats((prev) => ({ ...prev, followers_count: Math.max(0, (prev.followers_count ?? 1) - 1) }));
        }
        setStatus('None');
        if (profile.is_private) setItems([]);
      } else {
        const next = await feedApi.followUser(token, profile._id);
        setStatus(next);
        if (next === 'Accepted') {
          setStats((prev) => ({ ...prev, followers_count: (prev.followers_count ?? 0) + 1 }));
        }
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setFollowBusy(false);
    }
  };

  /** Website: checks can-message first, then opens the existing thread or a new one. */
  const handleMessage = async () => {
    if (!token || !profile) return;
    try {
      const permission = await canMessageUser(token, profile._id);
      if (!permission.can_message) {
        Alert.alert('Cannot message', canMessageReasonText(permission.reason));
        return;
      }
    } catch {
      // If the check fails, let the send itself report the reason.
    }
    const existing = conversations.find((c) => c.participant._id === profile._id);
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: existing?.conversation_id ?? 'new',
        userId: profile._id,
        username: profile.user_name,
        avatar: profile.profile_avatar ?? '',
      },
    });
  };

  const handleBlockToggle = () => {
    if (!token || !profile) return;
    if (block.is_blocked) {
      feedApi
        .unblockUser(token, profile._id)
        .then(() => {
          setBlock((prev) => ({ ...prev, is_blocked: false }));
          loadProfile();
        })
        .catch((e) => Alert.alert('Error', e instanceof Error ? e.message : 'Unable to unblock.'));
      return;
    }
    Alert.alert(`Block @${profile.user_name}?`, "They won't be able to see your profile or posts.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await feedApi.blockUser(token, profile._id);
            setBlock((prev) => ({ ...prev, is_blocked: true }));
            setStatus('None');
            setItems([]);
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Unable to block.');
          }
        },
      },
    ]);
  };

  const handleMore = () => {
    if (!profile) return;
    Alert.alert(`@${profile.user_name}`, undefined, [
      {
        text: 'Share profile',
        onPress: () => {
          const url = `${SITE_URL}/profile/${profile.user_name}`;
          Share.share({ message: url, url });
        },
      },
      ...(token
        ? [{ text: block.is_blocked ? 'Unblock' : 'Block', style: 'destructive' as const, onPress: handleBlockToggle }]
        : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSelectTab = (next: Tab) => {
    if (next === tab || !profile) return;
    setTab(next);
    setItems([]);
    setHasMore(true);
    loadList(next, 1, profile._id);
  };

  const topBar = (
    <View style={styles.topBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        onPress={() => router.back()}
        style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
      </Pressable>
      {profile ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More options"
          hitSlop={8}
          onPress={handleMore}
          style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}>
          <Ionicons name="ellipsis-horizontal" size={18} color={AppColors.textPrimary} />
        </Pressable>
      ) : null}
    </View>
  );

  if (isLoadingProfile && !profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {topBar}
        <ActivityIndicator style={styles.loading} color={AppColors.link} />
      </SafeAreaView>
    );
  }

  if (notFound || !profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {topBar}
        <View style={styles.centerState}>
          <Ionicons name="person-outline" size={32} color={AppColors.textSecondary} />
          <Text style={styles.stateTitle}>Profile unavailable</Text>
          <Text style={styles.stateText}>This account doesn&apos;t exist or isn&apos;t available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
  const followActive = status === 'Accepted' || status === 'Pending';

  const header = (
    <View>
      <CoverBanner uri={profileApi.resolveCover(profile.cover_image)} />
      <View style={styles.info}>
        <Image source={{ uri: profileApi.resolveAvatar(profile.profile_avatar) }} style={styles.avatar} contentFit="cover" />
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.user_name}</Text>
          {isPrivate ? <Ionicons name="lock-closed" size={14} color={AppColors.textSecondary} /> : null}
        </View>
        {fullName ? <Text style={styles.fullName}>{fullName}</Text> : null}
        {profile.created_at ? (
          <Text style={styles.memberSince}>Member since {formatMemberSince(profile.created_at)}</Text>
        ) : null}
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        <View style={styles.statsRow}>
          <Stat value={compactCount(stats.posts_count)} label="Post" />
          <Stat value={compactCount(stats.followers_count)} label="Followers" />
          <Stat value={compactCount(stats.following_count)} label="Followings" />
        </View>

        {block.is_blocked ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>You blocked @{profile.user_name}.</Text>
            <Pressable onPress={handleBlockToggle} style={({ pressed }) => [styles.bannerButton, pressed && styles.pressed]}>
              <Text style={styles.bannerButtonText}>Unblock</Text>
            </Pressable>
          </View>
        ) : block.is_blocked_by ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>@{profile.user_name} has blocked you.</Text>
          </View>
        ) : token ? (
          <View style={styles.actionsRow}>
            <Pressable
              disabled={followBusy}
              onPress={handleFollow}
              style={({ pressed }) => [styles.followButton, followActive && styles.followButtonActive, pressed && styles.pressed]}>
              {followBusy ? (
                <ActivityIndicator size="small" color={followActive ? AppColors.textPrimary : AppColors.buttonPrimaryText} />
              ) : (
                <Text style={[styles.followLabel, followActive && styles.followLabelActive]}>
                  {followButtonLabel(status, isPrivate)}
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={handleMessage}
              style={({ pressed }) => [styles.followButton, styles.followButtonActive, pressed && styles.pressed]}>
              <Text style={[styles.followLabel, styles.followLabelActive]}>Message</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {canSeePosts ? (
        <View style={styles.tabs}>
          <Pressable style={styles.tab} onPress={() => handleSelectTab('posts')}>
            <View style={styles.tabContent}>
              <Ionicons name="reader-outline" size={18} color={tab === 'posts' ? AppColors.textPrimary : AppColors.textSecondary} />
              <Text style={[styles.tabLabel, tab === 'posts' && styles.tabLabelActive]}>Posts</Text>
            </View>
            <View style={[styles.tabIndicator, tab === 'posts' && styles.tabIndicatorActive]} />
          </Pressable>
          <Pressable style={styles.tab} onPress={() => handleSelectTab('reposts')}>
            <View style={styles.tabContent}>
              <Ionicons name="repeat-outline" size={20} color={tab === 'reposts' ? AppColors.textPrimary : AppColors.textSecondary} />
            </View>
            <View style={[styles.tabIndicator, tab === 'reposts' && styles.tabIndicatorActive]} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  const empty = !canSeePosts ? (
    isLocked && !block.is_blocked && !block.is_blocked_by ? (
      <View style={styles.centerState}>
        <Ionicons name="lock-closed-outline" size={28} color={AppColors.textSecondary} />
        <Text style={styles.stateTitle}>This account is private.</Text>
        <Text style={styles.stateText}>
          {status === 'Pending'
            ? 'Your follow request is pending.'
            : 'Follow this account to see their posts.'}
        </Text>
      </View>
    ) : null
  ) : isLoadingList ? (
    <ActivityIndicator style={styles.loading} color={AppColors.link} />
  ) : (
    <Text style={styles.emptyText}>{tab === 'posts' ? 'No posts yet.' : 'No reposts yet.'}</Text>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {topBar}
      <PostList
        items={canSeePosts ? items : []}
        setItems={setItems}
        currentUserId={currentUserId}
        header={header}
        empty={empty ?? undefined}
        isLoadingMore={isLoadingMore}
        onEndReached={() => {
          if (canSeePosts && !isLoadingList && !isLoadingMore && hasMore) loadList(tab, page + 1, profile._id);
        }}
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
  roundButton: {
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
  loading: {
    paddingVertical: 40,
  },
  centerState: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 40,
    paddingVertical: 48,
  },
  stateTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  stateText: {
    color: AppColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  info: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  avatar: {
    marginTop: -40,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: AppColors.background,
    backgroundColor: AppColors.surface,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  fullName: {
    color: AppColors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  memberSince: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  bio: {
    color: AppColors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
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
  },
  followButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.buttonPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonActive: {
    backgroundColor: AppColors.surface,
  },
  followLabel: {
    color: AppColors.buttonPrimaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  followLabelActive: {
    color: AppColors.textPrimary,
  },
  banner: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerText: {
    color: AppColors.textSecondary,
    fontSize: 13,
    flexShrink: 1,
  },
  bannerButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: AppColors.buttonPrimaryBg,
  },
  bannerButtonText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 12,
    fontWeight: '700',
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
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 40,
  },
});
