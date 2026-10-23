import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { makeStyles, useTheme } from '@/context/theme-context';

/** Website home "Who We Are" card (components/home-sections/who-we-are), same copy — text only. */
export function WhoWeAreCard() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const styles = useStyles();

  const content = (
    <>
      <View style={styles.labelWrap}>
        <Text style={styles.label}>{t('WHO WE ARE')}</Text>
        <LinearGradient
          colors={['rgba(255,38,42,0)', 'rgba(255,38,42,0.74)', 'rgba(255,38,42,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.labelRule}
        />
      </View>
      <Text style={styles.heading}>{t('The Story Behind ElmonX')}</Text>
      <Text style={styles.description}>
        {t(
          'Limited digital and physical collectibles that come with immersive 3D and AR experiences. Each piece is scarce and fully authenticated to maintain originality and value. This platform is specially designed for collectors who appreciate unique and rare items.'
        )}
      </Text>
    </>
  );

  return (
    <View style={styles.wrap}>
      {isDark ? (
        <LinearGradient colors={['#0f0f0f', '#1a1a1a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.card, styles.cardLight]}>{content}</View>
      )}
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  wrap: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    overflow: 'hidden',
  },
  cardLight: {
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  labelWrap: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  label: {
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.6,
    paddingBottom: 8,
  },
  labelRule: {
    height: 1.2,
  },
  heading: {
    color: AppColors.textPrimary,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    marginBottom: 10,
  },
  description: {
    color: AppColors.textPrimary,
    fontSize: 14,
    lineHeight: 23,
    opacity: 0.88,
  },
}));
