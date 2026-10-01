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

import { NftGridCard } from '@/components/collectibles/nft-grid-card';
import { ConnectedWalletBar, ConnectWalletPrompt } from '@/components/collectibles/wallet-connect-panel';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import * as collectiblesApi from '@/services/collectibles-api';
import { shortenAddress, type CollectibleCardData } from '@/services/collectibles-api';

type Tab = 'app' | 'web';

const VAULT_PAGE_SIZE = 10;
const H_PADDING = 20;
const COLUMN_GAP = 12;

export default function CollectiblesScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'web' ? 'web' : 'app');
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
            { key: 'app', label: 'App (Vaulted)' },
            { key: 'web', label: 'Web' },
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
      ) : (
        <WalletList search={search} cardWidth={cardWidth} />
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
