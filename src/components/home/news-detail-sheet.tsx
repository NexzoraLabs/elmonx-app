import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { AppColors } from '@/constants/app-colors';
import type { NewsItem } from '@/services/home-api';

function formatDate(iso?: string): string {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Same fields as the website's news-detail-modal. */
export function NewsDetailSheet({ item, visible, onClose }: { item: NewsItem; visible: boolean; onClose: () => void }) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{item.name}</Text>

        <View style={styles.metaBlock}>
          <MetaRow icon="time-outline" label="Created" value={formatDate(item.created_at)} />
          <MetaRow icon="refresh-outline" label="Updated" value={formatDate(item.updated_at)} />
          <MetaRow icon="chatbubbles-outline" label="Total Posts" value={String(item.cluster_posts_results?.length ?? 0)} />
          <MetaRow icon="logo-twitter" label="Source" value={item.source || '-'} />
        </View>

        <View style={styles.summaryHeader}>
          <Ionicons name="document-text-outline" size={18} color={AppColors.textPrimary} />
          <Text style={styles.summaryTitle}>Summary</Text>
        </View>
        <Text style={styles.summary}>{item.summary}</Text>
      </ScrollView>
    </BottomSheet>
  );
}

function MetaRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={14} color={AppColors.textSecondary} />
      <Text style={styles.metaLabel}>{label}:</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 560,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  metaBlock: {
    gap: 8,
    marginTop: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    color: AppColors.textSecondary,
    fontSize: 12,
  },
  metaValue: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  summaryTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  summary: {
    color: AppColors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    paddingBottom: 8,
  },
});
