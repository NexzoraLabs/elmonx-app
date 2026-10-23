import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useAuth } from '@/context/auth-context';
import { makeStyles, useAppColors } from '@/context/theme-context';
import * as feedApi from '@/services/feed-api';
import type { FollowListItem } from '@/services/feed-api';
import { appendUnique } from '@/services/http';
import { resolveAvatar } from '@/services/profile-api';

const PAGE_SIZE = 20;

type Props = {
  visible: boolean;
  onClose: () => void;
  kind: 'followers' | 'following';
  userId: string;
  username: string;
};

/**
 * Another user's followers / following (tap the counts on their profile). Backend gates it like the
 * profile itself: a private account's lists only go to the owner and approved followers.
 */
export function UserFollowListSheet({ visible, onClose, kind, userId, username }: Props) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { token } = useAuth();
  const { height } = useWindowDimensions();
  const [items, setItems] = useState<FollowListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const loadingMoreRef = useRef(false);

  const load = useCallback(
    async (nextPage: number) => {
      if (nextPage === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const res =
          kind === 'followers'
            ? await feedApi.getFollowers(token, userId, nextPage, PAGE_SIZE)
            : await feedApi.getFollowing(token, userId, nextPage, PAGE_SIZE);
        const rows = res.data ?? [];
        setItems((prev) => appendUnique(nextPage === 1 ? [] : prev, rows, (row) => row.user._id));
        setTotal(res.total_count ?? rows.length);
        setIsPrivate(res.is_private === true);
        setPage(nextPage);
        setFailed(false);
      } catch {
        setFailed(true);
      } finally {
        loadingMoreRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [kind, token, userId]
  );

  useEffect(() => {
    if (!visible || !userId) return;
    setItems([]);
    setTotal(0);
    setIsPrivate(false);
    setFailed(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch when the sheet opens
    load(1);
  }, [visible, userId, kind, load]);

  const hasMore = items.length < total;
  const openProfile = (name: string) => {
    onClose();
    router.push({ pathname: '/profile/[id]', params: { id: name } });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={[styles.container, { maxHeight: height * 0.65 }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{kind === 'followers' ? t('Followers') : t('Followings')}</Text>
            <Text style={styles.subtitle}>@{username}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('Close')} hitSlop={8} onPress={onClose} style={styles.close}>
            <Ionicons name="close" size={18} color={AppColors.textPrimary} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={AppColors.link} />
        ) : failed && items.length === 0 ? (
          <Text style={styles.message}>{t("Couldn't load this list.")}</Text>
        ) : isPrivate ? (
          <Text style={styles.message}>
            {t('This account is private. Follow @{{username}} to see their followers and who they follow.', { username })}
          </Text>
        ) : items.length === 0 ? (
          <Text style={styles.message}>{kind === 'followers' ? t('No followers yet.') : t('Not following anyone yet.')}</Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(row) => row.user._id}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (!loadingMoreRef.current && !loadingMore && hasMore) {
                loadingMoreRef.current = true;
                load(page + 1);
              }
            }}
            ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color={AppColors.link} /> : null}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => openProfile(item.user.user_name)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <Image
                  source={{ uri: resolveAvatar(item.user.profile_avatar_url ?? item.user.profile_avatar) }}
                  style={styles.avatar}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <Text style={styles.name} numberOfLines={1}>
                  @{item.user.user_name}
                </Text>
                {item.user.profile_privacy === 'Private' ? (
                  <Ionicons name="lock-closed" size={13} color={AppColors.textSecondary} />
                ) : null}
              </Pressable>
            )}
          />
        )}
      </View>
    </BottomSheet>
  );
}

const useStyles = makeStyles((AppColors) => ({
  container: {
    minHeight: 220,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: AppColors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    paddingVertical: 40,
  },
  message: {
    color: AppColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: 40,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.background,
  },
  name: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 12,
  },
}));
