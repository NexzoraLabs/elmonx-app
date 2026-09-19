import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { AppColors } from '@/constants/app-colors';

type UploadOption = 'media' | 'camera' | 'document';

type UploadSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: UploadOption) => void;
};

const OPTIONS: { key: UploadOption; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'media', label: 'Media', icon: 'image-outline' },
  { key: 'camera', label: 'Camera', icon: 'camera-outline' },
  { key: 'document', label: 'Document', icon: 'document-text-outline' },
];

export function UploadSheet({ visible, onClose, onSelect }: UploadSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {OPTIONS.map((option, index) => (
        <Pressable
          key={option.key}
          style={[styles.row, index < OPTIONS.length - 1 && styles.rowBorder]}
          onPress={() => {
            onSelect(option.key);
            onClose();
          }}>
          <Ionicons name={option.icon} size={20} color={AppColors.textPrimary} />
          <Text style={styles.label}>{option.label}</Text>
        </Pressable>
      ))}
    </BottomSheet>
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
});
