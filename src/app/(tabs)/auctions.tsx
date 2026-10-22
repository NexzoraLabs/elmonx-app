import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { makeStyles, useAppColors } from '@/context/theme-context';
import {
  fetchAuctions,
  formatCountdown,
  auctionImage,
  type AuctionCard,
  type AuctionList,
} from '@/services/auction-api';
import { useTranslation } from 'react-i18next';
import { Appear } from '@/components/motion';

type AuctionTab = 'live' | 'upcoming' | 'ended';

const TABS: { key: AuctionTab; label: string }[] = [
  { key: 'live', label: 'Live' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ended', label: 'Past' },
];

const LIMIT = 12;

function AuctionListCard({ auction, now }: { auction: AuctionCard; now: number }) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const img = auctionImage(auction.drop);
  const isLive = auction.status === 'Live';
  const isUpcoming = auction.status === 'Upcoming';

  let timeLeft = '';
  if (isLive) timeLeft = formatCountdown(new Date(auction.end_time).getTime() - now);
  else if (isUpcoming) timeLeft = formatCountdown(new Date(auction.start_time).getTime() - now);

  const priceLabel = isUpcoming
    ? t('Starting bid')
    : auction.status === 'Ended'
    ? (auction.clearing_price != null ? t('Sold at') : t('Ended'))
    : auction.total_bids > 0
    ? t('Current bid')
    : t('Starting bid');

  const price = auction.status === 'Ended' ? auction.clearing_price : auction.current_price;

  return (
    <Pressable
      style={styles.listCard}
      onPress={() => router.push({ pathname: '/auction/[id]', params: { id: auction._id } })}>
      <View style={styles.listImageWrap}>
        {img ? (
          <Image source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: AppColors.border }]} />
        )}
        {isLive && (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText}>{t('Live')}</Text>
          </View>
        )}
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listTitle} numberOfLines={2}>{auction.drop?.title ?? '—'}</Text>
        {timeLeft ? (
          <Text style={styles.listTime}>{isLive ? t('Ends in ') : t('Starts in ')}{timeLeft}</Text>
        ) : null}
        <View style={styles.listPriceRow}>
          <Text style={styles.listPriceLabel}>{priceLabel}</Text>
          {price != null ? (
            <Text style={styles.listPrice}>{price.toLocaleString()}{' '}{t('X')}</Text>
          ) : null}
        </View>
        <Text style={styles.listEditions}>
          {auction.editions === 1 ? t('1 of 1') : t('{{n}} editions', { n: auction.editions })}
        </Text>
      </View>
    </Pressable>
  );
}

export default function AuctionsScreen() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<AuctionTab>('live');
  const [auctions, setAuctions] = useState<AuctionCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());

  const pageRef = useRef(1);
  const nextChangeAt = useRef<number | null>(null);
  const tabRef = useRef<AuctionTab>('live');

  useEffect(() => {
    const id = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  function applyTiming(data: AuctionList) {
    nextChangeAt.current = data.next_change_at ? new Date(data.next_change_at).getTime() : null;
  }

  async function fetchPage(tab: AuctionTab, page: number, append: boolean) {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(false);
    try {
      const res = await fetchAuctions({ status: tab, page, limit: LIMIT });
      if (tab !== tabRef.current) return;
      if (res.status !== 200) { setError(true); return; }
      setAuctions((prev) => append ? [...prev, ...res.data.items] : res.data.items);
      setTotal(res.data.total);
      applyTiming(res.data);
    } catch {
      setError(true);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }

  function load(tab: AuctionTab) {
    tabRef.current = tab;
    pageRef.current = 1;
    setAuctions([]);
    fetchPage(tab, 1, false);
  }

  function loadMore() {
    if (auctions.length >= total || loadingMore) return;
    pageRef.current += 1;
    fetchPage(tabRef.current, pageRef.current, true);
  }

  function selectTab(tab: AuctionTab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    load(tab);
  }

  useEffect(() => {
    load('live'); // eslint-disable-line react-hooks/set-state-in-effect
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('Auctions')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
        {TABS.map((tab) => (
          <Pressable key={tab.key} onPress={() => selectTab(tab.key)} style={[styles.tab, activeTab === tab.key && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{t(tab.label)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={AppColors.textSecondary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t('Failed to load auctions')}</Text>
          <Pressable onPress={() => load(activeTab)} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('Retry')}</Text>
          </Pressable>
        </View>
      ) : auctions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t('No')}{' '}{activeTab}{' '}{t('auctions')}</Text>
        </View>
      ) : (
        <FlatList
          data={auctions}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Appear index={index}>
              <AuctionListCard auction={item} now={clockNow} />
            </Appear>
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={AppColors.textSecondary} style={styles.moreSpinner} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((AppColors) => ({
  safe: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  tabsScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: AppColors.textPrimary,
  },
  tabText: {
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: AppColors.textPrimary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: AppColors.textSecondary,
    fontSize: 15,
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 15,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: AppColors.surface,
    borderRadius: 20,
  },
  retryText: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  listCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  listImageWrap: {
    width: 100,
    height: 100,
    backgroundColor: AppColors.border,
    flexShrink: 0,
  },
  livePill: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,67,56,0.85)',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  livePillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  listInfo: {
    flex: 1,
    padding: 10,
    gap: 3,
    justifyContent: 'center',
  },
  listTitle: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  listTime: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  listPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  listPriceLabel: {
    color: AppColors.textSecondary,
    fontSize: 11,
  },
  listPrice: {
    color: AppColors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  listEditions: {
    color: AppColors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  moreSpinner: {
    marginVertical: 16,
  },
}));
