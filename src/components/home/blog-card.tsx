import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';
import type { HomeBlog } from '@/services/home-api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Show 1.2 cards: full card + peek of next
const CARD_WIDTH = (SCREEN_WIDTH - 40) / 1.2;

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export function BlogCard({ blog }: { blog: HomeBlog }) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => WebBrowser.openBrowserAsync(`https://elmonx.com/articles/${blog.slug || blog.id}`)}>
      <View style={styles.imageWrap}>
        {blog.image ? (
          <Image source={{ uri: blog.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: AppColors.border }]} />
        )}
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{blog.category}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={3}>{blog.title}</Text>
        <Text style={styles.date}>{formatDate(blog.date)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageWrap: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.65,
    backgroundColor: AppColors.border,
  },
  categoryPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    color: AppColors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  info: {
    padding: 10,
    gap: 4,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  date: {
    color: AppColors.textSecondary,
    fontSize: 11,
  },
});
