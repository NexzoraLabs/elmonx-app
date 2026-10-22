import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles, useAppColors } from '@/context/theme-context';
import { currentLanguage, LANGUAGES, setAppLanguage } from '@/i18n';

/** My Account → Language. Switching re-renders the whole app in place and is remembered. */
export default function LanguageScreen() {
  const AppColors = useAppColors();
  const styles = useStyles();
  const { t } = useTranslation();
  const selected = currentLanguage();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Go back')}
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('Language')}</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>{t('Choose the language for the ElmonX app.')}</Text>
        <View style={styles.card}>
          {LANGUAGES.map((language, index) => {
            const active = language.code === selected;
            return (
              <Pressable
                key={language.code}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => setAppLanguage(language.code)}
                style={({ pressed }) => [
                  styles.row,
                  index < LANGUAGES.length - 1 && styles.rowDivider,
                  pressed && styles.pressed,
                ]}>
                <View style={styles.rowText}>
                  <Text style={styles.native}>{language.nativeName}</Text>
                  {language.name !== language.nativeName ? <Text style={styles.english}>{t(language.name)}</Text> : null}
                </View>
                {active ? <Ionicons name="checkmark-circle" size={22} color={AppColors.link} /> : null}
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.note}>
          {t('Collection names, descriptions and other content from ElmonX stay in their original language.')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((AppColors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
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
  headerTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  subtitle: {
    color: AppColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  rowText: {
    gap: 2,
  },
  native: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  english: {
    color: AppColors.textSecondary,
    fontSize: 12,
  },
  note: {
    color: AppColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
}));
