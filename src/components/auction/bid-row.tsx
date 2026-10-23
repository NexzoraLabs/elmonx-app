import { Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PressableScale } from '@/components/motion';
import { makeStyles, useAppColors } from '@/context/theme-context';
import i18n from '@/i18n';
import type { AuctionBid } from '@/services/auction-api';

function timeAgo(iso: string, now: number): string {
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return i18n.t('{{n}}s ago', { n: s });
  if (s < 3600) return i18n.t('{{n}}m ago', { n: Math.floor(s / 60) });
  if (s < 86400) return i18n.t('{{n}}h ago', { n: Math.floor(s / 3600) });
  return i18n.t('{{n}}d ago', { n: Math.floor(s / 86400) });
}

type BidRowProps = {
  bid: AuctionBid;
  now: number;
  /** Raise controls are shown only for my own active bids placed from the connected wallet. */
  canRaise?: boolean;
  isRaising?: boolean;
  raiseAmount?: string;
  onRaiseAmount?: (value: string) => void;
  walletAddress?: string;
  minNextBid?: number;
  onStartRaise?: (bid: AuctionBid) => void;
  onOpenRaise?: (bid: AuctionBid) => void;
  onCancelRaise?: () => void;
};

/** One row of the auction's bid list (ranked or removed bids). */
export function BidRow({
  bid,
  now,
  canRaise = false,
  isRaising = false,
  raiseAmount = '',
  onRaiseAmount,
  walletAddress,
  minNextBid = 0,
  onStartRaise,
  onOpenRaise,
  onCancelRaise,
}: BidRowProps) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const isMyBid = bid.is_mine;
  const isBidWallet = !!walletAddress && bid.wallet_address?.toLowerCase() === walletAddress.toLowerCase();

  return (
    <View style={[styles.bidRow, bid.is_winning && styles.bidRowWinning]}>
      <View style={styles.bidRowMain}>
        <View style={styles.bidLeft}>
          {bid.rank != null && <Text style={styles.bidRank}>#{bid.rank}</Text>}
          <Text style={styles.bidder}>{bid.user_name || t('Bidder')}</Text>
          {isMyBid && (
            <View style={styles.myBadge}>
              <Text style={styles.myBadgeText}>{t('You')}</Text>
            </View>
          )}
        </View>
        <View style={styles.bidRight}>
          <Text style={styles.bidAmount}>{t('{{amount}} X', { amount: bid.amount.toLocaleString() })}</Text>
          <Text style={styles.bidTime}>{timeAgo(bid.bid_time, now)}</Text>
        </View>
      </View>
      {isMyBid && bid.status === 'Active' && canRaise && isBidWallet && (
        <>
          {!isRaising ? (
            <PressableScale pressScale="button" accessibilityRole="button" style={styles.raiseBtn} onPress={() => onStartRaise?.(bid)}>
              <Text style={styles.raiseBtnText}>{t('Raise bid')}</Text>
            </PressableScale>
          ) : (
            <View style={styles.raisePanel}>
              <TextInput
                style={styles.raiseInput}
                value={raiseAmount}
                onChangeText={onRaiseAmount}
                keyboardType="number-pad"
                placeholder={t('Min {{min}}', { min: minNextBid })}
                placeholderTextColor={AppColors.textPlaceholder}
              />
              <View style={styles.raisePanelBtns}>
                <Pressable accessibilityRole="button" style={styles.cancelRaiseBtn} onPress={onCancelRaise}>
                  <Text style={styles.cancelRaiseBtnText}>{t('Cancel')}</Text>
                </Pressable>
                <PressableScale
                  pressScale="button"
                  haptic="light"
                  accessibilityRole="button"
                  style={styles.confirmRaiseBtn}
                  onPress={() => onOpenRaise?.(bid)}>
                  <Text style={styles.confirmRaiseBtnText}>{t('Confirm raise')}</Text>
                </PressableScale>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
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
}));
