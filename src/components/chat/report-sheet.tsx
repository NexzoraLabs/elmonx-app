import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { AppColors } from '@/constants/app-colors';
import { REPORT_REASONS } from '@/data/chat-mock';

type ReportSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
};

export function ReportSheet({ visible, onClose, onSubmit }: ReportSheetProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    if (!reason) return;
    onSubmit(reason, details);
    setReason(null);
    setDetails('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Report</Text>

      {REPORT_REASONS.map((option) => {
        const selected = option === reason;
        return (
          <Pressable key={option} style={styles.row} onPress={() => setReason(option)}>
            <Text style={styles.label}>{option}</Text>
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected ? <View style={styles.radioDot} /> : null}
            </View>
          </Pressable>
        );
      })}

      <TextInput
        value={details}
        onChangeText={setDetails}
        placeholder="Tell us more about the issue..."
        placeholderTextColor={AppColors.textPlaceholder}
        multiline
        style={styles.textarea}
      />

      <AuthButton label="Report" onPress={handleSubmit} disabled={!reason} />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  label: {
    color: AppColors.textPrimary,
    fontSize: 14,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.buttonSecondaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: AppColors.textPrimary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.textPrimary,
  },
  textarea: {
    marginTop: 16,
    marginBottom: 16,
    minHeight: 90,
    color: AppColors.textPrimary,
    fontSize: 14,
    backgroundColor: AppColors.background,
    borderRadius: 14,
    padding: 14,
    textAlignVertical: 'top',
  },
});
