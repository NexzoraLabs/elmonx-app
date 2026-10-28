import { Ionicons } from '@expo/vector-icons';
import { useAccount, useAppKit } from '@reown/appkit-react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AuctionCountdown } from '@/components/auction/auction-countdown';
import { AuctionGallery } from '@/components/auction/auction-gallery';
import { BidRow } from '@/components/auction/bid-row';
import { HowItWorks } from '@/components/auction/how-it-works';
import { haptic, PressableScale } from '@/components/motion';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { WEB_URL } from '@/config/env';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import { makeStyles, useAppColors } from '@/context/theme-context';
import i18n, { appLocale, currentLanguage } from '@/i18n';
import { rich, slots } from '@/i18n/rich';
import {
  auctionImage,
  editionsLabel,
  fetchAuction,
  fetchAuctionState,
  placeAuctionBid,
  raiseAuctionBid,
  type AuctionBid,
  type AuctionView,
  type PlaceBidPayload,
} from '@/services/auction-api';

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
// The page's coarse clock (gate at the end time, anti-snipe pill, "12s ago"); the big countdown ticks
// on its own every second.
const CLOCK_MS = 5000;

const STATUS_LABEL: Record<AuctionView['status'], string> = {
  Upcoming: 'Upcoming',
  Live: 'Live',
  Ended: 'Ended',
  Cancelled: 'Cancelled',
};

// "29 Sep – 29 Oct 2026" + "8:00 pm BST" (phone's time zone), shown above the countdown.
function auctionSchedule(startIso: string, endIso: string): { range: string; closingTime: string } | null {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  const locale = appLocale('en-GB');
  const dayMonth = (d: Date) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const full = (d: Date) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  const range =
    start.toDateString() === end.toDateString()
      ? full(end)
      : `${start.getFullYear() === end.getFullYear() ? dayMonth(start) : full(start)} – ${full(end)}`;
  const closingTime = end.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: currentLanguage() === 'en',
    timeZoneName: 'short',
  });
  return { range, closingTime };
}

// "1 minute" / "5 minutes" for the anti-snipe rule.
function minutesLabel(n: number): string {
  return n === 1 ? i18n.t('1 minute') : i18n.t('{{n}} minutes', { n });
}

export default function AuctionDetailScreen() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, isSignedIn } = useAuth();
  const { address: walletAddress } = useAccount();
  const { open: openWallet } = useAppKit();
  const { watchAuction } = useChat();

  const [auction, setAuction] = useState<AuctionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showXcoinRate, setShowXcoinRate] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [amount, setAmount] = useState<string>('');
  const [pending, setPending] = useState<PendingBid | null>(null);
  const [termsChecked, setTermsChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [raisingBidId, setRaisingBidId] = useState<string | null>(null);
  const [raiseAmount, setRaiseAmount] = useState<string>('');
  const [serverDiff, setServerDiff] = useState(0);
  const [showAllBids, setShowAllBids] = useState(false);

  // Live values for the poller / socket handlers. Reading them from refs (not from the render that
  // created the timer) is what keeps a poll from overwriting a typed bid with a stale amount or
  // sending the wallet that was connected when the page opened.
  const auctionRef = useRef<AuctionView | null>(null);
  const amountRef = useRef('');
  const walletRef = useRef<string | undefined>(walletAddress);
  const tokenRef = useRef<string | null>(token);
  const submittingRef = useRef(false);
  const lastExtCount = useRef(0);
  const boundaryHandled = useRef<string | null>(null);

  useEffect(() => {
    amountRef.current = amount;
  }, [amount]);
  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  const applyView = useCallback((view: AuctionView) => {
    const prev = auctionRef.current;
    const merged: AuctionView = { ...view, drop: view.drop ?? prev?.drop ?? null };
    // A raise response is built without the wallet, so it has no wallet_bids_left — keep the last one.
    if (merged.wallet_bids_left === undefined && prev?.wallet_bids_left !== undefined && walletRef.current) {
      merged.wallet_bids_left = prev.wallet_bids_left;
    }
    if (view.extension_count > lastExtCount.current && lastExtCount.current > 0) {
      const mins = view.anti_snipe?.extension_minutes || 0;
      Alert.alert(
        i18n.t('Auction Extended'),
        mins === 1 ? i18n.t('Extended by 1 minute due to a late bid.') : i18n.t('Extended by {{mins}} minutes due to a late bid.', { mins })
      );
    }
    lastExtCount.current = view.extension_count;
    if (view.server_time) setServerDiff(new Date(view.server_time).getTime() - Date.now());
    auctionRef.current = merged;
    setAuction(merged);
    setClockNow(Date.now());
    const typed = Number(amountRef.current);
    if (!amountRef.current || isNaN(typed) || typed < view.min_next_bid) setAmount(String(view.min_next_bid));
  }, []);

  const refresh = useCallback(async () => {
    if (!id || !auctionRef.current) return;
    try {
      const res = await fetchAuctionState(id, tokenRef.current, walletRef.current);
      if (res.status === 200 && res.data) applyView(res.data);
    } catch {
      // Silent: the next poll tries again.
    }
  }, [id, applyView]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetchAuction(id, tokenRef.current, walletRef.current);
      if (res.status !== 200 || !res.data) {
        setNotFound(true);
        return;
      }
      lastExtCount.current = 0;
      applyView(res.data);
      lastExtCount.current = res.data.extension_count;
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id, applyView]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  // Signing in or connecting / switching a wallet changes `viewer` (terms, bids left, ban, email
  // verification) and `wallet_bids_left` — re-read with the new identity.
  useEffect(() => {
    const changed = walletRef.current !== walletAddress || tokenRef.current !== token;
    walletRef.current = walletAddress;
    tokenRef.current = token;
    if (changed) refresh();
  }, [walletAddress, token, refresh]);

  // Website polling: Live every 5 s (2 s in the anti-snipe window), Upcoming every 15 s — only while
  // this screen is focused, the app is in the foreground and no bid is being submitted. Also re-reads
  // once right after the start / end time passes.
  useFocusEffect(
    useCallback(() => {
      let tick = 0;
      const timer = setInterval(() => {
        tick += 1;
        if (tick % (CLOCK_MS / 1000) === 0) setClockNow(Date.now());
        const a = auctionRef.current;
        if (!a || submittingRef.current || AppState.currentState !== 'active') return;
        const now = Date.now();
        const endsIn = new Date(a.end_time).getTime() - now;
        const startsIn = new Date(a.start_time).getTime() - now;
        const boundary = a.status === 'Upcoming' ? `start:${a.start_time}` : `end:${a.end_time}`;
        const crossed = a.status === 'Upcoming' ? startsIn <= -500 : a.status === 'Live' && endsIn <= -500;
        if (crossed && boundaryHandled.current !== boundary) {
          boundaryHandled.current = boundary;
          setClockNow(now);
          refresh();
          return;
        }
        const inAntiSnipe =
          a.status === 'Live' && a.anti_snipe?.enabled && endsIn > 0 && endsIn <= a.anti_snipe.window_minutes * 60000;
        const every =
          a.status === 'Live' ? (inAntiSnipe ? ANTI_SNIPE_POLL_MS : LIVE_POLL_MS) : a.status === 'Upcoming' ? UPCOMING_POLL_MS : 0;
        if (every && (tick * 1000) % every === 0) refresh();
      }, 1000);
      // Coming back to this screen / the app: catch up straight away.
      refresh();
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') refresh();
      });
      return () => {
        clearInterval(timer);
        subscription.remove();
      };
    }, [refresh])
  );

  // Website: join the auction's socket room so an anti-snipe extension shows up instantly.
  useEffect(() => {
    if (!id) return;
    return watchAuction(id, (event) => {
      const a = auctionRef.current;
      if (a && new Date(event.end_time) > new Date(a.end_time)) {
        const next = { ...a, end_time: new Date(event.end_time).toISOString() };
        auctionRef.current = next;
        setAuction(next);
      }
      refresh();
    });
  }, [id, watchAuction, refresh]);

  // ---- derived ----
  const now = clockNow + serverDiff;
  const drop = auction?.drop ?? null;
  const images: string[] = (() => {
    const urls = (drop?.images || []).map((img) => img.original_url || img.url || '').filter(Boolean);
    if (urls.length) return urls;
    const fallback = auctionImage(drop);
    return fallback ? [fallback] : [];
  })();
  const endsInMs = auction ? new Date(auction.end_time).getTime() - now : 0;
  const inAntiSnipe =
    !!auction && auction.status === 'Live' && !!auction.anti_snipe?.enabled && endsInMs > 0 && endsInMs <= auction.anti_snipe.window_minutes * 60000;
  const schedule =
    auction && (auction.status === 'Upcoming' || auction.status === 'Live') ? auctionSchedule(auction.start_time, auction.end_time) : null;
  const ranked = auction?.bids ?? [];
  const removed = auction?.removed_bids ?? [];
  const visibleBids = showAllBids ? ranked : ranked.slice(0, 10);
  const myActiveBids = ranked.filter((b) => b.is_mine && b.status === 'Active');
  const userLeft = auction?.viewer?.my_bids_left ?? null;
  const walletLeft = walletAddress ? (auction?.wallet_bids_left ?? auction?.max_bids_per_wallet ?? null) : null;
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
    setRaiseAmount(String(Math.max(auction?.min_next_bid ?? bid.amount + 1, bid.amount + 1)));
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
    if (!pending || submitting || !walletAddress || !token || !id) return;
    if (needsTerms && !termsChecked) {
      Alert.alert(t('Terms required'), t('Please accept the terms to continue.'));
      return;
    }
    const current = pending;
    setSubmitting(true);
    submittingRef.current = true;
    try {
      let res;
      if (current.kind === 'bid') {
        const payload: PlaceBidPayload = {
          amount: current.amount,
          wallet_address: walletAddress,
          ...(needsTerms ? { agree_terms: true } : {}),
        };
        res = await placeAuctionBid(id, payload, token);
      } else {
        res = await raiseAuctionBid(current.bidId!, current.amount, walletAddress, token);
      }
      setPending(null);
      if (res.status === 200 && res.data?.auction) {
        haptic('success');
        setRaisingBidId(null);
        applyView(res.data.auction);
        Alert.alert(
          '',
          current.kind === 'bid'
            ? t('Bid of {{amount}} X-coins placed.', { amount: current.amount })
            : t('Bid raised to {{amount}} X-coins.', { amount: current.amount })
        );
      } else {
        haptic('error');
        Alert.alert(t('Error'), res.message || t('Bid could not be placed.'));
      }
    } catch (e) {
      haptic('error');
      Alert.alert(t('Error'), e instanceof Error ? e.message : t('Bid could not be placed. Please try again.'));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      refresh();
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('Go back')} hitSlop={8} onPress={() => router.back()} style={styles.backBtn}>
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
          <PressableScale pressScale="button" onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('Go back')}</Text>
          </PressableScale>
        </View>
      ) : auction ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <AuctionGallery images={images} />

          <View style={styles.body}>
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
                  <Text style={styles.endedPillText}>{t(STATUS_LABEL[auction.status])}</Text>
                </View>
              </View>
            )}

            <Text style={styles.title}>{drop?.title}</Text>
            <Text style={styles.editions}>{editionsLabel(auction.editions)}</Text>

            {schedule && (
              <View>
                <Text style={styles.scheduleRange}>{schedule.range}</Text>
                <Text style={styles.scheduleClosing}>
                  {rich(t('Closing at {{time}}', slots('time')), {
                    time: <Text style={styles.scheduleClosingTime}>{schedule.closingTime}</Text>,
                  })}
                </Text>
              </View>
            )}

            {auction.status === 'Upcoming' || (auction.status === 'Live' && endsInMs > 0) ? (
              <AuctionCountdown
                label={auction.status === 'Upcoming' ? t('Starts in') : t('Ends in')}
                target={new Date(auction.status === 'Upcoming' ? auction.start_time : auction.end_time).getTime()}
                serverDiff={serverDiff}
                extensionMinutes={totalExtensionMinutes}
              />
            ) : null}

            {auction.anti_snipe?.enabled && (auction.status === 'Upcoming' || (auction.status === 'Live' && endsInMs > 0 && !inAntiSnipe)) && (
              <Text style={styles.antiSnipeRule}>
                {rich(t('Any bid placed within the final {{window}} will extend the auction by an additional {{extension}}.', slots('window', 'extension')), {
                  window: <Text style={styles.antiSnipeRuleBold}>{minutesLabel(auction.anti_snipe.window_minutes)}</Text>,
                  extension: <Text style={styles.antiSnipeRuleBold}>{minutesLabel(auction.anti_snipe.extension_minutes)}</Text>,
                })}
              </Text>
            )}

            <View style={styles.priceRow}>
              <View>
                <View style={styles.priceLabelRow}>
                  <Text style={styles.priceLabel}>{auction.total_bids > 0 ? t('Current bid') : t('Starting bid')}</Text>
                  <PressableScale
                    pressScale="button"
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={t('What is an X-coin worth?')}
                    onPress={() => {
                      haptic('selection');
                      setShowXcoinRate((v) => !v);
                    }}
                  >
                    <Ionicons name="information-circle-outline" size={14} color={AppColors.textSecondary} />
                  </PressableScale>
                </View>
                <Text style={styles.price}>
                  {t('{{amount}} X', { amount: (auction.current_price ?? auction.leading_bid ?? auction.initial_price ?? 0).toLocaleString() })}
                </Text>
              </View>
              <View style={styles.priceDivider} />
              <View>
                <Text style={styles.priceLabel}>{t('Min next bid')}</Text>
                <Text style={styles.price}>{t('{{amount}} X', { amount: (auction.min_next_bid ?? 0).toLocaleString() })}</Text>
              </View>
              {auction.leading_bid != null && (
                <>
                  <View style={styles.priceDivider} />
                  <View>
                    <Text style={styles.priceLabel}>{t('Leading bid')}</Text>
                    <Text style={styles.price}>{t('{{amount}} X', { amount: auction.leading_bid.toLocaleString() })}</Text>
                  </View>
                </>
              )}
              {showXcoinRate && <Text style={styles.xcoinRate}>{t('1 X-Coin = £1.00')}</Text>}
            </View>

            {gate === 'open' && auction.quick_bids?.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickBids}>
                {auction.quick_bids.map((v) => (
                  <PressableScale
                    key={v}
                    pressScale="button"
                    accessibilityRole="button"
                    onPress={() => {
                      haptic('selection');
                      setAmount(String(v));
                    }}
                    style={styles.quickBidBtn}>
                    <Text style={styles.quickBidText}>{t('{{amount}} X', { amount: v.toLocaleString() })}</Text>
                  </PressableScale>
                ))}
              </ScrollView>
            )}

            {gate === 'open' && (
              <View style={styles.bidPanel}>
                <TextInput
                  style={styles.bidInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="number-pad"
                  accessibilityLabel={t('Bid amount')}
                  placeholder={t('Min {{min}}', { min: auction.min_next_bid })}
                  placeholderTextColor={AppColors.textPlaceholder}
                />
                {amountError ? <Text style={styles.amountError}>{amountError}</Text> : null}
                <PressableScale
                  pressScale="button"
                  haptic="light"
                  accessibilityRole="button"
                  style={[styles.bidButton, (!amount || !!amountError) && styles.bidButtonDisabled]}
                  onPress={openBid}
                  disabled={!amount || !!amountError}>
                  <Text style={[styles.bidButtonText, (!amount || !!amountError) && styles.bidButtonTextDisabled]}>{t('Place Bid')}</Text>
                </PressableScale>
                {bidsLeft !== null && (
                  <Text style={styles.bidsLeftText}>{bidsLeft === 1 ? t('1 bid remaining') : t('{{n}} bids remaining', { n: bidsLeft })}</Text>
                )}
              </View>
            )}

            {gate === 'logged_out' && (
              <View style={styles.gateBox}>
                <Text style={styles.gateText}>{t('Sign in to place a bid')}</Text>
              </View>
            )}

            {gate === 'no_wallet' && (
              <View style={styles.gateBox}>
                <Text style={styles.gateText}>
                  {t('Connect a wallet to bid')}
                  {'\n'}
                  {t('No funds are taken by connecting the wallet.')}
                </Text>
                <PressableScale pressScale="button" accessibilityRole="button" style={styles.gateBtn} onPress={() => openWallet()}>
                  <Text style={styles.gateBtnText}>{t('Connect Wallet')}</Text>
                </PressableScale>
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

            {ranked.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('Bids ({{n}})', { n: auction.total_bids })}</Text>
                {visibleBids.map((bid) => (
                  <BidRow
                    key={bid._id}
                    bid={bid}
                    now={now}
                    canRaise={canRaise}
                    isRaising={raisingBidId === bid._id}
                    raiseAmount={raiseAmount}
                    onRaiseAmount={setRaiseAmount}
                    walletAddress={walletAddress}
                    minNextBid={auction.min_next_bid}
                    onStartRaise={startRaise}
                    onOpenRaise={openRaise}
                    onCancelRaise={() => {
                      setRaisingBidId(null);
                      setRaiseAmount('');
                    }}
                  />
                ))}
                {ranked.length > 10 && (
                  <Pressable accessibilityRole="button" style={styles.showMoreBtn} onPress={() => setShowAllBids((v) => !v)}>
                    <Text style={styles.showMoreText}>{showAllBids ? t('Show less') : t('Show all {{n}} bids', { n: ranked.length })}</Text>
                  </Pressable>
                )}
              </View>
            )}

            {removed.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('Removed Bids')}</Text>
                {removed.map((bid) => (
                  <BidRow key={bid._id} bid={bid} now={now} walletAddress={walletAddress} />
                ))}
              </View>
            )}

            {drop?.description ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('About')}</Text>
                <Text style={styles.description}>{drop.description}</Text>
              </View>
            ) : null}

            <HowItWorks auction={auction} />

            <Pressable
              accessibilityRole="link"
              style={styles.termsLink}
              onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/auction-terms`)}>
              <Text style={styles.termsLinkText}>{t('Auction Terms & Conditions')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : null}

      <BottomSheet visible={!!pending} onClose={() => !submitting && setPending(null)}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{pending?.kind === 'bid' ? t('Confirm Bid') : t('Confirm Raise')}</Text>
          <Text style={styles.modalAmount}>{t('{{amount}} X', { amount: pending?.amount?.toLocaleString() ?? '' })}</Text>
          {pending?.kind === 'bid' && (
            <Text style={styles.modalNote}>
              {t("You won't be charged unless you win. Payment is due within {{hours}} hours of the auction ending.", {
                hours: auction?.claim_window_hours ?? 48,
              })}
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
            <Pressable accessibilityRole="button" style={styles.cancelBtn} onPress={() => setPending(null)} disabled={submitting}>
              <Text style={styles.cancelBtnText}>{t('Cancel')}</Text>
            </Pressable>
            <PressableScale
              pressScale="button"
              haptic="light"
              accessibilityRole="button"
              style={[styles.confirmBtn, (submitting || (needsTerms && !termsChecked)) && styles.confirmBtnDisabled]}
              onPress={confirmPending}
              disabled={submitting || (needsTerms && !termsChecked)}>
              {submitting ? (
                <ActivityIndicator size="small" color={AppColors.buttonPrimaryText} />
              ) : (
                <Text style={styles.confirmBtnText}>{t('Confirm')}</Text>
              )}
            </PressableScale>
          </View>
        </View>
      </BottomSheet>
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
  scheduleRange: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  scheduleClosing: {
    color: AppColors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  scheduleClosingTime: {
    color: AppColors.textPrimary,
    fontWeight: '700',
  },
  antiSnipeRule: {
    color: AppColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: -4,
  },
  antiSnipeRuleBold: {
    color: AppColors.textPrimary,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    padding: 14,
    flexWrap: 'wrap',
  },
  priceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xcoinRate: {
    width: '100%',
    marginTop: 10,
    color: AppColors.textSecondary,
    fontSize: 12,
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
