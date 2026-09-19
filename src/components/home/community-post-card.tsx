import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { CommunityPost } from '@/data/home-mock';

function CaptionText({ caption }: { caption: string }) {
  const words = caption.split(' ');
  return (
    <Text style={styles.caption}>
      {words.map((word, index) => (
        <Text key={index} style={word.startsWith('#') ? styles.hashtag : undefined}>
          {word}
          {index < words.length - 1 ? ' ' : ''}
        </Text>
      ))}
    </Text>
  );
}

export function CommunityPostCard({ post }: { post: CommunityPost }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          <PlaceholderThumb color={post.color} icon="person-outline" style={styles.avatar} iconSize={16} />
          {!post.isFollowing ? (
            <View style={styles.followBadge}>
              <Ionicons name="add" size={12} color={AppColors.buttonPrimaryText} />
            </View>
          ) : null}
        </View>

        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{post.name}</Text>
            {post.verified ? (
              <Ionicons name="checkmark-circle" size={14} color={AppColors.rarityRare} />
            ) : null}
            <Text style={styles.time}>· {post.timeAgo}</Text>
          </View>
        </View>

        <Ionicons name="ellipsis-horizontal" size={18} color={AppColors.textSecondary} />
      </View>

      <CaptionText caption={post.caption} />

      {post.images.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageRow}>
          {post.images.map((color, index) => (
            <PlaceholderThumb
              key={index}
              color={color}
              icon="image-outline"
              style={styles.imageMulti}
              iconSize={32}
            />
          ))}
        </ScrollView>
      ) : (
        <PlaceholderThumb
          color={post.images[0]}
          icon="image-outline"
          style={styles.imageSingle}
          iconSize={36}
        />
      )}

      <View style={styles.engagementRow}>
        <View style={styles.engagementItem}>
          <Ionicons name="heart-outline" size={16} color={AppColors.textSecondary} />
          <Text style={styles.engagementLabel}>{post.likeCount}</Text>
        </View>
        <View style={styles.engagementItem}>
          <Ionicons name="chatbubble-outline" size={16} color={AppColors.textSecondary} />
          <Text style={styles.engagementLabel}>{post.commentCount}</Text>
        </View>
        <View style={styles.engagementItem}>
          <Ionicons name="stats-chart-outline" size={16} color={AppColors.textSecondary} />
          <Text style={styles.engagementLabel}>{post.viewCount}</Text>
        </View>
        <View style={styles.engagementItem}>
          <Ionicons name="repeat-outline" size={16} color={AppColors.textSecondary} />
          <Text style={styles.engagementLabel}>{post.repostCount}</Text>
        </View>
        <View style={styles.engagementItem}>
          <Ionicons name="paper-plane-outline" size={16} color={AppColors.textSecondary} />
          <Text style={styles.engagementLabel}>{post.shareCount}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrapper: {
    width: 40,
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  followBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: AppColors.buttonPrimaryBg,
    borderWidth: 2,
    borderColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  time: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginLeft: 2,
  },
  caption: {
    color: AppColors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },
  hashtag: {
    color: AppColors.link,
  },
  imageSingle: {
    width: '100%',
    height: 220,
    borderRadius: 14,
  },
  imageRow: {
    gap: 8,
  },
  imageMulti: {
    width: 220,
    height: 220,
    borderRadius: 14,
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
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
