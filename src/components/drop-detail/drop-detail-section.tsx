import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { DetailImageCarousel } from '@/components/collection-detail/detail-image-carousel';
import { BlindBoxItems } from '@/components/drop-detail/blind-box-items';
import { BuyWithXCoinsSheet } from '@/components/drop-detail/buy-with-xcoins-sheet';
import { DropAccordion } from '@/components/drop-detail/drop-accordion';
import { ViewIn3DButton } from '@/components/collection-detail/view-in-3d-button';
import { DropInfoCard } from '@/components/drop-detail/drop-info-card';
import { DropSocialActions } from '@/components/drop-detail/drop-social-actions';
import { useDropViewer3D } from '@/components/drop-detail/use-drop-viewer-3d';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import {
  type Currency,
  type CurrencyRates,
  type Drop,
} from '@/services/drops-api';
import { useTranslation } from 'react-i18next';

type Props = {
  drop: Drop;
  currency: Currency;
  rates: CurrencyRates;
  onCurrencyChange: (currency: Currency) => void;
  /** Comments count lives in the parent so the comments sheet can update it. */
  commentsCount: number;
  onOpenComments: (drop: Drop) => void;
  onOpenAllowlist: (drop: Drop) => void;
  /** After an in-app purchase — the screen re-fetches this drop (editions left / sold out). */
  onPurchased: (drop: Drop) => void;
  /** True on the single-drop page, where like / comment / share sit in the screen header instead. */
  socialInHeader?: boolean;
};

/** One drop, laid out like the website's drop-details block (same checks, minus purchasing). */
export function DropDetailSection({
  drop,
  currency,
  rates,
  onCurrencyChange,
  commentsCount,
  onOpenComments,
  onOpenAllowlist,
  onPurchased,
  socialInHeader = false,
}: Props) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { token } = useAuth();
  const viewer3D = useDropViewer3D(drop);
  const [buyOpen, setBuyOpen] = useState(false);

  const remaining = (drop.total_editions || 0) - (drop.consumed_editions || 0);
  const image = drop.images?.[0]?.original_url;
  const isPrivate = drop.sale_title === 'Private';
  const isLayer2 = drop.type === 'Layer_2';

  const requireAuth = () => {
    if (token) return true;
    Alert.alert(t('Sign in required'), t('Please sign in to continue.'));
    return false;
  };

  return (
    <View>
      <DetailImageCarousel images={image ? [image] : []} color={AppColors.surface} />

      {/* View in 3D: centred under the artwork, above the title. */}
      {viewer3D.canView ? (
        <View style={styles.viewIn3D}>
          <ViewIn3DButton onPress={viewer3D.open} loading={viewer3D.loading} />
        </View>
      ) : null}

      <View style={styles.titleBlock}>
        {isPrivate ? (
          <Pressable
            disabled={!isLayer2}
            onPress={() => onOpenAllowlist(drop)}
            style={({ pressed }) => [styles.privatePill, pressed && styles.pressed]}>
            <Text style={styles.privateText}>{t('PRIVATE SALE')}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>{drop.title}</Text>

        {!socialInHeader ? (
          <DropSocialActions drop={drop} commentsCount={commentsCount} onOpenComments={onOpenComments} />
        ) : null}
      </View>

      <DropInfoCard
        drop={drop}
        remaining={remaining}
        currency={currency}
        rates={rates}
        onCurrencyChange={onCurrencyChange}
        onBuyWithXCoins={() => requireAuth() && setBuyOpen(true)}
      />

      <BuyWithXCoinsSheet
        drop={buyOpen ? drop : null}
        remaining={remaining}
        onClose={() => setBuyOpen(false)}
        onPurchased={() => onPurchased(drop)}
      />

      {drop.is_country_blocked ? (
        <View style={styles.disclaimer}>
          <Ionicons name="warning-outline" size={16} color={AppColors.gold} />
          <Text style={styles.disclaimerText}>
            {t('Due to licensing restrictions, this drop is not accessible to users located in')}{' '}
            {(drop.block_country_list ?? []).map((c) => `"${c.name}"`).join(', ')}.
          </Text>
        </View>
      ) : null}

      <DropAccordion drop={drop} remaining={remaining} onCheckAllowlist={() => onOpenAllowlist(drop)} />

      <BlindBoxItems drop={drop} />

      {viewer3D.viewer}
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  viewIn3D: {
    alignItems: 'center',
    marginTop: 4,
  },
  titleBlock: {
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 8,
  },
  privatePill: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.buttonPrimaryBg,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  privateText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(245,180,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,180,0,0.3)',
  },
  disclaimerText: {
    flex: 1,
    color: AppColors.gold,
    fontSize: 12,
    lineHeight: 18,
  },
}));
