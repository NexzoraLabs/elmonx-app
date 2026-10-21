import { Ionicons } from '@expo/vector-icons';
import { useAccount } from '@reown/appkit-react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NftGridCard } from '@/components/collectibles/nft-grid-card';
import { ConnectedWalletBar, ConnectWalletPrompt } from '@/components/collectibles/wallet-connect-panel';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import * as auctionApi from '@/services/auction-api';
import type { AuctionWinItem } from '@/services/auction-api';
import * as collectiblesApi from '@/services/collectibles-api';
import { shortenAddress, type CollectibleCardData } from '@/services/collectibles-api';

type Tab = 'app' | 'web' | 'auctions';

const VAULT_PAGE_SIZE = 10;
const H_PADDING = 20;
const COLUMN_GAP = 12;

export default function CollectiblesScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const initTab: Tab = params.tab === 'web' ? 'web' : params.tab === 'auctions' ? 'auctions' : 'app';
  const [tab, setTab] = useState<Tab>(initTab);
  const [search, setSearch] = useState('');
  const { width } = useWindowDimensions();
  const cardWidth = (width - H_PADDING * 2 - COLUMN_GAP) / 2;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>My Collectibles</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={AppColors.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search"
          placeholderTextColor={AppColors.textPlaceholder}
          autoCorrect={false}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.tabs}>
        {(
          [
            { key: 'app', label: 'Vault' },
            { key: 'web', label: 'Wallet' },
            { key: 'auctions', label: 'Auctions' },
          ] as const
        ).map((item) => {
          const active = tab === item.key;
          return (
            <Pressable key={item.key} style={styles.tab} onPress={() => setTab(item.key)}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
              <View style={[styles.tabIndicator, active && styles.tabIndicatorActive]} />
            </Pressable>
          );
        })}
      </View>

      {tab === 'app' ? (
        <VaultList search={search} cardWidth={cardWidth} />
      ) : tab === 'web' ? (
        <WalletList search={search} cardWidth={cardWidth} />
      ) : (
        <AuctionWinsList />
      )}
    </SafeAreaView>
  );
}

function VaultList({ search, cardWidth }: { search: string; cardWidth: number }) {
  const { token } = useAuth();
  const [items, setItems] = useState<CollectibleCardData[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextPage: number) => {
      if (!token) return;
      if (nextPage === 1) setIsLoading(true);
      else setIsLoadingMore(true);
      setError(null);
      try {
        const result = await collectiblesApi.getVaultNfts(token, nextPage, VAULT_PAGE_SIZE);
        const cards = result.items.map(collectiblesApi.vaultNftToCard);
        setItems((prev) => (nextPage === 1 ? cards : [...prev, ...cards]));
        setTotalCount(result.totalCount);
        setPage(nextPage);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to load your collectibles.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [token]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load(1);
  }, [load]);

  return (
    <CollectibleGrid
      items={items}
      search={search}
      cardWidth={cardWidth}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      error={error}
      onEndReached={() => {
        if (!isLoading && !isLoadingMore && items.length < totalCount) load(page + 1);
      }}
      emptyTitle="No Vault Collectibles"
      emptySubtitle="You don't have any vault collectibles yet."
    />
  );
}

function WalletList({ search, cardWidth }: { search: string; cardWidth: number }) {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return (
      <ConnectWalletPrompt
        title="Wallet Not Connected"
        subtitle="Please connect your wallet to view your web collectibles."
      />
    );
  }

  // Remount per address so a wallet switch starts from a clean list.
  return <ConnectedWalletList key={address} address={address} search={search} cardWidth={cardWidth} />;
}

function ConnectedWalletList({ address, search, cardWidth }: { address: string; search: string; cardWidth: number }) {
  const { token } = useAuth();
  const [items, setItems] = useState<CollectibleCardData[]>([]);
  const [pageKey, setPageKey] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (cursor?: string) => {
      if (!token) return;
      if (cursor) setIsLoadingMore(true);
      else setIsLoading(true);
      setError(null);
      try {
        const result = await collectiblesApi.getWalletNfts(token, address, cursor);
        setItems((prev) => {
          const offset = cursor ? prev.length : 0;
          const cards = result.items.map((nft, i) => collectiblesApi.walletNftToCard(nft, address, offset + i));
          return cursor ? [...prev, ...cards] : cards;
        });
        setPageKey(result.pageKey);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to load your wallet collectibles.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [token, address]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  return (
    <CollectibleGrid
      header={<ConnectedWalletBar address={address} />}
      items={items}
      search={search}
      cardWidth={cardWidth}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      error={error}
      onEndReached={() => {
        if (!isLoading && !isLoadingMore && pageKey) load(pageKey);
      }}
      emptyTitle="No Wallet Collectibles"
      emptySubtitle="You don't have any wallet collectibles yet."
    />
  );
}

function CollectibleGrid({
  header,
  items,
  search,
  cardWidth,
  isLoading,
  isLoadingMore,
  error,
  onEndReached,
  emptyTitle,
  emptySubtitle,
}: {
  header?: ReactElement;
  items: CollectibleCardData[];
  search: string;
  cardWidth: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  onEndReached: () => void;
  emptyTitle: string;
  emptySubtitle: string;
}) {
  const query = search.trim().toLowerCase();
  const visible = query ? items.filter((item) => item.name.toLowerCase().includes(query)) : items;

  const empty = isLoading ? (
    <ActivityIndicator style={styles.loading} color={AppColors.link} />
  ) : error ? (
    <Text style={styles.error}>{error}</Text>
  ) : (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="file-tray-outline" size={26} color={AppColors.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>{query ? 'No results' : emptyTitle}</Text>
      <Text style={styles.emptySubtitle}>{query ? `Nothing matches "${search.trim()}".` : emptySubtitle}</Text>
    </View>
  );

  return (
    <FlatList
      data={isLoading ? [] : visible}
      keyExtractor={(item) => item.key}
      numColumns={2}
      columnWrapperStyle={styles.column}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={isLoadingMore ? <ActivityIndicator style={styles.footerLoading} color={AppColors.link} /> : null}
      onEndReachedThreshold={0.4}
      onEndReached={onEndReached}
      renderItem={({ item }) => (
        <NftGridCard
          width={cardWidth}
          name={item.name}
          image={item.image}
          fields={[
            { label: 'Edition', value: item.edition },
            { label: 'Token ID', value: item.tokenId },
            { label: 'Owner Wallet', value: shortenAddress(item.ownerWallet) },
          ]}
        />
      )}
    />
  );
}

// ──────────────────────────── Auction Wins ────────────────────────────────

const WIN_STATUS_LABEL: Record<auctionApi.AuctionWinStatus, string> = {
  Claim_Pending: 'Payment Due',
  Processing: 'Processing',
  Paid: 'Transfer Pending',
  Transferred: 'Transferred',
  Transfer_Failed: 'Delivery Delayed',
  Expired: 'Expired',
};

const WIN_STATUS_COLOR: Record<auctionApi.AuctionWinStatus, string> = {
  Claim_Pending: '#F59E0B',
  Processing: '#3B82F6',
  Paid: '#3B82F6',
  Transferred: '#34D399',
  Transfer_Failed: '#F97316',
  Expired: '#6B7280',
};

function winImage(win: AuctionWinItem): string | null {
  if (win.drop?.image_url) return win.drop.image_url;
  const imgs = win.drop?.images;
  if (imgs?.length) return imgs[0].original_url ?? imgs[0].url ?? null;
  return null;
}

function AuctionWinsList() {
  const { token } = useAuth();
  const [wins, setWins] = useState<AuctionWinItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [confirming, setConfirming] = useState<AuctionWinItem | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const load = useCallback(async (p: number, append = false) => {
    if (!token) return;
    if (!append) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await auctionApi.getMyAuctionWins(token, p, 20);
      if (res?.status === 200 && res.data) {
        setWins((prev) => append ? [...prev, ...res.data!.items] : res.data!.items);
        setTotal(res.data.total);
        setPage(p);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load(1);
  }, [load]);

  const canClaim = (win: AuctionWinItem) =>
    win.status === 'Claim_Pending' && new Date(win.claim_deadline).getTime() > Date.now();

  const handleClaim = async () => {
    if (!confirming || !token || claimingId) return;
    setClaimingId(confirming._id);
    try {
      const res = await auctionApi.claimAuctionWin(token, confirming._id);
      setConfirming(null);
      if (res?.status === 200) {
        Alert.alert('Success', 'Payment received. Your NFT will be transferred within 24 hours.');
        load(1);
      } else {
        Alert.alert('Error', res?.message || 'Payment could not be completed.');
      }
    } catch {
      Alert.alert('Error', 'Payment failed. Please try again.');
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) return <ActivityIndicator style={winStyles.loader} color={AppColors.link} />;

  return (
    <>
      <FlatList
        data={wins}
        keyExtractor={(item) => item._id}
        contentContainerStyle={winStyles.list}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.4}
        onEndReached={() => { if (!loadingMore && wins.length < total) load(page + 1, true); }}
        ListHeaderComponent={
          <Text style={winStyles.note}>
            Auctions you won. Pay each win before its deadline — the NFT is sent to your wallet within 24 hours.
          </Text>
        }
        ListEmptyComponent={
          <View style={winStyles.empty}>
            <Ionicons name="trophy-outline" size={32} color={AppColors.textSecondary} />
            <Text style={winStyles.emptyTitle}>No auction wins yet</Text>
            <Pressable
              style={({ pressed }) => [winStyles.browseBtn, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/auctions')}>
              <Text style={winStyles.browseBtnText}>See Live Auctions</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ paddingVertical: 16 }} color={AppColors.link} /> : null}
        renderItem={({ item: win }) => {
          const img = winImage(win);
          const color = WIN_STATUS_COLOR[win.status];
          return (
            <View style={winStyles.card}>
              <View style={winStyles.cardLeft}>
                <View style={winStyles.thumb}>
                  {img ? (
                    <Image source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="contain" />
                  ) : (
                    <Ionicons name="image-outline" size={24} color={AppColors.textSecondary} />
                  )}
                </View>
              </View>
              <View style={winStyles.cardBody}>
                <Text style={winStyles.cardTitle} numberOfLines={1}>{win.drop?.title ?? 'Auction Item'}</Text>
                {win.item_name ? <Text style={winStyles.cardSub} numberOfLines={1}>{win.item_name}</Text> : null}
                <View style={winStyles.metaRow}>
                  <View style={[winStyles.statusBadge, { backgroundColor: `${color}20` }]}>
                    <Text style={[winStyles.statusText, { color }]}>{WIN_STATUS_LABEL[win.status]}</Text>
                  </View>
                  <Text style={winStyles.rankText}>Rank {win.rank} · Bid {win.bid_amount.toLocaleString()}</Text>
                </View>
                {win.status === 'Claim_Pending' ? (
                  <Text style={winStyles.deadlineText}>
                    Pay before {new Date(win.claim_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                ) : null}
              </View>
              <View style={winStyles.cardRight}>
                <Text style={winStyles.price}>{win.price.toLocaleString()}</Text>
                <Text style={winStyles.priceUnit}>X-coins</Text>
                {canClaim(win) ? (
                  <Pressable
                    style={({ pressed }) => [winStyles.claimBtn, pressed && { opacity: 0.8 }]}
                    onPress={() => setConfirming(win)}>
                    <Text style={winStyles.claimBtnText}>Claim & Pay</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      {confirming ? (
        <View style={winStyles.overlay}>
          <View style={winStyles.dialog}>
            <Text style={winStyles.dialogTitle}>Claim & Pay</Text>
            <Text style={winStyles.dialogBody}>
              Pay <Text style={{ fontWeight: '700' }}>{confirming.price.toLocaleString()} X-coins</Text> for {confirming.drop?.title ?? 'this win'}.{'\n'}
              The NFT will be sent to {confirming.wallet_address.slice(0, 6)}...{confirming.wallet_address.slice(-4)} within 24 hours.
            </Text>
            <View style={winStyles.dialogBtns}>
              <Pressable
                style={winStyles.dialogBack}
                disabled={!!claimingId}
                onPress={() => setConfirming(null)}>
                <Text style={winStyles.dialogBackText}>Back</Text>
              </Pressable>
              <Pressable
                style={[winStyles.dialogPay, !!claimingId && { opacity: 0.5 }]}
                disabled={!!claimingId}
                onPress={handleClaim}>
                {claimingId ? (
                  <ActivityIndicator size="small" color={AppColors.background} />
                ) : (
                  <Text style={winStyles.dialogPayText}>Pay Now</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </>
  );
}

const winStyles = StyleSheet.create({
  loader: { paddingVertical: 48 },
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, flexGrow: 1 },
  note: { color: AppColors.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 16 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTitle: { color: AppColors.textSecondary, fontSize: 14 },
  browseBtn: {
    backgroundColor: AppColors.textPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  browseBtnText: { color: AppColors.background, fontSize: 13, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 12,
  },
  cardLeft: { justifyContent: 'center' },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: AppColors.background,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '700' },
  cardSub: { color: AppColors.textSecondary, fontSize: 11 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  rankText: { color: AppColors.textSecondary, fontSize: 10 },
  deadlineText: { color: '#F59E0B', fontSize: 10, fontWeight: '500' },
  cardRight: { alignItems: 'flex-end', gap: 4, justifyContent: 'center' },
  price: { color: AppColors.textPrimary, fontSize: 16, fontWeight: '800' },
  priceUnit: { color: AppColors.textSecondary, fontSize: 10 },
  claimBtn: {
    backgroundColor: AppColors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  claimBtnText: { color: AppColors.background, fontSize: 11, fontWeight: '700' },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 100,
  },
  dialog: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 12,
  },
  dialogTitle: { color: AppColors.textPrimary, fontSize: 17, fontWeight: '700' },
  dialogBody: { color: AppColors.textSecondary, fontSize: 13, lineHeight: 20 },
  dialogBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  dialogBack: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
  },
  dialogBackText: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '600' },
  dialogPay: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: AppColors.textPrimary,
    alignItems: 'center',
  },
  dialogPayText: { color: AppColors.background, fontSize: 14, fontWeight: '700' },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PADDING,
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
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: H_PADDING,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  searchInput: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  tabs: {
    flexDirection: 'row',
    marginTop: 16,
    paddingHorizontal: H_PADDING,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabLabel: {
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    paddingBottom: 10,
  },
  tabLabelActive: {
    color: AppColors.textPrimary,
    fontWeight: '600',
  },
  tabIndicator: {
    alignSelf: 'stretch',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: {
    backgroundColor: AppColors.textPrimary,
  },
  listContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: 20,
    paddingBottom: 32,
    flexGrow: 1,
  },
  column: {
    gap: COLUMN_GAP,
    marginBottom: 20,
  },
  loading: {
    paddingVertical: 48,
  },
  footerLoading: {
    paddingVertical: 16,
  },
  error: {
    color: AppColors.danger,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 32,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
});
