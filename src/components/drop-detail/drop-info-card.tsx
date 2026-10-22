import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, Text, View } from 'react-native';

import { WEB_URL } from '@/config/env';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useCountdown } from '@/hooks/use-countdown';
import { formatPrice, slugify, type Currency, type CurrencyRates, type Drop } from '@/services/drops-api';
import { useTranslation } from 'react-i18next';
import { appLocale } from '@/i18n';

const CURRENCIES: Currency[] = ['GBP', 'USD', 'EUR', 'ETH'];

function toGoogleCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

/** Same URL the website builds (utils/calendar.utils.ts). */
function googleCalendarUrl(drop: Drop): string {
  const start = new Date(drop.release_date);
  const end = new Date(start.getTime() + 60 * 60000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${drop.title} Drop on ELMONX`,
    dates: `${toGoogleCalendarDate(start)}/${toGoogleCalendarDate(end)}`,
    details: `${drop.title} launches on ELMONX.`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Website `date:'medium'` — "Oct 13, 2026, 7:00:00 PM". */
function formatMedium(iso: string): string {
  return new Date(iso).toLocaleString(appLocale('en-US'), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatSaleOpens(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(appLocale('en-GB'), { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString(appLocale('en-US'), { hour: 'numeric', minute: '2-digit' });
  return `${date}, ${time}`;
}

const COIN_ICON = require('../../../assets/coin_icon.webp');

/** Eth_Product purchases (card / ETH / customise) happen on the website. */
const openOnWeb = (drop: Drop) =>
  WebBrowser.openBrowserAsync(`${WEB_URL}/drop/${slugify(drop.title)}/${drop._id}`);

type Props = {
  drop: Drop;
  remaining: number;
  currency: Currency;
  rates: CurrencyRates;
  onCurrencyChange: (currency: Currency) => void;
  /** Opens the X-Coins checkout (Layer_2 drops). */
  onBuyWithXCoins: () => void;
};

/** Website drop-info-card: same button chain — Layer_2 buys with X-Coins in the app, auctions open
 * the auction page, every other type (Eth_Product) is bought on the website. */
export function DropInfoCard({ drop, remaining, currency, rates, onCurrencyChange, onBuyWithXCoins }: Props) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const releaseMs = drop.release_date ? new Date(drop.release_date).getTime() : 0;
  const countdown = useCountdown(releaseMs);
  // Website: shouldShowTimer() = release_date exists && now < release_date.
  const showTimer = releaseMs > 0 && !countdown.isComplete;
  // Website: the public sale has its own countdown, which keeps running after the private release.
  const publicMs = drop.public_sale_date ? new Date(drop.public_sale_date).getTime() : 0;
  const publicCountdown = useCountdown(publicMs);
  const showPublicTimer = publicMs > 0 && !publicCountdown.isComplete;
  const isLayer2 = drop.type === 'Layer_2';
  const isSold = remaining <= 0;
  const isSaleClosed = Boolean(drop.is_sale_closed);
  const isAuction = drop.sale_mode === 'Auction';
  // Collaborator drops are not sold through ElmonX — no buy button at all.
  const isCollaborator = drop.type === 'Collaborator';

  let actions: React.ReactNode = null;
  if (isCollaborator) {
    actions = null;
  } else if (isAuction) {
    // Auction drops never show Buy buttons — they sell only through the auction.
    actions = drop.auction_id ? (
      <ActionButton
        label={drop.auction_status === 'Live' ? t('Bid in the auction') : t('View auction')}
        onPress={() => router.push({ pathname: '/auction/[id]', params: { id: drop.auction_id as string } })}
      />
    ) : (
      <ActionButton label={t('Auction coming soon')} disabled />
    );
  } else if (showTimer) {
    actions = (
      <View style={styles.opensBanner}>
        <Text style={styles.opensText}>{t('Sale opens')}{' '}{formatSaleOpens(drop.release_date)}</Text>
        <Pressable onPress={() => WebBrowser.openBrowserAsync(googleCalendarUrl(drop))} hitSlop={6}>
          <View style={styles.calendarLink}>
            <Ionicons name="calendar-outline" size={14} color={AppColors.link} />
            <Text style={styles.calendarText}>{t('Add to Google Calendar')}</Text>
          </View>
        </Pressable>
      </View>
    );
  } else if (isSaleClosed || isSold || drop.is_sold) {
    actions = <ActionButton label={t('Sold Out')} disabled />;
  } else if (isLayer2) {
    actions = remaining > 0 ? <ActionButton label={t('Buy With X-Coins')} onPress={onBuyWithXCoins} /> : <ActionButton label={t('Sold Out')} disabled />;
  } else {
    actions = <ActionButton label={t('Buy on Web')} icon="open-outline" onPress={() => openOnWeb(drop)} />;
  }

  return (
    <View style={styles.card}>
      {/* Same rows as the website's drop-info-card: label left, value / countdown right. */}
      <View style={styles.rows}>
        <InfoRow label={drop.public_sale_date ? t('Private Release Date') : t('Release Date')}>
          {showTimer ? (
            <Text style={styles.timer}>
              {countdown.days}{t('d')}{' '}{countdown.hours}{t('h')}{' '}{countdown.minutes}{t('m')}{' '}{countdown.seconds}{t('s')}
            </Text>
          ) : (
            <Text style={styles.value}>{drop.release_date ? formatMedium(drop.release_date) : '—'}</Text>
          )}
        </InfoRow>

        {drop.public_sale_date ? (
          <InfoRow label={t('Public Release Date')}>
            {showPublicTimer ? (
              <Text style={styles.timer}>
                {publicCountdown.days}{t('d')}{' '}{publicCountdown.hours}{t('h')}{' '}{publicCountdown.minutes}{t('m')}{' '}{publicCountdown.seconds}{t('s')}
              </Text>
            ) : (
              <Text style={styles.value}>{formatMedium(drop.public_sale_date)}</Text>
            )}
          </InfoRow>
        ) : null}

        {/* Auction drops have no fixed price — the bid price lives on the auction page. */}
        {!isAuction ? (
          <InfoRow label={t('Price')}>
            {isLayer2 ? (
              <View style={styles.priceRow}>
                <Image source={COIN_ICON} style={styles.coinIcon} contentFit="contain" />
                <Text style={styles.value}>{drop.price || 0}</Text>
              </View>
            ) : (
              <Text style={styles.value}>{formatPrice(drop.price, currency, rates)}</Text>
            )}
          </InfoRow>
        ) : null}
      </View>

      {!isLayer2 && !isAuction ? (
        <View style={styles.currencyRow}>
          {CURRENCIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => onCurrencyChange(c)}
              style={[styles.currencyPill, c === currency && styles.currencyPillActive]}>
              <Text style={[styles.currencyText, c === currency && styles.currencyTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
  icon,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>{label}</Text>
      {icon ? <Ionicons name={icon} size={16} color={AppColors.buttonPrimaryText} /> : null}
    </Pressable>
  );
}

const useStyles = makeStyles((AppColors) => ({
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  rows: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  timer: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  coinIcon: {
    width: 18,
    height: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  currencyPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  currencyPillActive: {
    backgroundColor: AppColors.buttonPrimaryBg,
    borderColor: AppColors.buttonPrimaryBg,
  },
  currencyText: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  currencyTextActive: {
    color: AppColors.buttonPrimaryText,
  },
  actions: {
    gap: 10,
  },
  button: {
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.buttonPrimaryBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    backgroundColor: AppColors.buttonDisabledBg,
    borderWidth: 0,
  },
  pressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  buttonTextDisabled: {
    color: AppColors.buttonDisabledText,
  },
  opensBanner: {
    backgroundColor: AppColors.background,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  opensText: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  calendarLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarText: {
    color: AppColors.link,
    fontSize: 13,
    fontWeight: '600',
  },
}));
