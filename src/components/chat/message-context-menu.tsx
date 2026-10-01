import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type MessageContextMenuProps = {
  visible: boolean;
  onClose: () => void;
  /** Null when the message has no text to copy. */
  onCopy: (() => void) | null;
  /** Only for my own messages (website "Unsend"). */
  onUnsend: (() => void) | null;
};

export function MessageContextMenu({ visible, onClose, onCopy, onUnsend }: MessageContextMenuProps) {
  const action = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.menu}>
          {onCopy ? <Row icon="copy-outline" label="Copy" onPress={action(onCopy)} last={!onUnsend} /> : null}
          {onUnsend ? <Row icon="arrow-undo-outline" label="Unsend" onPress={action(onUnsend)} danger last /> : null}
        </View>
      </Pressable>
    </Modal>
  );
}

function Row({
  icon,
  label,
  onPress,
  danger,
  last,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable style={[styles.row, !last && styles.rowBorder]} onPress={onPress}>
      <Ionicons name={icon} size={17} color={danger ? AppColors.danger : AppColors.textPrimary} />
      <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menu: {
    width: 180,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  label: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  labelDanger: {
    color: AppColors.danger,
  },
});
