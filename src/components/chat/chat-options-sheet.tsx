import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { AppColors } from '@/constants/app-colors';

type ChatOptionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  username: string;
  isBlocked: boolean;
  canDelete: boolean;
  onViewProfile: () => void;
  onBlockToggle: () => void;
  onDelete: () => void;
};

export function ChatOptionsSheet({
  visible,
  onClose,
  username,
  isBlocked,
  canDelete,
  onViewProfile,
  onBlockToggle,
  onDelete,
}: ChatOptionsSheetProps) {
  const action = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Row icon="person-outline" label="View Profile" onPress={action(onViewProfile)} />
      <Row
        icon="ban-outline"
        label={isBlocked ? `Unblock @${username}` : `Block @${username}`}
        onPress={action(onBlockToggle)}
        danger={!isBlocked}
        last={!canDelete}
      />
      {canDelete ? <Row icon="trash-outline" label="Delete Chat" onPress={action(onDelete)} danger last /> : null}
    </BottomSheet>
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
    <Pressable
      style={[styles.row, !last && styles.rowBorder]}
      onPress={onPress}>
      <Ionicons name={icon} size={20} color={danger ? AppColors.danger : AppColors.textPrimary} />
      <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  label: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  labelDanger: {
    color: AppColors.danger,
  },
});
