import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { makeStyles, useAppColors } from '@/context/theme-context';
import { useTranslation } from 'react-i18next';

/** "View in 3D" pill — centred under the artwork on drop / blind box detail pages. */
export function ViewIn3DButton({ onPress, loading = false }: { onPress: () => void; loading?: boolean }) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityState={{ busy: loading }}
      accessibilityLabel={t('View in 3D')}>
      {/* Busy while checking whether the user owns the item (AR is for owners). */}
      {loading ? (
        <ActivityIndicator size="small" color={AppColors.textPrimary} />
      ) : (
        <Ionicons name="cube-outline" size={18} color={AppColors.textPrimary} />
      )}
      <Text style={styles.label}>{t('View in 3D')}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((AppColors) => ({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
}));
