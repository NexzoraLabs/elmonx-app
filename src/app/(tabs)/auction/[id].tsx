import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAccount, useAppKit } from '@reown/appkit-react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import {
  fetchAuction,
  fetchAuctionState,
  placeAuctionBid,
  raiseAuctionBid,
  auctionImage,
  formatCountdown,
  editionsLabel,
  type AuctionView,
  type AuctionBid,
  type PlaceBidPayload,
} from '@/services/auction-api';
import { useTranslation } from 'react-i18next';
import i18n, { appLocale } from '@/i18n';
import { haptic } from '@/components/motion';

type BidGate = 'cancelled' | 'ended' | 'upcoming' | 'logged_out' | 'no_wallet' | 'banned' | 'unverified' | 'limit' | 'open';

type PendingBid = {
  kind: 'bid' | 'raise';
  amount: number;
  bidId?: string;
  fromAmount?: number;
};

const LIVE_POLL_MS = 5000;
const ANTI_SNIPE_POLL_MS = 2000;
const UPCOMING_POLL_MS = 15000;

function timeAgo(iso: string, now: number): string {
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return i18n.t('{{n}}s ago', { n: s });
  if (s < 3600) return i18n.t('{{n}}m ago', { n: Math.floor(s / 60) });
  if (s < 86400) return i18n.t('{{n}}h ago', { n: Math.floor(s / 3600) });
  return i18n.t('{{n}}d ago', { n: Math.floor(s / 86400) });
}

export default function AuctionDetailScreen() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, isSignedIn } = useAuth();
  const { address: walletAddress } = useAccount();
  const { open: openWallet } = useAppKit();

  const [auction, setAuction] = useState<AuctionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [selectedImage, setSelectedImage] = useState(0);
  const [amount, setAmount] = useState<string>('');
  const [pending, setPending] = useState<PendingBid | null>(null);
  const [termsChecked, setTermsChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [raisingBidId, setRaisingBidId] = useState<string | null>(null);
  const [raiseAmount, setRaiseAmount] = useState<string>('');
  const [serverDiff, setServerDiff] = useState(0);

  const lastExtCount = useRef(0);

  useEffect(() => {
    const id2 = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(id2);
  }, []);

  function applyView(view: AuctionView, prev: AuctionView | null) {
    const merged: AuctionView = { ...view, drop: view.drop ?? prev?.drop ?? null };
    if (merged.wallet_bids_left === undefined && prev?.wallet_bids_left !== undefined && walletAddress) {
      merged.wallet_bids_left = prev.wallet_bids_left;
    }
    if (view.extension_count > lastExtCount.current && lastExtCount.current > 0) {
      const mins = view.anti_snipe?.extension_minutes || 0;
      Alert.alert(t('Auction Extended'), mins === 1 ? t('Extended by 1 minute due to a late bid.') : t('Extended by {{mins}} minutes due to a late bid.', { mins }));
    }
    lastExtCount.current = view.extension_count;
    if (view.server_time) {
      setServerDiff(new Date(view.server_time).getTime() - Date.now());
    }
    setAuction(merged);
    const n = Number(amount);
    if (!amount || isNaN(n) || n < view.min_next_bid) {
      setAmount(String(view.min_next_bid));
    }
  }

  async function load() {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetchAuction(id, token, walletAddress);
      if (res.status !== 200 || !res.data) { setNotFound(true); return; }
      applyView(res.data, null);
      lastExtCount.current = res.data.extension_count;
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    if (!id || !auction) return;
    try {
      const res = await fetchAuctionState(id, token, walletAddress);
      if (res.status === 200 && res.data) applyView(res.data, auction);
    } catch { /* silent */ }
  }

  useEffect(() => {
    load(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!auction) return;
    const pollNow = clockNow + serverDiff;
    const endsInMs = new Date(auction.end_time).getTime() - pollNow;
    const startsInMs = new Date(auction.start_time).getTime() - pollNow;
    const inAntiSnipe = auction.status === 'Live' && auction.anti_snipe?.enabled && endsInMs > 0 && endsInMs <= auction.anti_snipe.window_minutes * 60000;

    const every =
      auction.status === 'Live' ? (inAntiSnipe ? ANTI_SNIPE_POLL_MS : LIVE_POLL_MS) :
      auction.status === 'Upcoming' ? UPCOMING_POLL_MS : 0;

    if (!every) return;
    const interval = setInterval(refresh, every);

    // boundary refresh when countdown hits 0
    const boundaryMs = auction.status === 'Upcoming' ? startsInMs : endsInMs;
    let boundaryTimer: ReturnType<typeof setTimeout> | null = null;
    if (boundaryMs > 0 && boundaryMs < 3600000) {
      boundaryTimer = setTimeout(() => refresh(), boundaryMs + 500);
    }

    return () => {
      clearInterval(interval);
      if (boundaryTimer) clearTimeout(boundaryTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auction?.status, auction?.end_time, auction?.anti_snipe?.enabled]);

  // derived
  const now = clockNow + serverDiff;
  const drop = auction?.drop ?? null;
  const images: string[] = (() => {
    const d = drop;
    const urls = (d?.images || []).map((img) => (img.original_url as string) || (img.url as string)).filter(Boolean);
    return urls.length ? urls : (auctionImage(d) ? [auctionImage(d)] : []);
  })();
  const endsInMs = auction ? new Date(auction.end_time).getTime() - now : 0;
  const startsInMs = auction ? new Date(auction.start_time).getTime() - now : 0;
  const countdown = auction?.status === 'Upcoming' ? formatCountdown(startsInMs)
    : auction?.status === 'Live' ? formatCountdown(endsInMs) : '';
  const inAntiSnipe = !!auction && auction.status === 'Live' && !!auction.anti_snipe?.enabled && endsInMs > 0 && endsInMs <= auction.anti_snipe.window_minutes * 60000;
  const ranked = auction?.bids ?? [];
  const removed = auction?.removed_bids ?? [];
  const [showAllBids, setShowAllBids] = useState(false);
  const visibleBids = showAllBids ? ranked : ranked.slice(0, 10);
  const myActiveBids = ranked.filter((b) => b.is_mine && b.status === 'Active');
  const userLeft = auction?.viewer?.my_bids_left ?? null;
  const walletLeft = walletAddress ? (auction?.wallet_bids_left ?? (auction?.max_bids_per_wallet ?? null)) : null;
  const bidsLeft = userLeft !== null && walletLeft !== null ? Math.min(userLeft, walletLeft) : userLeft;

  const gate: BidGate = (() => {
    if (!auction) return 'ended';
    if (auction.cancelled || auction.status === 'Cancelled') return 'cancelled';
    if (auction.status === 'Ended' || (auction.status === 'Live' && endsInMs <= 0)) return 'ended';
    if (auction.status === 'Upcoming') return 'upcoming';
    if (!isSignedIn || !auction.viewer) return 'logged_out';
    if (auction.viewer.is_banned) return 'banned';
    if (auction.strict_mode && !auction.viewer.email_verified) return 'unverified';
    if (!walletAddress) return 'no_wallet';
    if (bidsLeft === 0) return 'limit';
    return 'open';
  })();

  const canRaise = gate === 'open' || gate === 'limit';
  const amountNum = Number(amount);
  const amountError = (() => {
    if (!auction || !amount) return null;
    if (!Number.isInteger(amountNum) || amountNum < 1) return t('Bids must be whole X-coins.');
    if (amountNum < auction.min_next_bid) return t('Bid must be at least {{min}}.', { min: auction.min_next_bid });
    return null;
  })();

  const needsTerms = pending?.kind === 'bid' && !!auction?.viewer?.needs_terms;

  const totalExtensionMinutes = (() => {
    if (!auction || !auction.original_end_time || auction.extension_count <= 0) return 0;
    return Math.round((new Date(auction.end_time).getTime() - new Date(auction.original_end_time).getTime()) / 60000);
  })();

  function openBid() {
    if (gate !== 'open' || !amount || amountError) return;
    setTermsChecked(false);
    setPending({ kind: 'bid', amount: amountNum });
  }

  function startRaise(bid: AuctionBid) {
    setRaisingBidId(bid._id);
    const min = Math.max(auction?.min_next_bid ?? bid.amount + 1, bid.amount + 1);
    setRaiseAmount(String(min));
  }

  function openRaise(bid: AuctionBid) {
    const v = Number(raiseAmount);
    if (!auction || !Number.isInteger(v) || v <= bid.amount || v < auction.min_next_bid) {
      Alert.alert(t('Invalid amount'), t('New bid must be above {{amount}} and at least {{min}}.', { amount: bid.amount, min: auction?.min_next_bid }));
      return;
    }
    setPending({ kind: 'raise', amount: v, bidId: bid._id, fromAmount: bid.amount });
  }

  async function confirmPending() {
    if (!pending || submitting || !walletAddress || !token) return;
    if (needsTerms && !termsChecked) { Alert.alert(t('Terms required'), t('Please accept the terms to continue.')); return; }
    setSubmitting(true);
    try {
      let res;
      if (pending.kind === 'bid') {
        const payload: PlaceBidPayload = {
          amount: pending.amount,
          wallet_address: walletAddress,
          ...(needsTerms ? { agree_terms: true } : {}),
        };
        res = await placeAuctionBid(id!, payload, token);
      } else {
        res = await raiseAuctionBid(pending.bidId!, pending.amount, walletAddress, token);
      }
      setPending(null);
      if (res.status === 200 && res.data?.auction) {
        haptic('success');
        setRaisingBidId(null);
        applyView(res.data.auction, auction);
        Alert.alert('', pending.kind === 'bid' ? t('Bid of {{amount}} X-coins placed.', { amount: pending.amount }) : t('Bid raised to {{amount}} X-coins.', { amount: pending.amount }));
        refresh();
      } else {
        Alert.alert(t('Error'), res.message || t('Bid could not be placed.'));
        refresh();
      }
    } catch {
      Alert.alert(t('Error'), t('Bid could not be placed. Please try again.'));
      refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const howItWorks = (() => {
    const n = auction?.editions || 1;
    return [
      { icon: 'wallet-outline', title: t('Log in & connect a wallet'), text: t('Bid from your ElmonX account. Your NFT goes to the wallet you bid with.') },
      { icon: 'hammer-outline', title: t('Place your bid'), text: n === 1
        ? t("Bid in whole X-coins. Each bid must beat the leading bid by {{pct}}%. You don't pay anything unless you win.", { pct: auction?.increment_percentage ?? 0 })
        : t("Bid in whole X-coins. Once {{n}} bids are in, a new bid must beat the lowest winning bid by {{pct}}%. You don't pay anything unless you win.", { n, pct: auction?.increment_percentage ?? 0 }) },
      { icon: 'trophy-outline', title: n === 1 ? t('The highest bid wins') : t('The top {{n}} bids win', { n }), text: n === 1 ? t('The highest bid wins.') : t('The top {{n}} bids win one item each, paying the lowest winning bid.', { n }) },
      { icon: 'cube-outline', title: t('Pay & receive your NFT'), text: t('Pay within {{hours}} hours. Your NFT arrives within 24 hours.', { hours: auction?.claim_window_hours ?? 48 }) },
    ];
  })();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{drop?.title || t('Auction')}</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={AppColors.textSecondary} />
        </View>
      ) : notFound ? (
        <View style={styles.centered}>
          <Text style={styles.mutedText}>{t('Auction not found.')}</Text>
          <Pressable onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('Go back')}</Text>
          </Pressable>
        </View>
      ) : auction ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Images */}
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageScrollOuter}>
            {images.map((uri, i) => (
              <View key={i} style={styles.mainImageWrap}>
                <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" />
              </View>
            ))}
          </ScrollView>
          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
              {images.map((uri, i) => (
                <Pressable key={i} onPress={() => setSelectedImage(i)} style={[styles.thumb, i === selectedImage && styles.thumbActive]}>
                  <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                </Pressable>
              ))}
            </ScrollView>
          )}

          <View style={styles.body}>
            {/* Status badge */}
            {auction.status === 'Live' && (
              <View style={styles.statusRow}>
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.livePillText}>{t('Live')}</Text>
                </View>
                {inAntiSnipe && (
                  <View style={styles.antiSnipePill}>
                    <Text style={styles.antiSnipePillText}>{t('Anti-snipe active')}</Text>
                  </View>
                )}
              </View>
            )}
            {auction.status === 'Upcoming' && (
              <View style={styles.statusRow}>
                <View style={styles.upcomingPill}>
                  <Text style={styles.upcomingPillText}>{t('Upcoming')}</Text>
                </View>
              </View>
            )}
            {(auction.status === 'Ended' || auction.status === 'Cancelled') && (
              <View style={styles.statusRow}>
                <View style={styles.endedPill}>
                  <Text style={styles.endedPillText}>{auction.status}</Text>
                </View>
              </View>
            )}

            <Text style={styles.title}>{drop?.title}</Text>
            <Text style={styles.editions}>{editionsLabel(auction.editions)}</Text>

            {countdown ? (
              <View style={styles.countdownBox}>
                <Text style={styles.countdownLabel}>{auction.status === 'Upcoming' ? t('Starts in') : t('Ends in')}</Text>
                <Text style={styles.countdownValue}>{countdown}</Text>
                {totalExtensionMinutes > 0 && (
                  <Text style={styles.extensionNote}>{t('Extended +{{mins}}m', { mins: totalExtensionMinutes })}</Text>
                )}
              </View>
            ) : null}

            {/* Price info */}
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>{auction.total_bids > 0 ? t('Current bid') : t('Starting bid')}</Text>
                <Text style={styles.price}>{(auction.current_price ?? auction.leading_bid ?? auction.initial_price ?? 0).toLocaleString()}{' '}{t('X')}</Text>
              </View>
              <View style={styles.priceDivider} />
              <View>
                <Text style={styles.priceLabel}>{t('Min next bid')}</Text>
                <Text style={styles.price}>{(auction.min_next_bid ?? 0).toLocaleString()}{' '}{t('X')}</Text>
              </View>
              {auction.leading_bid != null && (
                <>
                  <View style={styles.priceDivider} />
                  <View>
                    <Text style={styles.priceLabel}>{t('Leading bid')}</Text>
                    <Text style={styles.price}>{auction.leading_bid.toLocaleString()}{' '}{t('X')}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Quick bid buttons */}
            {gate === 'open' && auction.quick_bids?.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickBids}>
                {auction.quick_bids.map((v) => (
                  <Pressable key={v} onPress={() => setAmount(String(v))} style={styles.quickBidBtn}>
                    <Text style={styles.quickBidText}>{v.toLocaleString()}{' '}{t('X')}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {/* Bid panel */}
            {gate === 'open' && (
              <View style={styles.bidPanel}>
                <TextInput
                  style={styles.bidInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder={t('Min {{min}}', { min: auction.min_next_bid })}
                  placeholderTextColor={AppColors.textPlaceholder}
                />
                {amountError ? <Text style={styles.amountError}>{amountError}</Text> : null}
                <Pressable
                  style={[styles.bidButton, (!amount || !!amountError) && styles.bidButtonDisabled]}
                  onPress={openBid}
                  disabled={!amount || !!amountError}>
                  <Text style={[styles.bidButtonText, (!amount || !!amountError) && styles.bidButtonTextDisabled]}>
                    {t('Place Bid')}
                  </Text>
                </Pressable>
                {bidsLeft !== null && (
                  <Text style={styles.bidsLeftText}>{bidsLeft === 1 ? t('1 bid remaining') : t('{{n}} bids remaining', { n: bidsLeft })}</Text>
                )}
              </View>
            )}

            {gate === 'logged_out' && (
              <View style={styles.gateBox}>
                <Text style={styles.gateText}>{t('Sign in to place a bid')}</Text>
                <Pressable style={styles.gateBtn} onPress={() => router.push('/(auth)/sign-in')}>
                  <Text style={styles.gateBtnText}>{t('Sign in')}</Text>
                </Pressable>
              </View>
            )}

            {gate === 'no_wallet' && (
              <View style={styles.gateBox}>
                <Text style={styles.gateText}>{t('Connect a wallet to bid')}</Text>
                <Pressable style={styles.gateBtn} onPress={() => openWallet()}>
                  <Text style={styles.gateBtnText}>{t('Connect Wallet')}</Text>
                </Pressable>
              </View>
            )}

            {gate === 'unverified' && (
              <View style={styles.gateBox}>
                <Text style={styles.gateText}>{t('Email verification required to bid in this auction.')}</Text>
              </View>
            )}

            {gate === 'banned' && (
              <View style={styles.gateBox}>
                <Text style={styles.gateText}>{t('Your account is not eligible to bid.')}</Text>
              </View>
            )}

            {gate === 'limit' && myActiveBids.length > 0 && (
              <View style={styles.gateBox}>
                <Text style={styles.gateText}>{t('Bid limit reached — you can still raise existing bids.')}</Text>
              </View>
            )}

            {gate === 'upcoming' && (
              <View style={styles.gateBox}>
                <Text style={styles.gateText}>{t('Bidding opens when the auction starts.')}</Text>
              </View>
            )}

            {gate === 'cancelled' && (
              <View style={styles.gateBox}>
                <Text style={styles.gateText}>{t('This auction has been cancelled.')}</Text>
              </View>
            )}

            {gate === 'ended' && (
              <View style={styles.gateBox}>
                <Text style={styles.gateText}>
                  {auction.clearing_price != null
                    ? t('Auction ended · sold at {{price}} X', { price: auction.clearing_price.toLocaleString(appLocale()) })
                    : t('Auction has ended.')}
                </Text>
              </View>
            )}

            {/* Bid list */}
            {ranked.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t('Bids ({{n}})', { n: auction.total_bids })}
                </Text>
                {visibleBids.map((bid) => (
                  <BidRow
                    key={bid._id}
                    bid={bid}
                    now={now}
                    canRaise={canRaise}
                    raisingBidId={raisingBidId}
                    raiseAmount={raiseAmount}
                    onRaiseAmount={setRaiseAmount}
                    walletAddress={walletAddress}
                    minNextBid={auction.min_next_bid}
                    onStartRaise={startRaise}
                    onOpenRaise={openRaise}
                    onCancelRaise={() => { setRaisingBidId(null); setRaiseAmount(''); }}
                  />
                ))}
                {ranked.length > 10 && (
                  <Pressable style={styles.showMoreBtn} onPress={() => setShowAllBids((v) => !v)}>
                    <Text style={styles.showMoreText}>
                      {showAllBids ? t('Show less') : t('Show all {{n}} bids', { n: ranked.length })}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {removed.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('Removed Bids')}</Text>
                {removed.map((bid) => (
                  <BidRow
                    key={bid._id}
                    bid={bid}
                    now={now}
                    canRaise={false}
                    raisingBidId={null}
                    raiseAmount=""
                    onRaiseAmount={() => {}}
                    walletAddress={walletAddress}
                    minNextBid={0}
                    onStartRaise={() => {}}
                    onOpenRaise={() => {}}
                    onCancelRaise={() => {}}
                  />
                ))}
              </View>
            )}

            {/* Drop description */}
            {drop?.description ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('About')}</Text>
                <Text style={styles.description}>{drop.description}</Text>
              </View>
            ) : null}

            {/* How it works */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('How it works')}</Text>
              {howItWorks.map((item, i) => (
                <View key={i} style={styles.howItem}>
                  <View style={styles.howIconWrap}>
                    <Ionicons name={item.icon as 'wallet-outline'} size={20} color={AppColors.textSecondary} />
                  </View>
                  <View style={styles.howContent}>
                    <Text style={styles.howTitle}>{item.title}</Text>
                    <Text style={styles.howText}>{item.text}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Pressable
              style={styles.termsLink}
              onPress={() => Linking.openURL('https://elmonx.com/auction-terms')}>
              <Text style={styles.termsLinkText}>{t('Auction Terms & Conditions')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : null}

      {/* Confirm modal */}
      <BottomSheet visible={!!pending} onClose={() => setPending(null)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {pending?.kind === 'bid' ? t('Confirm Bid') : t('Confirm Raise')}
            </Text>
            <Text style={styles.modalAmount}>{pending?.amount?.toLocaleString()}{' '}{t('X')}</Text>
            {pending?.kind === 'bid' && (
              <Text style={styles.modalNote}>
                {t("You won't be charged unless you win. Payment is due within {{hours}} hours of the auction ending.", { hours: auction?.claim_window_hours ?? 48 })}
              </Text>
            )}
            {pending?.kind === 'raise' && (
              <Text style={styles.modalNote}>
                {t('Raises your bid from {{from}} X to {{to}} X.', { from: pending.fromAmount?.toLocaleString(), to: pending.amount?.toLocaleString() })}
              </Text>
            )}
            {needsTerms && (
              <View style={styles.termsRow}>
                <Switch value={termsChecked} onValueChange={setTermsChecked} trackColor={{ true: AppColors.textPrimary }} />
                <Text style={styles.termsText}>{t('I agree to the auction terms')}</Text>
              </View>
            )}
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelBtn} onPress={() => setPending(null)} disabled={submitting}>
                <Text style={styles.cancelBtnText}>{t('Cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, (submitting || (needsTerms && !termsChecked)) && styles.confirmBtnDisabled]}
                onPress={confirmPending}
                disabled={submitting || (needsTerms && !termsChecked)}>
                {submitting ? (
                  <ActivityIndicator size="small" color={AppColors.buttonPrimaryText} />
                ) : (
                  <Text style={styles.confirmBtnText}>{t('Confirm')}</Text>
                )}
              </Pressable>
            </View>
          </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

type BidRowProps = {
  bid: AuctionBid;
  now: number;
  canRaise: boolean;
  raisingBidId: string | null;
  raiseAmount: string;
  onRaiseAmount: (v: string) => void;
  walletAddress: string | undefined;
  minNextBid: number;
  onStartRaise: (bid: AuctionBid) => void;
  onOpenRaise: (bid: AuctionBid) => void;
  onCancelRaise: () => void;
};

function BidRow({ bid, now, canRaise, raisingBidId, raiseAmount, onRaiseAmount, walletAddress, minNextBid, onStartRaise, onOpenRaise, onCancelRaise }: BidRowProps) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const isExpanding = raisingBidId === bid._id;
  const isMyBid = bid.is_mine;
  const isBidWallet = !!walletAddress && bid.wallet_address?.toLowerCase() === walletAddress.toLowerCase();

  return (
    <View style={[styles.bidRow, bid.is_winning && styles.bidRowWinning]}>
      <View style={styles.bidRowMain}>
        <View style={styles.bidLeft}>
          {bid.rank != null && (
            <Text style={styles.bidRank}>#{bid.rank}</Text>
          )}
          <Text style={styles.bidder}>{bid.user_name || t('Bidder')}</Text>
          {isMyBid && <View style={styles.myBadge}><Text style={styles.myBadgeText}>{t('You')}</Text></View>}
        </View>
        <View style={styles.bidRight}>
          <Text style={styles.bidAmount}>{bid.amount.toLocaleString()}{' '}{t('X')}</Text>
          <Text style={styles.bidTime}>{timeAgo(bid.bid_time, now)}</Text>
        </View>
      </View>
      {isMyBid && bid.status === 'Active' && canRaise && isBidWallet && (
        <>
          {!isExpanding ? (
            <Pressable style={styles.raiseBtn} onPress={() => onStartRaise(bid)}>
              <Text style={styles.raiseBtnText}>{t('Raise bid')}</Text>
            </Pressable>
          ) : (
            <View style={styles.raisePanel}>
              <TextInput
                style={styles.raiseInput}
                value={raiseAmount}
                onChangeText={onRaiseAmount}
                keyboardType="numeric"
                placeholder={t('Min {{min}}', { min: minNextBid })}
                placeholderTextColor={AppColors.textPlaceholder}
              />
              <View style={styles.raisePanelBtns}>
                <Pressable style={styles.cancelRaiseBtn} onPress={onCancelRaise}>
                  <Text style={styles.cancelRaiseBtnText}>{t('Cancel')}</Text>
                </Pressable>
                <Pressable style={styles.confirmRaiseBtn} onPress={() => onOpenRaise(bid)}>
                  <Text style={styles.confirmRaiseBtnText}>{t('Confirm raise')}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </>
      )}
    </View>
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
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  mutedText: {
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
  scroll: {
    paddingBottom: 48,
  },
  imageScrollOuter: {
    height: 320,
  },
  mainImageWrap: {
    width: 380,
    height: 320,
    backgroundColor: AppColors.surface,
  },
  thumbRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: AppColors.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: AppColors.textPrimary,
  },
  body: {
    padding: 20,
    gap: 16,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,67,56,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: AppColors.danger,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.danger,
  },
  livePillText: {
    color: AppColors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  antiSnipePill: {
    backgroundColor: 'rgba(245,180,0,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: AppColors.gold,
  },
  antiSnipePillText: {
    color: AppColors.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  upcomingPill: {
    backgroundColor: 'rgba(61,139,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: AppColors.link,
  },
  upcomingPillText: {
    color: AppColors.link,
    fontSize: 12,
    fontWeight: '600',
  },
  endedPill: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  endedPillText: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  editions: {
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  countdownBox: {
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 2,
  },
  countdownLabel: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countdownValue: {
    color: AppColors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  extensionNote: {
    color: AppColors.gold,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    padding: 14,
    flexWrap: 'wrap',
  },
  priceLabel: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  price: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  priceDivider: {
    width: 1,
    backgroundColor: AppColors.border,
    alignSelf: 'stretch',
  },
  quickBids: {
    gap: 8,
    paddingVertical: 4,
  },
  quickBidBtn: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  quickBidText: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  bidPanel: {
    gap: 8,
  },
  bidInput: {
    height: 50,
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  amountError: {
    color: AppColors.danger,
    fontSize: 12,
    fontWeight: '500',
  },
  bidButton: {
    height: 52,
    backgroundColor: AppColors.buttonPrimaryBg,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bidButtonDisabled: {
    backgroundColor: AppColors.buttonDisabledBg,
  },
  bidButtonText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  bidButtonTextDisabled: {
    color: AppColors.buttonDisabledText,
  },
  bidsLeftText: {
    color: AppColors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  gateBox: {
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  gateText: {
    color: AppColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  gateBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: AppColors.buttonPrimaryBg,
    borderRadius: 24,
  },
  gateBtnText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  showMoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    marginTop: 4,
  },
  showMoreText: {
    color: AppColors.link,
    fontSize: 13,
    fontWeight: '600',
  },
  description: {
    color: AppColors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  bidRow: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  bidRowWinning: {
    borderWidth: 1,
    borderColor: AppColors.gold,
  },
  bidRowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  bidRank: {
    color: AppColors.gold,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 24,
  },
  bidder: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  myBadge: {
    backgroundColor: AppColors.link,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  myBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  bidRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  bidAmount: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  bidTime: {
    color: AppColors.textSecondary,
    fontSize: 11,
  },
  raiseBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: AppColors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  raiseBtnText: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  raisePanel: {
    gap: 8,
  },
  raiseInput: {
    height: 44,
    backgroundColor: AppColors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  raisePanelBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelRaiseBtn: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  cancelRaiseBtnText: {
    color: AppColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmRaiseBtn: {
    flex: 2,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: AppColors.buttonPrimaryBg,
  },
  confirmRaiseBtnText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  howItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  howIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  howContent: {
    flex: 1,
    gap: 2,
  },
  howTitle: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  howText: {
    color: AppColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  termsLink: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  termsLinkText: {
    color: AppColors.link,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  modalBox: {
    gap: 12,
    paddingBottom: 8,
  },
  modalTitle: {
    color: AppColors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalAmount: {
    color: AppColors.gold,
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalNote: {
    color: AppColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  termsText: {
    color: AppColors.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  cancelBtnText: {
    color: AppColors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 26,
    backgroundColor: AppColors.buttonPrimaryBg,
  },
  confirmBtnDisabled: {
    backgroundColor: AppColors.buttonDisabledBg,
  },
  confirmBtnText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: '700',
  },
}));
