import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ExportStatementSheet } from '@/components/wallet/export-statement-sheet';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import {
  formatWalletDate,
  getCaratBalance,
  getCaratHistory,
  transactionDirection,
  type CaratTransaction,
} from '@/services/wallet-api';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { appendUnique } from '@/services/http';

const COIN_ICON = require('../../../assets/coin_icon.webp');

export default function WalletScreen() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { token } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<CaratTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CaratTransaction | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const loadBalance = useCallback(async () => {
    if (!token) return;
    setLoadingBalance(true);
    try {
      setBalance(await getCaratBalance(token));
    } catch {
      setError(i18n.t('Failed to load wallet balance'));
    } finally {
      setLoadingBalance(false);
    }
  }, [token]);

  const loadHistory = useCallback(
    async (nextPage: number) => {
      if (!token) return;
      if (nextPage === 1) setLoadingHistory(true);
      else setLoadingMore(true);
      try {
        const result = await getCaratHistory(token, nextPage);
        setTransactions((prev) => appendUnique(nextPage === 1 ? [] : prev, result.items, (tx) => tx._id));
        setTotalCount(result.totalCount);
        setPage(nextPage);
      } catch {
        setError(i18n.t('Failed to load transaction history'));
      } finally {
        setLoadingHistory(false);
        setLoadingMore(false);
      }
    },
    [token]
  );

  const refreshAll = useCallback(async () => {
    setError(null);
    await Promise.all([loadBalance(), loadHistory(1)]);
  }, [loadBalance, loadHistory]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    refreshAll();
  }, [refreshAll]);

  const handlePullRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const hasMore = transactions.length < totalCount;
  const busy = loadingBalance || loadingHistory;

  const handleBuy = () => {
    Alert.alert(t('Buy X-Coin'), t('Buying X-Coins in the app is coming soon.'));
  };

  const listHeader = (
    <View>
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable hitSlop={6} onPress={() => setError(null)}>
            <Text style={styles.errorDismiss}>{t('Dismiss')}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.balanceCard}>
        <View style={styles.balanceTop}>
          <View>
            <Text style={styles.balanceLabel}>{t('Balance')}</Text>
            {loadingBalance && balance === null ? (
              <ActivityIndicator style={styles.balanceLoader} color={AppColors.textSecondary} />
            ) : (
              <View style={styles.balanceRow}>
                <Text style={styles.balanceValue}>{(balance ?? 0).toLocaleString()}</Text>
                <Image source={COIN_ICON} style={styles.balanceCoin} contentFit="contain" />
              </View>
            )}
          </View>
          <View style={styles.rateChip}>
            <Text style={styles.rateText}>{t('1 X-Coin = £1.00')}</Text>
          </View>
        </View>

        <View style={styles.balanceActions}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={refreshAll}
            style={({ pressed }) => [styles.refreshButton, (pressed || busy) && styles.dimmed]}>
            <Ionicons name="refresh" size={14} color={AppColors.buttonSecondaryText} />
            <Text style={styles.refreshText}>{t('Refresh')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handleBuy}
            style={({ pressed }) => [styles.buyButton, pressed && styles.dimmed]}>
            <Text style={styles.buyText}>{t('Buy X-Coin')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>{t('Transaction History')}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setExportOpen(true)}
          style={({ pressed }) => [styles.exportPill, pressed && styles.dimmed]}>
          <Ionicons name="download-outline" size={14} color={AppColors.textPrimary} />
          <Text style={styles.exportPillText}>{t('Export')}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Go back')}
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.dimmed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('My Wallet')}</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={loadingHistory ? [] : transactions}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handlePullRefresh}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (!loadingHistory && !loadingMore && hasMore) loadHistory(page + 1);
        }}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item, index }) => (
          <TransactionRow index={index} tx={item} onPress={() => setSelected(item)} />
        )}
        ListEmptyComponent={
          loadingHistory ? (
            <ActivityIndicator style={styles.listLoader} color={AppColors.link} />
          ) : (
            <Text style={styles.emptyText}>{t('No transactions found')}</Text>
          )
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={styles.footerLoader} color={AppColors.link} /> : null
        }
      />

      <TransactionDetailSheet tx={selected} onClose={() => setSelected(null)} />
      <ExportStatementSheet visible={exportOpen} onClose={() => setExportOpen(false)} />
    </SafeAreaView>
  );
}

function TransactionRow({ tx, index, onPress }: { tx: CaratTransaction; index: number; onPress: () => void }) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const direction = transactionDirection(tx);
  const isCredit = direction === 'Credit';
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.dimmed]} onPress={onPress}>
      <Text style={styles.rowIndex}>{index + 1}</Text>
      <View style={styles.rowMain}>
        <Text style={[styles.rowType, isCredit ? styles.credit : styles.debit]}>{t(direction)}</Text>
        <Text style={styles.rowDate}>{formatWalletDate(tx.created_at)}</Text>
      </View>
      <View style={styles.rowAmount}>
        <Text style={[styles.rowAmountText, isCredit ? styles.credit : styles.debit]}>
          {isCredit ? '+' : '-'}
          {Math.abs(tx.amount || 0).toLocaleString()}
        </Text>
        <Image source={COIN_ICON} style={styles.rowCoin} contentFit="contain" />
      </View>
      <Ionicons name="chevron-forward" size={16} color={AppColors.textSecondary} />
    </Pressable>
  );
}

/** Website x-coin-detail-modal: purchase (credit) vs store purchase (debit) layouts. */
function TransactionDetailSheet({ tx, onClose }: { tx: CaratTransaction | null; onClose: () => void }) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const isCredit = tx ? transactionDirection(tx) === 'Credit' : true;
  const coins = Math.abs(tx?.amount || 0).toLocaleString();
  const from = tx?.plateform || 'Elmonx';
  const itemName = tx?.meta_data?.meta_data?.name;
  const edition = tx?.meta_data?.meta_data?.tokenId;

  return (
    <BottomSheet visible={tx !== null} onClose={onClose}>
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>{t('X Coins Transaction Details')}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('Close')} hitSlop={8} onPress={onClose} style={styles.sheetClose}>
          <Ionicons name="close" size={18} color={AppColors.textPrimary} />
        </Pressable>
      </View>
      <View style={styles.detailCard}>
        <DetailRow label={t('Type')} value={isCredit ? t('X Coin Purchase') : t('Store Purchase')} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('Received X Coin')}</Text>
          <View style={styles.detailCoinRow}>
            <Image source={COIN_ICON} style={styles.rowCoin} contentFit="contain" />
            <Text style={[styles.detailValue, isCredit ? styles.credit : styles.debit]}>
              {isCredit ? '+' : '-'}
              {coins}
            </Text>
          </View>
        </View>
        <DetailRow label={t('From')} value={from} />
        {!isCredit ? (
          <>
            <DetailRow label={t('Item')} value={itemName ? titleCase(String(itemName)) : 'N/A'} />
            <DetailRow label={t('Edition')} value={edition != null ? String(edition) : 'N/A'} />
          </>
        ) : null}
        <DetailRow label={t('Time Stamps')} value={formatWalletDate(tx?.created_at)} />
        <DetailRow label={t('Transaction Id')} value={tx?.transaction_id || tx?._id || '-'} last />
      </View>
    </BottomSheet>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.detailRow, !last && styles.detailDivider]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle" selectable>
        {value}
      </Text>
    </View>
  );
}

function titleCase(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
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
  headerTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  dimmed: {
    opacity: 0.6,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  exportPillText: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,69,58,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.4)',
  },
  errorText: {
    flex: 1,
    color: AppColors.danger,
    fontSize: 13,
  },
  errorDismiss: {
    color: AppColors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  balanceCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 18,
    gap: 18,
  },
  balanceTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  balanceLabel: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
  balanceLoader: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  balanceValue: {
    color: AppColors.textPrimary,
    fontSize: 30,
    fontWeight: '700',
  },
  balanceCoin: {
    width: 26,
    height: 26,
  },
  rateChip: {
    backgroundColor: AppColors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rateText: {
    color: AppColors.textSecondary,
    fontSize: 12,
  },
  balanceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: AppColors.buttonSecondaryBorder,
  },
  refreshText: {
    color: AppColors.buttonSecondaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  buyButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.buttonPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 28,
    marginBottom: 8,
  },
  listLoader: {
    paddingVertical: 32,
  },
  footerLoader: {
    paddingVertical: 16,
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 32,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  rowIndex: {
    width: 22,
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  rowMain: {
    flex: 1,
    gap: 3,
  },
  rowType: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowDate: {
    color: AppColors.textSecondary,
    fontSize: 12,
  },
  rowAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowAmountText: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowCoin: {
    width: 16,
    height: 16,
  },
  credit: {
    color: AppColors.success,
  },
  debit: {
    color: AppColors.danger,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: {
    color: AppColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 13,
  },
  detailDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  detailLabel: {
    color: AppColors.textSecondary,
    fontSize: 13,
  },
  detailValue: {
    flexShrink: 1,
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  detailCoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
}));
