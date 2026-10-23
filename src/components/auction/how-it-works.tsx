import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { makeStyles } from '@/context/theme-context';
import type { AuctionView } from '@/services/auction-api';

/** Website "How it works" block for an auction. */
export function HowItWorks({ auction }: { auction: AuctionView }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const n = auction.editions || 1;
  const pct = auction.increment_percentage ?? 0;
  const items: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }[] = [
    {
      icon: 'wallet-outline',
      title: t('Log in & connect a wallet'),
      text: t('Bid from your ElmonX account. Your NFT goes to the wallet you bid with.'),
    },
    {
      icon: 'hammer-outline',
      title: t('Place your bid'),
      text:
        n === 1
          ? t("Bid in whole X-coins. Each bid must beat the leading bid by {{pct}}%. You don't pay anything unless you win.", { pct })
          : t("Bid in whole X-coins. Once {{n}} bids are in, a new bid must beat the lowest winning bid by {{pct}}%. You don't pay anything unless you win.", { n, pct }),
    },
    {
      icon: 'trophy-outline',
      title: n === 1 ? t('The highest bid wins') : t('The top {{n}} bids win', { n }),
      text: n === 1 ? t('The highest bid wins.') : t('The top {{n}} bids win one item each, paying the lowest winning bid.', { n }),
    },
    {
      icon: 'cube-outline',
      title: t('Pay & receive your NFT'),
      text: t('Pay within {{hours}} hours. Your NFT arrives within 24 hours.', { hours: auction.claim_window_hours ?? 48 }),
    },
  ];

  return (
    <View style={styles.section}>
      {/* Website "How this auction works": four numbered cards, blue icon tile, big faint number. */}
      <View>
        <Text style={styles.sectionTitle}>{t('How this auction works')}</Text>
        <Text style={styles.sectionSubtitle}>{t('Four simple steps, from signing in to the NFT in your wallet.')}</Text>
      </View>
      {items.map((item, index) => (
        <View key={item.icon} style={styles.card}>
          <Text style={styles.bigNumber} accessible={false}>
            {index + 1}
          </Text>
          <View style={styles.iconTile}>
            <Ionicons name={item.icon} size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText}>{item.text}</Text>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: AppColors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: AppColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    overflow: 'hidden',
  },
  bigNumber: {
    position: 'absolute',
    right: 10,
    top: -8,
    fontSize: 72,
    fontWeight: '900',
    color: AppColors.textPrimary,
    opacity: 0.06,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardText: {
    color: AppColors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
}));
