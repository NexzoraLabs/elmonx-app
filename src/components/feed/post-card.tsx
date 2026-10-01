import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';
import type { FeedRow } from '@/services/feed-api';
import { resolveAvatar, type Post, type PostAuthor, type UserRepost } from '@/services/profile-api';

export type FeedItem =
  | { kind: 'post'; key: string; post: Post; repostedByMe?: boolean }
  | {
      kind: 'repost';
      key: string;
      repostId: string;
      comment?: string | null;
      createdAt: string;
      repostedBy?: PostAuthor;
      originalUnavailable?: boolean;
      post?: Post;
      likesCount: number;
      isLiked: boolean;
      commentsCount: number;
      /** Set client-side when I repost the root post from someone else's repost card. */
      rootRepostedByMe?: boolean;
    };

export function postToItem(post: Post): FeedItem {
  return { kind: 'post', key: `post-${post._id}`, post };
}

export function userRepostToItem(r: UserRepost): FeedItem {
  return {
    kind: 'repost',
    key: `repost-${r._id}`,
    repostId: r._id,
    comment: r.comment,
    createdAt: r.created_at,
    repostedBy: r.reposted_by,
    originalUnavailable: r.original_unavailable,
    post: r.post,
    likesCount: r.likes_count ?? 0,
    isLiked: Boolean(r.is_liked),
    commentsCount: r.comments_count ?? 0,
  };
}

/** Feed rows are flat: a repost row's `_id` is the root post, and `repost_id` the repost itself. */
export function feedRowToItem(row: FeedRow): FeedItem {
  if (!row.is_repost || !row.repost_id) return postToItem(row);
  return {
    kind: 'repost',
    key: `repost-${row.repost_id}`,
    repostId: row.repost_id,
    comment: row.repost_comment,
    createdAt: row.activity_date ?? row.created_at,
    repostedBy: row.reposted_by,
    originalUnavailable: row.original_unavailable,
    post: row,
    likesCount: row.likes_count ?? 0,
    isLiked: Boolean(row.is_liked),
    commentsCount: row.comments_count ?? 0,
  };
}

export function isOwnItem(item: FeedItem, currentUserId: string | null): boolean {
  if (!currentUserId) return false;
  return item.kind === 'post' ? item.post.author?._id === currentUserId : item.repostedBy?._id === currentUserId;
}

export function timeAgo(iso?: string): string {
  if (!iso) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 52) return `${weeks}w`;
  return `${Math.floor(days / 365)}y`;
}

export function compactCount(value?: number): string {
  const n = value ?? 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

type Props = {
  item: FeedItem;
  currentUserId: string | null;
  onToggleLike: (item: FeedItem) => void;
  onToggleRepost: (item: FeedItem) => void;
  onShare: (item: FeedItem) => void;
  onComment: (item: FeedItem) => void;
  onDelete: (item: FeedItem) => void;
  onMore: (item: FeedItem) => void;
  onPressAuthor: (author: PostAuthor) => void;
};

function ContentText({ content }: { content: string }) {
  const parts = content.split(/(\s+)/);
  return (
    <Text style={styles.content}>
      {parts.map((part, index) => (
        <Text key={index} style={part.startsWith('#') ? styles.hashtag : undefined}>
          {part}
        </Text>
      ))}
    </Text>
  );
}

function PostImages({ images }: { images?: string[] }) {
  if (!images || images.length === 0) return null;
  if (images.length === 1) {
    return <Image source={{ uri: images[0] }} style={styles.imageSingle} contentFit="cover" transition={150} />;
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
      {images.slice(0, 4).map((uri) => (
        <Image key={uri} source={{ uri }} style={styles.imageMulti} contentFit="cover" transition={150} />
      ))}
    </ScrollView>
  );
}

function AuthorRow({
  author,
  date,
  trailing,
  onPressAuthor,
}: {
  author?: PostAuthor;
  date?: string;
  trailing?: ReactNode;
  onPressAuthor: (author: PostAuthor) => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        style={styles.authorTouch}
        disabled={!author}
        onPress={() => author && onPressAuthor(author)}>
        <Image
          source={{ uri: resolveAvatar(author?.profile_avatar || author?.profile_avatar_url) }}
          style={styles.avatar}
          contentFit="cover"
        />
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {author?.user_name ?? 'Unknown'}
          </Text>
          {date ? <Text style={styles.time}>· {timeAgo(date)}</Text> : null}
        </View>
      </Pressable>
      {trailing}
    </View>
  );
}

export function PostCard({
  item,
  currentUserId,
  onToggleLike,
  onToggleRepost,
  onShare,
  onComment,
  onDelete,
  onMore,
  onPressAuthor,
}: Props) {
  const isRepost = item.kind === 'repost';
  const own = isOwnItem(item, currentUserId);
  const likesCount = isRepost ? item.likesCount : (item.post.likes_count ?? 0);
  const isLiked = isRepost ? item.isLiked : Boolean(item.post.is_liked);
  const commentsCount = isRepost ? item.commentsCount : (item.post.comments_count ?? 0);
  const repostedByMe = item.kind === 'repost' ? own || Boolean(item.rootRepostedByMe) : Boolean(item.repostedByMe);
  const canRepost = item.post && !(isRepost && item.originalUnavailable);

  const trailing = own ? (
    <Pressable accessibilityRole="button" accessibilityLabel="Delete" hitSlop={10} onPress={() => onDelete(item)}>
      <Ionicons name="trash-outline" size={17} color={AppColors.textSecondary} />
    </Pressable>
  ) : (
    <Pressable accessibilityRole="button" accessibilityLabel="More options" hitSlop={10} onPress={() => onMore(item)}>
      <Ionicons name="ellipsis-horizontal" size={18} color={AppColors.textSecondary} />
    </Pressable>
  );

  return (
    <View style={styles.card}>
      {item.kind === 'repost' ? (
        <>
          <View style={styles.repostLabelRow}>
            <Ionicons name="repeat-outline" size={14} color={AppColors.textSecondary} />
            <Pressable
              style={styles.flex}
              disabled={own || !item.repostedBy}
              onPress={() => item.repostedBy && onPressAuthor(item.repostedBy)}>
              <Text style={styles.repostLabel} numberOfLines={1}>
                {own ? 'You' : (item.repostedBy?.user_name ?? 'Someone')} reposted · {timeAgo(item.createdAt)}
              </Text>
            </Pressable>
            {trailing}
          </View>
          {item.comment ? <ContentText content={item.comment} /> : null}
          <View style={styles.quoteBox}>
            {item.originalUnavailable || !item.post ? (
              <Text style={styles.unavailable}>This content is no longer available.</Text>
            ) : (
              <>
                <AuthorRow author={item.post.author} date={item.post.created_at} onPressAuthor={onPressAuthor} />
                {item.post.content ? <ContentText content={item.post.content} /> : null}
                <PostImages images={item.post.images} />
              </>
            )}
          </View>
        </>
      ) : (
        <>
          <AuthorRow
            author={item.post.author}
            date={item.post.created_at}
            trailing={trailing}
            onPressAuthor={onPressAuthor}
          />
          {item.post.content ? <ContentText content={item.post.content} /> : null}
          <PostImages images={item.post.images} />
        </>
      )}

      <View style={styles.engagementRow}>
        <Pressable style={styles.engagementItem} hitSlop={6} onPress={() => onToggleLike(item)}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={18}
            color={isLiked ? AppColors.danger : AppColors.textSecondary}
          />
          <Text style={styles.engagementLabel}>{compactCount(likesCount)}</Text>
        </Pressable>
        <Pressable style={styles.engagementItem} hitSlop={6} onPress={() => onComment(item)}>
          <Ionicons name="chatbubble-outline" size={17} color={AppColors.textSecondary} />
          <Text style={styles.engagementLabel}>{compactCount(commentsCount)}</Text>
        </Pressable>
        {item.kind === 'post' ? (
          <View style={styles.engagementItem}>
            <Ionicons name="stats-chart-outline" size={16} color={AppColors.textSecondary} />
            <Text style={styles.engagementLabel}>{compactCount(item.post.views_count)}</Text>
          </View>
        ) : null}
        {canRepost ? (
          <Pressable style={styles.engagementItem} hitSlop={6} onPress={() => onToggleRepost(item)}>
            <Ionicons
              name="repeat-outline"
              size={18}
              color={repostedByMe ? AppColors.success : AppColors.textSecondary}
            />
            {item.kind === 'post' ? (
              <Text style={styles.engagementLabel}>{compactCount(item.post.reposts_count)}</Text>
            ) : null}
          </Pressable>
        ) : null}
        <Pressable style={styles.engagementItem} hitSlop={6} onPress={() => onShare(item)}>
          <Ionicons name="paper-plane-outline" size={17} color={AppColors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
  },
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  time: {
    color: AppColors.textSecondary,
    fontSize: 12,
  },
  content: {
    color: AppColors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },
  hashtag: {
    color: AppColors.link,
  },
  imageSingle: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 14,
    backgroundColor: AppColors.surface,
  },
  imageRow: {
    gap: 8,
  },
  imageMulti: {
    width: 220,
    height: 220,
    borderRadius: 14,
    backgroundColor: AppColors.surface,
  },
  repostLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  repostLabel: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  quoteBox: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  unavailable: {
    color: AppColors.textSecondary,
    fontSize: 13,
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    marginTop: 2,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  engagementLabel: {
    color: AppColors.textSecondary,
    fontSize: 12,
  },
});
