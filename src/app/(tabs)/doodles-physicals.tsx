import { Ionicons } from '@expo/vector-icons';
import { useAccount } from '@reown/appkit-react-native';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NftGridCard } from '@/components/collectibles/nft-grid-card';
import { ConnectedWalletBar, ConnectWalletPrompt } from '@/components/collectibles/wallet-connect-panel';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import * as collectiblesApi from '@/services/collectibles-api';
import type { DoodlesRedemption } from '@/services/collectibles-api';

const H_PADDING = 20;
const COLUMN_GAP = 12;
const INFO_TEXT =
  "To view your physical order status, connect the wallet used to redeem your Piet Mondrian x Doodles NFT. If you've transferred the NFT to another wallet, you still need to connect the original redemption wallet.";

export default function DoodlesPhysicalsScreen() {
  const { address, isConnected } = useAccount();

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
        <Text style={styles.headerTitle}>Doodles Physicals</Text>
        <View style={styles.backButton} />
      </View>

      {isConnected && address ? (
        <RedemptionList key={address} address={address} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.info}>{INFO_TEXT}</Text>
          <ConnectWalletPrompt
            title="Wallet Not Connected"
            subtitle="Connect the wallet you used to redeem your Piet Mondrian x Doodles."
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function RedemptionList({ address }: { address: string }) {
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const cardWidth = (width - H_PADDING * 2 - COLUMN_GAP) / 2;
  const [items, setItems] = useState<DoodlesRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      setItems(await collectiblesApi.getDoodlesRedemptions(token, address));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load your physicals.');
    } finally {
      setIsLoading(false);
    }
  }, [token, address]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  return (
    <FlatList
      data={isLoading ? [] : items}
      keyExtractor={(item) => item._id}
      numColumns={2}
      columnWrapperStyle={styles.column}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          <ConnectedWalletBar address={address} />
          <Text style={styles.info}>{INFO_TEXT}</Text>
        </>
      }
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator style={styles.loading} color={AppColors.link} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No Physicals Found</Text>
            <Text style={styles.emptySubtitle}>No physical redemptions found for this wallet.</Text>
          </View>
        )
      }
      renderItem={({ item }) => {
        const courier = item.shipping_details?.courier;
        const tracking = item.shipping_details?.tracking_number;
        const shipped = Boolean(courier || tracking);
        return (
          <NftGridCard
            width={cardWidth}
            name={item.meta_data?.[0]?.name || 'Piet Mondrian x Doodles'}
            image={item.images?.[0]?.image}
            fields={[
              { label: 'Courier', value: courier },
              { label: 'Tracking ID', value: tracking },
              {
                label: 'Status',
                custom: (
                  <View style={[styles.badge, shipped ? styles.badgeShipped : styles.badgeProduction]}>
                    <Text
                      style={[styles.badgeText, shipped ? styles.badgeTextShipped : styles.badgeTextProduction]}
                      numberOfLines={1}>
                      {shipped ? 'Shipped' : 'In Production'}
                    </Text>
                  </View>
                ),
              },
            ]}
          />
        );
      }}
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
  content: {
    paddingHorizontal: H_PADDING,
    paddingTop: 8,
  },
  info: {
    color: AppColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  listContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: 8,
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
  error: {
    color: AppColors.danger,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 32,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 6,
  },
  emptyTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeShipped: {
    backgroundColor: 'rgba(52,199,89,0.15)',
  },
  badgeProduction: {
    backgroundColor: 'rgba(245,180,0,0.15)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  badgeTextShipped: {
    color: AppColors.success,
  },
  badgeTextProduction: {
    color: AppColors.gold,
  },
});
