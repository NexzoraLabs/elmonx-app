import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { feedRowToItem, type FeedItem } from '@/components/feed/post-card';
import { PostList } from '@/components/feed/post-list';
import { PressableScale } from '@/components/motion';
import { useAuth } from '@/context/auth-context';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useCurrentUserId } from '@/hooks/use-current-user-id';
import * as feedApi from '@/services/feed-api';

/**
 * Website post page (`/post/:id`, `/post/repost/:id`) — where the app's own Share links point.
 * One card with every feed action (like, repost, comments, share, options, delete) via PostList.
 */
export function PostDetailScreen({ id, isRepost }: { id: string; isRepost: boolean }) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { token } = useAuth();
  const currentUserId = useCurrentUserId();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    (isRepost ? feedApi.getRepost(token, id) : feedApi.getPost(token, id))
      .then((row) => {
        if (!active) return;
        if (row) setItems([feedRowToItem(row)]);
        else setNotFound(true);
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token, id, isRepost]);

  // Deleting the post here (own post / repost, or blocking its author) leaves nothing to show.
  const isEmptyAfterLoad = !loading && !notFound && items.length === 0;
  useEffect(() => {
    if (isEmptyAfterLoad) router.back();
  }, [isEmptyAfterLoad]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Go back')}
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('Post')}</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={AppColors.link} />
      ) : notFound ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={32} color={AppColors.textSecondary} />
          <Text style={styles.emptyText}>{t('This post is no longer available.')}</Text>
          <PressableScale pressScale="button" accessibilityRole="button" style={styles.button} onPress={() => router.replace('/feed')}>
            <Text style={styles.buttonText}>{t('Go to Feed')}</Text>
          </PressableScale>
        </View>
      ) : (
        <PostList items={items} setItems={setItems} currentUserId={currentUserId} />
      )}
    </SafeAreaView>
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
  pressed: {
    opacity: 0.7,
  },
  headerTitle: {
    color: AppColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  loader: {
    paddingVertical: 48,
  },
  empty: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: AppColors.textPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  buttonText: {
    color: AppColors.background,
    fontSize: 13,
    fontWeight: '700',
  },
}));
