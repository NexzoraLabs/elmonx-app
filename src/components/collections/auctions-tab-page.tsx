import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuctionCardHome } from '@/components/home/auction-card';
import { AppColors } from '@/constants/app-colors';
import { type AuctionCard, fetchAuctions } from '@/services/auction-api';

const PAGE_SIZE = 12;
const STATUS_FILTERS = ['All', 'Live', 'Upcoming', 'Ended'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export function AuctionsTabPage() {
  const [items, setItems] = useState<AuctionCard[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>('All');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    clockRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (clockRef.current) clearInterval(clockRef.current); };
  }, []);

  const load = useCallback(async (p: number, st: StatusFilter, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const params: Parameters<typeof fetchAuctions>[0] = { page: p, limit: PAGE_SIZE };
      if (st !== 'All') params.status = st.toLowerCase() as 'live' | 'upcoming' | 'ended';
      const res = await fetchAuctions(params);
      const list = res.data;
      setItems((prev) => (append ? [...prev, ...list.items] : list.items));
      setTotal(list.total);
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load auctions.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
  useEffect(() => { load(1, status); }, [load, status]);

  const handleStatus = (s: StatusFilter) => {
    if (s === status) return;
    setStatus(s);
  };

  return (
    <View style={styles.root}>
      {/* Status filter pills */}
      <View style={styles.pillRow}>
        {STATUS_FILTERS.map((s) => (
          <Pressable
            key={s}
            style={[styles.pill, s === status && styles.pillActive]}
            onPress={() => handleStatus(s)}>
            <Text style={[styles.pillText, s === status && styles.pillTextActive]}>{s}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={AppColors.link} />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => load(1, status)}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No auctions found.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={() => { if (!loadingMore && page < totalPages) load(page + 1, status, true); }}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ paddingVertical: 16 }} color={AppColors.link} /> : null}
          renderItem={({ item }) => <AuctionCardHome auction={item} now={now} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  pillActive: {
    backgroundColor: AppColors.textPrimary,
    borderColor: AppColors.textPrimary,
  },
  pillText: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: AppColors.background,
  },
  loader: { paddingVertical: 48 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  errorText: { color: AppColors.danger, fontSize: 13, textAlign: 'center' },
  retryBtn: {
    backgroundColor: AppColors.danger,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  emptyText: { color: AppColors.textSecondary, fontSize: 14 },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  row: { gap: 12 },
});
