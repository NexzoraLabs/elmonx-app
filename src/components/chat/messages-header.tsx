import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { makeStyles, useAppColors } from '@/context/theme-context';
import { useTranslation } from 'react-i18next';

export function MessagesHeader({ onPressCompose }: { onPressCompose: () => void }) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{t('Messages')}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('New message')}
        hitSlop={8}
        onPress={onPressCompose}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Ionicons name="create-outline" size={18} color={AppColors.textPrimary} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
}));
