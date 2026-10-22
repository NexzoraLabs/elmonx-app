import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/app-colors';

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const { isConnected, isInternetReachable } = useNetInfo();
  // Both start as null (unknown); only show once the device is known to be offline.
  const offline = isConnected === false || isInternetReachable === false;
  if (!offline) return null;

  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + 60 }]}>
      <View style={styles.pill} accessibilityRole="alert">
        <Ionicons name="cloud-offline-outline" size={16} color={AppColors.textPrimary} />
        <Text style={styles.text}>No internet connection</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: AppColors.danger,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});
