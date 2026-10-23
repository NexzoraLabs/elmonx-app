import { Ionicons } from '@expo/vector-icons';
import { useAccount } from '@reown/appkit-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuctionWinsList } from '@/components/collectibles/auction-wins-list';
import { NftGridCard } from '@/components/collectibles/nft-grid-card';
import { ConnectedWalletBar, ConnectWalletPrompt } from '@/components/collectibles/wallet-connect-panel';
import { CollectionsPager } from '@/components/collections/collections-pager';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import * as collectiblesApi from '@/services/collectibles-api';
import { shortenAddress, type CollectibleCardData } from '@/services/collectibles-api';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { Appear, TabIndicator } from '@/components/motion';
import { appendUnique } from '@/services/http';

type Tab = 'app' | 'web' | 'auctions';

const TABS: { key: Tab; label: string }[] = [
  { key: 'app', label: 'Vault' },
  { key: 'web', label: 'Wallet' },
  { key: 'auctions', label: 'Auctions' },
];

const VAULT_PAGE_SIZE = 10;
const H_PADDING = 20;
const COLUMN_GAP = 12;

export default function CollectiblesScreen() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const params = useLocalSearchParams<{ tab?: string }>();
  const initTab: Tab = params.tab === 'web' ? 'web' : params.tab === 'auctions' ? 'auctions' : 'app';
  const [tab, setTab] = useState<Tab>(initTab);
  const tabIndex = TABS.findIndex((item) => item.key === tab);
  const [search, setSearch] = useState('');
  const { width } = useWindowDimensions();
  const cardWidth = (width - H_PADDING * 2 - COLUMN_GAP) / 2;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Go back')}
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('My Collectibles')}</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={AppColors.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('Search')}
          placeholderTextColor={AppColors.textPlaceholder}
          autoCorrect={false}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.tabs}>
        {TABS.map((item) => {
          const active = tab === item.key;
          return (
            <Pressable key={item.key} style={styles.tab} onPress={() => setTab(item.key)}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t(item.label)}</Text>
              <TabIndicator active={active} style={[styles.tabIndicator, styles.tabIndicatorActive]} />
            </Pressable>
          );
        })}
      </View>

      {/* Swipe left/right between the tabs (same pager as the Collections screen). */}
      <CollectionsPager
        selectedIndex={tabIndex}
        onIndexChange={(index) => setTab(TABS[index]?.key ?? 'app')}
        pages={[
          { key: 'app', element: <VaultList search={search} cardWidth={cardWidth} /> },
          { key: 'web', element: <WalletList search={search} cardWidth={cardWidth} /> },
          { key: 'auctions', element: <AuctionWinsList /> },
        ]}
      />
    </SafeAreaView>
  );
}

function VaultList({ search, cardWidth }: { search: string; cardWidth: number }) {
  const { t } = useTranslation();
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
        setItems((prev) => appendUnique(nextPage === 1 ? [] : prev, cards, (card) => card.key));
        setTotalCount(result.totalCount);
        setPage(nextPage);
      } catch (e) {
        setError(e instanceof Error ? e.message : i18n.t('Unable to load your collectibles.'));
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
      emptyTitle={t('No Vault Collectibles')}
      emptySubtitle={t('You don\'t have any vault collectibles yet.')}
    />
  );
}

function WalletList({ search, cardWidth }: { search: string; cardWidth: number }) {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return (
      <ConnectWalletPrompt
        title={t('Wallet Not Connected')}
        subtitle={t('Please connect your wallet to view your web collectibles.')}
      />
    );
  }

  // Remount per address so a wallet switch starts from a clean list.
  return <ConnectedWalletList key={address} address={address} search={search} cardWidth={cardWidth} />;
}

function ConnectedWalletList({ address, search, cardWidth }: { address: string; search: string; cardWidth: number }) {
  const { t } = useTranslation();
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
          return appendUnique(cursor ? prev : [], cards, (card) => card.key);
        });
        setPageKey(result.pageKey);
      } catch (e) {
        setError(e instanceof Error ? e.message : i18n.t('Unable to load your wallet collectibles.'));
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
      emptyTitle={t('No Wallet Collectibles')}
      emptySubtitle={t('You don\'t have any wallet collectibles yet.')}
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
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
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
      <Text style={styles.emptyTitle}>{query ? t('No results') : emptyTitle}</Text>
      <Text style={styles.emptySubtitle}>{query ? t('Nothing matches "{{query}}".', { query: search.trim() }) : emptySubtitle}</Text>
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
      renderItem={({ item, index }) => (
        <Appear index={index}>
        <NftGridCard
          width={cardWidth}
          name={item.name}
          image={item.image}
          fields={[
            { label: t('Edition'), value: item.edition },
            { label: t('Token ID'), value: item.tokenId },
            { label: t('Owner Wallet'), value: shortenAddress(item.ownerWallet) },
          ]}
        />
        </Appear>
      )}
    />
  );
}

const useStyles = makeStyles((AppColors) => ({
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
}));
