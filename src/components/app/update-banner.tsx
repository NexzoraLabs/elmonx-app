import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/app-colors';

function checkAndDownload() {
  Updates.checkForUpdateAsync()
    .then((result) => (result.isAvailable ? Updates.fetchUpdateAsync() : null))
    .catch(() => {
      // Offline or server hiccup: the next foreground/launch tries again.
    });
}

/**
 * OTA updates (EAS Update). Native code checks on every cold start; this also checks
 * when the app returns to the foreground and offers a restart once an update is downloaded.
 * If ignored, the update applies on the next cold start anyway.
 */
export function UpdateBanner() {
  const insets = useSafeAreaInsets();
  const { isUpdatePending } = Updates.useUpdates();

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkAndDownload();
    });
    return () => subscription.remove();
  }, []);

  if (!isUpdatePending) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + 84 }]}>
      <View style={styles.card}>
        <Ionicons name="sparkles-outline" size={18} color={AppColors.textPrimary} />
        <Text style={styles.text}>A new version is ready</Text>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={() => {
            Updates.reloadAsync().catch(() => {});
          }}>
          <Text style={styles.buttonText}>Restart</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  text: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: AppColors.buttonPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 13,
    fontWeight: '700',
  },
});
