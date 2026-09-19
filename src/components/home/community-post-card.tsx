import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { CommunityPost } from '@/data/home-mock';

export function CommunityPostCard({ post }: { post: CommunityPost }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <PlaceholderThumb color={post.color} icon="person-outline" style={styles.avatar} iconSize={16} />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{post.name}</Text>
            {post.verified ? (
              <Ionicons name="checkmark-circle" size={14} color={AppColors.rarityRare} />
            ) : null}
          </View>
          <Text style={styles.time}>{post.timeAgo}</Text>
        </View>
      </View>

      <PlaceholderThumb color={post.color} icon="image-outline" style={styles.image} iconSize={36} />

      <Text style={styles.caption}>{post.caption}</Text>

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
          <Ionicons name="repeat-outline" size={16} color={AppColors.textSecondary} />
          <Text style={styles.engagementLabel}>{post.shareCount}</Text>
        </View>
        <Ionicons name="share-social-outline" size={16} color={AppColors.textSecondary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 13,
    fontWeight: '600',
  },
  time: {
    color: AppColors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 14,
  },
  caption: {
    color: AppColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
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
