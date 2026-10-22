import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useTranslation } from 'react-i18next';

type MessageContextMenuProps = {
  visible: boolean;
  onClose: () => void;
  /** Null when the message has no text to copy. */
  onCopy: (() => void) | null;
  /** Only for my own messages (website "Unsend"). */
  onUnsend: (() => void) | null;
};

export function MessageContextMenu({ visible, onClose, onCopy, onUnsend }: MessageContextMenuProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const action = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.menu}>
        {onCopy ? <Row icon="copy-outline" label={t('Copy')} onPress={action(onCopy)} last={!onUnsend} /> : null}
        {onUnsend ? <Row icon="arrow-undo-outline" label={t('Unsend')} onPress={action(onUnsend)} danger last /> : null}
      </View>
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
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <Pressable style={[styles.row, !last && styles.rowBorder]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={danger ? AppColors.danger : AppColors.textPrimary} />
      <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((AppColors) => ({
  menu: {
    paddingBottom: 4,
  },
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
    fontWeight: '500',
  },
  labelDanger: {
    color: AppColors.danger,
  },
}));
