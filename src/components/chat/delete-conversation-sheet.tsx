import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { AppColors } from '@/constants/app-colors';

type DeleteConversationSheetProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteConversationSheet({ visible, onClose, onConfirm }: DeleteConversationSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Delete Conversation</Text>
      <Text style={styles.subtitle}>
        Are you sure you want to delete this conversation? This action cannot be undone.
      </Text>
      <View style={styles.buttonRow}>
        <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
          <Text style={styles.cancelLabel}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.deleteButton]}
          onPress={() => {
            onConfirm();
            onClose();
          }}>
          <Text style={styles.deleteLabel}>Delete Chat</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    color: AppColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: AppColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: AppColors.border,
  },
  cancelLabel: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: AppColors.danger,
  },
  deleteLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
