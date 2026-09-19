import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type RequestFooterProps = {
  onReject: () => void;
  onAccept: () => void;
};

export function RequestFooter({ onReject, onAccept }: RequestFooterProps) {
  return (
    <View style={styles.buttonRow}>
      <Pressable style={[styles.button, styles.rejectButton]} onPress={onReject}>
        <Text style={styles.rejectLabel}>Reject</Text>
      </Pressable>
      <Pressable style={[styles.button, styles.acceptButton]} onPress={onAccept}>
        <Text style={styles.acceptLabel}>Accept</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: AppColors.border,
  },
  rejectLabel: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: AppColors.buttonPrimaryBg,
  },
  acceptLabel: {
    color: AppColors.buttonPrimaryText,
    fontSize: 14,
    fontWeight: '700',
  },
});
