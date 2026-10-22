import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { makeStyles, useAppColors } from '@/context/theme-context';
import type { ShippingAddress } from '@/services/address-api';
import { useTranslation } from 'react-i18next';

type Props = {
  address: ShippingAddress;
  onEdit: () => void;
};

export function AddressCard({ address, onEdit }: Props) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const addressLine = [address.address_one, address.address_two].filter(Boolean).join(', ');
  const cityLine = [address.town_city, address.county_state, address.postal_code].filter(Boolean).join(', ');
  const phone = [address.country_code, address.phone_number].filter(Boolean).join(' ');

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        {address.primary ? (
          <View style={styles.primaryBadge}>
            <Text style={styles.primaryBadgeText}>{t('Primary')}</Text>
          </View>
        ) : (
          <View />
        )}
        <Pressable accessibilityRole="button" accessibilityLabel={t('Edit address')} hitSlop={8} onPress={onEdit}>
          <Ionicons name="pencil" size={16} color={AppColors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="location-outline" size={14} color={AppColors.textSecondary} style={styles.detailIcon} />
        <Text style={styles.detailText}>
          {addressLine}
          {cityLine ? `, ${cityLine}` : ''}
          {address.country ? `, ${address.country}` : ''}
        </Text>
      </View>
      {phone ? (
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={14} color={AppColors.textSecondary} style={styles.detailIcon} />
          <Text style={styles.detailText}>{phone}</Text>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryBadge: {
    backgroundColor: AppColors.buttonPrimaryBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  primaryBadgeText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 10,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailIcon: {
    marginTop: 2,
  },
  detailText: {
    flex: 1,
    color: AppColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
}));
