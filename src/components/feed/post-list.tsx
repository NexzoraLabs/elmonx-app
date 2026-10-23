import { router } from 'expo-router';
import { useRef, useState, type Dispatch, type ReactElement, type SetStateAction } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Share, StyleSheet } from 'react-native';

import { SHARE_URL } from '@/config/env';
import { CommentsSheet } from '@/components/feed/comments-sheet';
import { isOwnItem, PostCard, type FeedItem } from '@/components/feed/post-card';
import { PostOptionsSheet, type PostOptionsTarget } from '@/components/feed/post-options-sheet';
import { useAppColors } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import type { CommentTarget } from '@/services/feed-api';
import * as profileApi from '@/services/profile-api';
import type { PostAuthor } from '@/services/profile-api';
import { useTranslation } from 'react-i18next';
import { Appear } from '@/components/motion';


type Props = {
  items: FeedItem[];
  setItems: Dispatch<SetStateAction<FeedItem[]>>;
  currentUserId: string | null;
  header?: ReactElement;
  empty?: ReactElement;
  isLoadingMore?: boolean;
  onEndReached?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Called after one of my own posts (not reposts) is deleted. */
  onOwnPostDeleted?: () => void;
};

/** Shared post list for the Feed, my Profile and public profiles: card + every post action. */
export function PostList({
  items,
  setItems,
  currentUserId,
  header,
  empty,
  isLoadingMore,
  onEndReached,
  refreshing = false,
  onRefresh,
  onOwnPostDeleted,
}: Props) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const { token } = useAuth();
  const [commentFor, setCommentFor] = useState<{ key: string; target: CommentTarget; viewPostId?: string } | null>(
    null
  );
  const [optionsFor, setOptionsFor] = useState<PostOptionsTarget | null>(null);

  const updateItem = (key: string, change: (item: FeedItem) => FeedItem) =>
    setItems((prev) => prev.map((item) => (item.key === key ? change(item) : item)));

  const showError = (e: unknown, fallback: string) =>
    Alert.alert(t('Error'), e instanceof Error ? e.message : fallback);

  // Likes are optimistic (instant heart + count), reconciled with the server's answer and rolled
  // back on failure; taps while a toggle is in flight are ignored so two toggles can't race.
  const likeBusy = useRef(new Set<string>());

  const setLiked = (key: string, liked: boolean, count: number) =>
    updateItem(key, (current) =>
      current.kind === 'post'
        ? { ...current, post: { ...current.post, is_liked: liked, likes_count: Math.max(0, count) } }
        : { ...current, isLiked: liked, likesCount: Math.max(0, count) }
    );

  const handleToggleLike = async (item: FeedItem) => {
    if (!token || likeBusy.current.has(item.key)) return;
    likeBusy.current.add(item.key);
    const wasLiked = item.kind === 'post' ? Boolean(item.post.is_liked) : item.isLiked;
    const count = item.kind === 'post' ? (item.post.likes_count ?? 0) : item.likesCount;
    setLiked(item.key, !wasLiked, count + (wasLiked ? -1 : 1));
    try {
      const res =
        item.kind === 'post'
          ? await profileApi.togglePostLike(token, item.post._id)
          : await profileApi.toggleRepostLike(token, item.repostId);
      setLiked(item.key, res.liked, res.likes_count);
    } catch (e) {
      setLiked(item.key, wasLiked, count);
      showError(e, t('Unable to update like.'));
    } finally {
      likeBusy.current.delete(item.key);
    }
  };

  const handleToggleRepost = async (item: FeedItem) => {
    if (!token || !item.post) return;
    try {
      const res = await profileApi.toggleRepost(token, item.post._id);
      if (item.kind === 'repost') {
        if (isOwnItem(item, currentUserId) && !res.reposted) {
          setItems((prev) => prev.filter((i) => i.key !== item.key));
        } else {
          updateItem(item.key, (current) =>
            current.kind === 'repost' ? { ...current, rootRepostedByMe: res.reposted } : current
          );
        }
        return;
      }
      updateItem(item.key, (current) =>
        current.kind === 'post'
          ? {
              ...current,
              repostedByMe: res.reposted,
              post: {
                ...current.post,
                reposts_count: Math.max(0, (current.post.reposts_count ?? 0) + (res.reposted ? 1 : -1)),
              },
            }
          : current
      );
    } catch (e) {
      showError(e, t('Unable to repost.'));
    }
  };

  const handleShare = (item: FeedItem) => {
    const url =
      item.kind === 'post' ? `${SHARE_URL}/post/${item.post._id}` : `${SHARE_URL}/post/repost/${item.repostId}`;
    Share.share({ message: url, url });
  };

  const handleDelete = (item: FeedItem) => {
    if (!token) return;
    const isRepost = item.kind === 'repost';
    Alert.alert(isRepost ? t('Delete repost') : t('Delete post'), t('Are you sure? This cannot be undone.'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            if (item.kind === 'post') await profileApi.deletePost(token, item.post._id);
            else await profileApi.deleteRepost(token, item.repostId);
            setItems((prev) => prev.filter((i) => i.key !== item.key));
            if (!isRepost) onOwnPostDeleted?.();
          } catch (e) {
            showError(e, t('Unable to delete.'));
          }
        },
      },
    ]);
  };

  const handleComment = (item: FeedItem) => {
    if (item.kind === 'post') {
      setCommentFor({ key: item.key, target: { kind: 'post', id: item.post._id }, viewPostId: item.post._id });
    } else {
      setCommentFor({ key: item.key, target: { kind: 'repost', id: item.repostId }, viewPostId: item.post?._id });
    }
  };

  const handleCommentCount = (delta: number) => {
    if (!commentFor) return;
    updateItem(commentFor.key, (current) =>
      current.kind === 'post'
        ? { ...current, post: { ...current.post, comments_count: Math.max(0, (current.post.comments_count ?? 0) + delta) } }
        : { ...current, commentsCount: Math.max(0, current.commentsCount + delta) }
    );
  };

  const handleMore = (item: FeedItem) => {
    const user = item.kind === 'post' ? item.post.author : item.repostedBy;
    if (!user) return;
    setOptionsFor({ user, postId: item.post?._id });
  };

  const handleBlocked = (userId: string) => {
    setItems((prev) =>
      prev.filter((item) =>
        item.kind === 'post'
          ? item.post.author?._id !== userId
          : item.repostedBy?._id !== userId && item.post?.author?._id !== userId
      )
    );
  };

  const handlePressAuthor = (author: PostAuthor) => {
    if (currentUserId && author._id === currentUserId) {
      router.navigate('/profile');
      return;
    }
    router.push({ pathname: '/profile/[id]', params: { id: author.user_name } });
  };

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={isLoadingMore ? <ActivityIndicator style={styles.footerLoading} color={AppColors.link} /> : null}
        renderItem={({ item, index }) => (
          <Appear index={index}>
          <PostCard
            item={item}
            currentUserId={currentUserId}
            onToggleLike={handleToggleLike}
            onToggleRepost={handleToggleRepost}
            onShare={handleShare}
            onComment={handleComment}
            onDelete={handleDelete}
            onMore={handleMore}
            onPressAuthor={handlePressAuthor}
          />
          </Appear>
        )}
        onEndReachedThreshold={0.4}
        onEndReached={onEndReached}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.textSecondary} />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      />
      <CommentsSheet
        target={commentFor?.target ?? null}
        viewPostId={commentFor?.viewPostId}
        currentUserId={currentUserId}
        onClose={() => setCommentFor(null)}
        onCountChange={handleCommentCount}
      />
      <PostOptionsSheet target={optionsFor} onClose={() => setOptionsFor(null)} onBlocked={handleBlocked} />
    </>
  );
}

const styles = StyleSheet.create({
  footerLoading: {
    paddingVertical: 16,
  },
});
