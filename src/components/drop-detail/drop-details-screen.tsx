import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AllowlistSheet } from '@/components/drop-detail/allowlist-sheet';
import { DropDetailSection } from '@/components/drop-detail/drop-detail-section';
import { CommentsSheet } from '@/components/feed/comments-sheet';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import { useCurrentUserId } from '@/hooks/use-current-user-id';
import {
  fetchCurrencyRates,
  fetchDropById,
  fetchDropsByCollection,
  type Currency,
  type CurrencyRates,
  type Drop,
} from '@/services/drops-api';

type Props = {
  /** Website: `/collection/:name/:id` lists every drop of a collection, `/drop/:name/:id` a single drop. */
  mode: 'collection' | 'drop';
  id: string;
};

const DEFAULT_RATES: CurrencyRates = { GBP: 1, USD: 1.27, EUR: 1.2, ETH: 0.00041 };

export function DropDetailsScreen({ mode, id }: Props) {
  const { token } = useAuth();
  const currentUserId = useCurrentUserId();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rates, setRates] = useState<CurrencyRates>(DEFAULT_RATES);
  const [currencies, setCurrencies] = useState<Record<string, Currency>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [commentsDropId, setCommentsDropId] = useState<string | null>(null);
  const [allowlistDropId, setAllowlistDropId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    const load = mode === 'collection' ? fetchDropsByCollection(id, token) : fetchDropById(id, token).then((d) => (d ? [d] : []));
    load
      .then((list) => {
        if (!active) return;
        setDrops(list);
        setCommentCounts(Object.fromEntries(list.map((d) => [d._id, d.total_comments ?? 0])));
      })
      .catch(() => active && setDrops([]))
      .finally(() => active && setIsLoading(false));
    fetchCurrencyRates().then((value) => active && setRates(value));
    return () => {
      active = false;
    };
  }, [mode, id, token]);

  const headerTitle =
    mode === 'collection' ? (drops[0]?.collections_data?.title ?? 'Collection') : (drops[0]?.title ?? '');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {headerTitle}
        </Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={AppColors.link} />
      ) : drops.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cube-outline" size={32} color={AppColors.textSecondary} />
          <Text style={styles.emptyTitle}>No drop found</Text>
          <Text style={styles.emptyText}>This item isn&apos;t available anymore.</Text>
        </View>
      ) : (
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {mode === 'collection' && drops.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbStrip}>
              {drops.map((drop) => {
                const remaining = (drop.total_editions || 0) - (drop.consumed_editions || 0);
                return (
                  <Pressable
                    key={drop._id}
                    style={({ pressed }) => [styles.thumbCard, pressed && styles.pressed]}
                    onPress={() =>
                      scrollRef.current?.scrollTo({ y: sectionOffsets.current[drop._id] ?? 0, animated: true })
                    }>
                    <Image source={{ uri: drop.images?.[0]?.original_url }} style={styles.thumbImage} contentFit="cover" />
                    <Text style={styles.thumbTitle} numberOfLines={1}>
                      {drop.title}
                    </Text>
                    <Text style={styles.thumbMeta}>
                      Total: {drop.total_editions || 0} · Remaining: {remaining}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {drops.map((drop, index) => (
            <View
              key={drop._id}
              onLayout={(event) => {
                sectionOffsets.current[drop._id] = event.nativeEvent.layout.y;
              }}>
              <DropDetailSection
                drop={drop}
                currency={currencies[drop._id] ?? 'GBP'}
                rates={rates}
                onCurrencyChange={(currency) => setCurrencies((prev) => ({ ...prev, [drop._id]: currency }))}
                commentsCount={commentCounts[drop._id] ?? 0}
                onOpenComments={(d) => setCommentsDropId(d._id)}
                onOpenAllowlist={(d) => setAllowlistDropId(d._id)}
              />
              {index < drops.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </ScrollView>
      )}

      <CommentsSheet
        target={commentsDropId ? { kind: 'drop', id: commentsDropId } : null}
        currentUserId={currentUserId}
        onClose={() => setCommentsDropId(null)}
        onCountChange={(delta) => {
          if (!commentsDropId) return;
          setCommentCounts((prev) => ({ ...prev, [commentsDropId]: Math.max(0, (prev[commentsDropId] ?? 0) + delta) }));
        }}
      />
      <AllowlistSheet dropId={allowlistDropId} onClose={() => setAllowlistDropId(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  loading: {
    paddingVertical: 60,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  content: {
    paddingBottom: 40,
  },
  thumbStrip: {
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  thumbCard: {
    width: 120,
    gap: 4,
  },
  thumbImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
  },
  thumbTitle: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  thumbMeta: {
    color: AppColors.textSecondary,
    fontSize: 10,
  },
  divider: {
    height: 2,
    marginHorizontal: 20,
    marginVertical: 28,
    borderRadius: 1,
    backgroundColor: AppColors.border,
  },
});
