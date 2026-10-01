import { Ionicons } from '@expo/vector-icons';
import { useAppKit } from '@reown/appkit-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';
import { shortenAddress } from '@/services/collectibles-api';

export function ConnectWalletPrompt({ title, subtitle }: { title: string; subtitle: string }) {
  const { open } = useAppKit();
  return (
    <View style={styles.prompt}>
      <View style={styles.promptIcon}>
        <Ionicons name="wallet-outline" size={26} color={AppColors.textSecondary} />
      </View>
      <Text style={styles.promptTitle}>{title}</Text>
      <Text style={styles.promptSubtitle}>{subtitle}</Text>
      <Pressable onPress={() => open()} style={({ pressed }) => [styles.connectButton, pressed && styles.pressed]}>
        <Text style={styles.connectText}>Connect Wallet</Text>
      </Pressable>
    </View>
  );
}

export function ConnectedWalletBar({ address }: { address: string }) {
  const { disconnect } = useAppKit();
  return (
    <View style={styles.bar}>
      <View style={styles.barLeft}>
        <View style={styles.dot} />
        <Text style={styles.barAddress}>{shortenAddress(address)}</Text>
      </View>
      <Pressable hitSlop={8} onPress={() => disconnect()} style={({ pressed }) => pressed && styles.pressed}>
        <Text style={styles.disconnect}>Disconnect</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  promptIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  promptTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  promptSubtitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  connectButton: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: AppColors.buttonPrimaryBg,
  },
  connectText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  barLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.success,
  },
  barAddress: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  disconnect: {
    color: AppColors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
});
