import { Ionicons } from '@expo/vector-icons';
import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles, useAppColors } from '@/context/theme-context';
import { reportError } from '@/services/crash-reporting';
import { useTranslation } from 'react-i18next';

/** Shown instead of a blank screen when a screen throws while rendering. */
export function AppErrorScreen({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  useEffect(() => {
    reportError(error, { source: 'ErrorBoundary' });
  }, [error]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="alert-circle-outline" size={40} color={AppColors.textPrimary} />
        </View>
        <Text style={styles.title}>{t('Something went wrong')}</Text>
        <Text style={styles.message}>
          {t('An unexpected error occurred. Please try again. If it keeps happening, restart the app.')}
        </Text>
        {__DEV__ ? <Text style={styles.devError}>{error.message}</Text> : null}
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={retry}>
          <Text style={styles.buttonText}>{t('Try Again')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((AppColors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  message: {
    color: AppColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  devError: {
    color: AppColors.danger,
    fontSize: 12,
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
    height: 48,
    paddingHorizontal: 32,
    borderRadius: 24,
    backgroundColor: AppColors.buttonPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 15,
    fontWeight: '700',
  },
}));
