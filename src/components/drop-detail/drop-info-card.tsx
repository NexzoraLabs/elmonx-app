import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';
import { useCountdown } from '@/hooks/use-countdown';
import { formatPrice, type Currency, type CurrencyRates, type Drop } from '@/services/drops-api';

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

function formatMedium(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatSaleOpens(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date}, ${time}`;
}

const purchaseNotAvailable = () =>
  Alert.alert('Coming soon', 'Purchasing is not available in the app yet.');

type Props = {
  drop: Drop;
  remaining: number;
  currency: Currency;
  rates: CurrencyRates;
  onCurrencyChange: (currency: Currency) => void;
};

export function DropInfoCard({ drop, remaining, currency, rates, onCurrencyChange }: Props) {
  const releaseMs = drop.release_date ? new Date(drop.release_date).getTime() : 0;
  const countdown = useCountdown(releaseMs);
  // Website: shouldShowTimer() = release_date exists && now < release_date.
  const showTimer = releaseMs > 0 && !countdown.isComplete;
  const isLayer2 = drop.type === 'Layer_2';
  const isSold = remaining <= 0;
  const isSaleClosed = Boolean(drop.is_sale_closed);

  let actions: React.ReactNode;
  if (showTimer) {
    actions = (
      <View style={styles.opensBanner}>
        <Text style={styles.opensText}>Sale opens {formatSaleOpens(drop.release_date)}</Text>
        <Pressable onPress={() => WebBrowser.openBrowserAsync(googleCalendarUrl(drop))} hitSlop={6}>
          <View style={styles.calendarLink}>
            <Ionicons name="calendar-outline" size={14} color={AppColors.link} />
            <Text style={styles.calendarText}>Add to Google Calendar</Text>
          </View>
        </Pressable>
      </View>
    );
  } else if (isSaleClosed || isSold || drop.is_sold) {
    actions = <ActionButton label="Sold Out" disabled />;
  } else if (isLayer2) {
    actions = remaining > 0 ? <ActionButton label="Buy With X-Coins" onPress={purchaseNotAvailable} /> : <ActionButton label="Sold Out" disabled />;
  } else if (drop.customize_drop) {
    actions = <ActionButton label="Customize And Buy" onPress={purchaseNotAvailable} />;
  } else {
    const showCard = drop.sale_title === 'Public' || !drop.sale_title;
    actions = (
      <View style={styles.buttonRow}>
        {showCard ? <ActionButton label="Buy with Card" onPress={purchaseNotAvailable} flex /> : null}
        <ActionButton label="Buy with ETH" onPress={purchaseNotAvailable} flex secondary={showCard} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>{drop.public_sale_date ? 'Private Release Date' : 'Release Date'}</Text>
          {showTimer ? (
            <Text style={styles.timer}>
              {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
            </Text>
          ) : (
            <Text style={styles.value}>{drop.release_date ? formatMedium(drop.release_date) : '—'}</Text>
          )}
        </View>
        <View style={[styles.col, styles.colRight]}>
          <Text style={styles.label}>Price</Text>
          {isLayer2 ? (
            <View style={styles.priceRow}>
              <Ionicons name="logo-bitcoin" size={16} color={AppColors.gold} />
              <Text style={styles.price}>{drop.price || 0}</Text>
            </View>
          ) : (
            <Text style={styles.price}>{formatPrice(drop.price, currency, rates)}</Text>
          )}
        </View>
      </View>

      {!isLayer2 ? (
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

      <View style={styles.actions}>{actions}</View>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
  flex,
  secondary,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  flex?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        flex && styles.flex,
        secondary && styles.buttonSecondary,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary, disabled && styles.buttonTextDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  col: {
    flex: 1,
    gap: 4,
  },
  colRight: {
    alignItems: 'flex-end',
  },
  label: {
    color: AppColors.textSecondary,
    fontSize: 12,
  },
  value: {
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    color: AppColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.buttonPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  flex: {
    flex: 1,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: AppColors.buttonSecondaryBorder,
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
  buttonTextSecondary: {
    color: AppColors.textPrimary,
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
});
