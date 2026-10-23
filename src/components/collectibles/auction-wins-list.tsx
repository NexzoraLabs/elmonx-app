import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Appear, haptic, PressableScale } from '@/components/motion';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { API_BASE_URL } from '@/config/env';
import { useAuth } from '@/context/auth-context';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { appLocale } from '@/i18n';
import { rich, slots } from '@/i18n/rich';
import * as auctionApi from '@/services/auction-api';
import type { AuctionWinItem } from '@/services/auction-api';
import { shortenAddress } from '@/services/collectibles-api';
import { appendUnique } from '@/services/http';


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

/** Same rule as the website's txExplorerUrl: mainnet for the live API, Sepolia otherwise. */
function txExplorerUrl(txHash: string): string {
  const base = API_BASE_URL.includes('api.elmonx.com') ? 'https://etherscan.io' : 'https://sepolia.etherscan.io';
  return `${base}/tx/${txHash}`;
}

/** Live "time left" for a pending win; ticks on its own so the list doesn't re-render every second. */
function WinTimeLeft({ deadline, serverDiff }: { deadline: string; serverDiff: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return <>{auctionApi.formatCountdown(new Date(deadline).getTime() - (now + serverDiff))}</>;
}

/** My Collectables → Auctions tab: auctions the user won, with the website's Claim & Pay flow. */
export function AuctionWinsList() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const winStyles = useWinStyles();
  const { token } = useAuth();
  const [wins, setWins] = useState<AuctionWinItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<AuctionWinItem | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  // Win whose last claim failed for lack of X-coins (website "Top up" hint).
  const [shortOfFunds, setShortOfFunds] = useState<string | null>(null);
  // Server clock offset (website uses server_time) and a coarse clock so "Claim & Pay" disappears
  // once a deadline passes without re-rendering the list every second.
  const [serverDiff, setServerDiff] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async (p: number, mode: 'initial' | 'append' | 'silent' = 'initial') => {
    if (!token) return;
    if (mode === 'initial') setLoading(true);
    if (mode === 'append') setLoadingMore(true);
    try {
      const res = await auctionApi.getMyAuctionWins(token, p, 20);
      if (res?.status !== 200 || !res.data) {
        if (mode === 'append') Alert.alert(t('Error'), res?.message || t('Could not load your auction wins.'));
        else setError(res?.message || t('Could not load your auction wins.'));
        return;
      }
      const data = res.data;
      setError(null);
      if (data.server_time) setServerDiff(new Date(data.server_time).getTime() - Date.now());
      setNow(Date.now());
      setWins((prev) => appendUnique(mode === 'append' ? prev : [], data.items, (w) => w._id));
      setTotal(data.total);
      setPage(p);
    } catch (e) {
      const message = e instanceof Error ? e.message : t('Could not load your auction wins.');
      if (mode === 'append') Alert.alert(t('Error'), message);
      else setError(message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load(1);
  }, [load]);

  const canClaim = (win: AuctionWinItem) =>
    win.status === 'Claim_Pending' && new Date(win.claim_deadline).getTime() > now + serverDiff;

  const handleClaim = async () => {
    if (!confirming || !token || claimingId) return;
    const win = confirming;
    setClaimingId(win._id);
    setShortOfFunds(null);
    try {
      const res = await auctionApi.claimAuctionWin(token, win._id);
      setConfirming(null);
      if (res?.status === 200) {
        haptic('success');
        Alert.alert(t('Success'), t('Payment received. Your NFT will be transferred within 24 hours.'));
      } else {
        haptic('error');
        if (/insufficient/i.test(res?.message || '')) setShortOfFunds(win._id);
        Alert.alert(t('Error'), res?.message || t('Payment could not be completed.'));
      }
    } catch (e) {
      setConfirming(null);
      Alert.alert(t('Error'), e instanceof Error ? e.message : t('Payment failed. Please try again.'));
    } finally {
      setClaimingId(null);
      // Website: re-read in place after every claim attempt (status / deadline may have changed).
      load(1, 'silent');
    }
  };

  if (loading) return <ActivityIndicator style={winStyles.loader} color={AppColors.link} />;

  if (error && wins.length === 0) {
    return (
      <View style={winStyles.empty}>
        <Ionicons name="cloud-offline-outline" size={32} color={AppColors.textSecondary} />
        <Text style={winStyles.emptyTitle}>{error}</Text>
        <PressableScale pressScale="button" style={winStyles.browseBtn} onPress={() => load(1)}>
          <Text style={winStyles.browseBtnText}>{t('Try Again')}</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={wins}
        keyExtractor={(item) => item._id}
        contentContainerStyle={winStyles.list}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (!loadingMore && wins.length < total) load(page + 1, 'append');
        }}
        ListHeaderComponent={
          <Text style={winStyles.note}>
            {t('Auctions you won. Pay each win before its deadline — the NFT is sent to your wallet within 24 hours.')}
          </Text>
        }
        ListEmptyComponent={
          <View style={winStyles.empty}>
            <Ionicons name="trophy-outline" size={32} color={AppColors.textSecondary} />
            <Text style={winStyles.emptyTitle}>{t('No auction wins yet')}</Text>
            <PressableScale pressScale="button" style={winStyles.browseBtn} onPress={() => router.push('/auctions')}>
              <Text style={winStyles.browseBtnText}>{t('See Live Auctions')}</Text>
            </PressableScale>
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator style={winStyles.footerLoader} color={AppColors.link} /> : null}
        renderItem={({ item: win, index }) => {
          const img = winImage(win);
          const color = WIN_STATUS_COLOR[win.status];
          const openAuction = () => router.push({ pathname: '/auction/[id]', params: { id: win.auction_id } });
          return (
            <Appear index={index}>
              <View style={winStyles.card}>
                <PressableScale
                  pressScale="card"
                  accessibilityRole="button"
                  accessibilityLabel={win.drop?.title ?? t('Auction Item')}
                  style={winStyles.cardLeft}
                  onPress={openAuction}>
                  <View style={winStyles.thumb}>
                    {img ? (
                      <Image source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="contain" />
                    ) : (
                      <Ionicons name="image-outline" size={24} color={AppColors.textSecondary} />
                    )}
                  </View>
                </PressableScale>
                <View style={winStyles.cardBody}>
                  <Text style={winStyles.cardTitle} numberOfLines={1} onPress={openAuction}>
                    {win.drop?.title ?? t('Auction Item')}
                  </Text>
                  {win.item_name ? <Text style={winStyles.cardSub} numberOfLines={1}>{win.item_name}</Text> : null}
                  <View style={winStyles.metaRow}>
                    <View style={[winStyles.statusBadge, { backgroundColor: `${color}20` }]}>
                      <Text style={[winStyles.statusText, { color }]}>{t(WIN_STATUS_LABEL[win.status])}</Text>
                    </View>
                    <Text style={winStyles.rankText}>
                      {t('Rank {{rank}} · you bid {{amount}}', { rank: win.rank, amount: win.bid_amount.toLocaleString() })}
                    </Text>
                  </View>
                  {win.status === 'Claim_Pending' ? (
                    <Text style={winStyles.deadlineText}>
                      {t('Pay before {{date}}', {
                        date: new Date(win.claim_deadline).toLocaleString(appLocale('en-GB'), {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }),
                      })}
                      {canClaim(win) ? (
                        <>
                          {' · '}
                          <WinTimeLeft deadline={win.claim_deadline} serverDiff={serverDiff} />
                        </>
                      ) : null}
                    </Text>
                  ) : null}
                  {win.status === 'Transferred' && win.tx_hash ? (
                    <Text
                      style={winStyles.txLink}
                      accessibilityRole="link"
                      onPress={() => WebBrowser.openBrowserAsync(txExplorerUrl(win.tx_hash as string))}>
                      {t('View transfer on Etherscan')}
                    </Text>
                  ) : null}
                  {shortOfFunds === win._id ? (
                    <Text style={winStyles.fundsText}>
                      {rich(t('Not enough X-coins. {{topUp}}, then try again before the deadline.', slots('topUp')), {
                        topUp: (
                          <Text style={winStyles.fundsLink} accessibilityRole="link" onPress={() => router.push('/wallet')}>
                            {t('Top up your X-coins')}
                          </Text>
                        ),
                      })}
                    </Text>
                  ) : null}
                </View>
                <View style={winStyles.cardRight}>
                  <Text style={winStyles.price}>{win.price.toLocaleString()}</Text>
                  <Text style={winStyles.priceUnit}>{t('X-coins')}</Text>
                  {canClaim(win) ? (
                    <PressableScale
                      pressScale="button"
                      haptic="light"
                      accessibilityRole="button"
                      style={winStyles.claimBtn}
                      disabled={claimingId === win._id}
                      onPress={() => setConfirming(win)}>
                      <Text style={winStyles.claimBtnText}>{t('Claim & Pay')}</Text>
                    </PressableScale>
                  ) : null}
                </View>
              </View>
            </Appear>
          );
        }}
      />

      {confirming ? (
        <BottomSheet visible onClose={() => !claimingId && setConfirming(null)}>
          <View style={winStyles.dialog}>
            <Text style={winStyles.dialogTitle}>{t('Claim & Pay')}</Text>
            <Text style={winStyles.dialogBody}>
              {t('Pay {{amount}} X-coins for {{title}}. The X-coins are taken from your balance now, and the NFT is sent to {{wallet}} within 24 hours.', {
                amount: confirming.price.toLocaleString(),
                title: confirming.drop?.title ?? t('this win'),
                wallet: shortenAddress(confirming.wallet_address),
              })}
            </Text>
            <View style={winStyles.dialogBtns}>
              <PressableScale
                pressScale="button"
                style={winStyles.dialogBack}
                disabled={!!claimingId}
                onPress={() => setConfirming(null)}>
                <Text style={winStyles.dialogBackText}>{t('Back')}</Text>
              </PressableScale>
              <PressableScale
                pressScale="button"
                haptic="light"
                style={[winStyles.dialogPay, !!claimingId && winStyles.dialogPayBusy]}
                disabled={!!claimingId}
                onPress={handleClaim}>
                {claimingId ? (
                  <ActivityIndicator size="small" color={AppColors.background} />
                ) : (
                  <Text style={winStyles.dialogPayText}>{t('Pay Now')}</Text>
                )}
              </PressableScale>
            </View>
          </View>
        </BottomSheet>
      ) : null}
    </>
  );
}

const useWinStyles = makeStyles((AppColors) => ({
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
  txLink: { color: AppColors.link, fontSize: 11, textDecorationLine: 'underline' },
  fundsText: { color: AppColors.danger, fontSize: 11, lineHeight: 15 },
  fundsLink: { textDecorationLine: 'underline', fontWeight: '600' },
  footerLoader: { paddingVertical: 16 },
  dialogPayBusy: { opacity: 0.5 },
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
  dialog: {
    gap: 12,
    paddingBottom: 8,
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
}));
