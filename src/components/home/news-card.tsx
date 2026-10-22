import { useState } from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';

import { NewsDetailSheet } from '@/components/home/news-detail-sheet';
import { makeStyles } from '@/context/theme-context';
import type { NewsItem } from '@/services/home-api';
import { appLocale } from '@/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 40) / 1.2;

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(appLocale('en-GB'), { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export function NewsCard({ item }: { item: NewsItem }) {
  const styles = useStyles();
  const [detailOpen, setDetailOpen] = useState(false);
  return (
    <>
    <NewsDetailSheet item={item} visible={detailOpen} onClose={() => setDetailOpen(false)} />
    <Pressable style={styles.card} onPress={() => setDetailOpen(true)}>
      <View style={styles.header}>
        <View style={styles.sourcePill}>
          <Text style={styles.source}>{item.source || item.category}</Text>
        </View>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={styles.title} numberOfLines={3}>{item.name}</Text>
      {item.summary ? <Text style={styles.summary} numberOfLines={2}>{item.summary}</Text> : null}
    </Pressable>
    </>
  );
}

const useStyles = makeStyles((AppColors) => ({
  card: {
    width: CARD_WIDTH,
    minHeight: 160,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourcePill: {
    backgroundColor: AppColors.border,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  source: {
    color: AppColors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  date: {
    color: AppColors.textSecondary,
    fontSize: 11,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  summary: {
    color: AppColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
}));
