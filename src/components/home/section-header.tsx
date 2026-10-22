import { Pressable, Text, View } from 'react-native';

import { makeStyles } from '@/context/theme-context';
import { useTranslation } from 'react-i18next';

type SectionHeaderProps = {
  title: string;
  eyebrow?: string;
  /** Short line under the title (e.g. the auction section's "Bid in X-coins…"). */
  subtitle?: string;
  onPressSeeAll?: () => void;
};

export function SectionHeader({ title, eyebrow, subtitle, onPressSeeAll }: SectionHeaderProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <View style={styles.textGroup}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onPressSeeAll ? (
        <Pressable hitSlop={8} onPress={onPressSeeAll}>
          <Text style={styles.viewAll}>{t('View All')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  textGroup: {
    flex: 1,
  },
  eyebrow: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  subtitle: {
    color: AppColors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  viewAll: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '400',
    textDecorationLine: 'underline',
    opacity: 0.85,
  },
}));
