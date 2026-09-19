import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type OtpInputProps = {
  length: number;
  value: string;
};

export function OtpInput({ length, value }: OtpInputProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, index) => {
        const digit = value[index];
        const isActive = index === value.length;
        return (
          <View key={index} style={styles.slot}>
            <Text style={styles.digit}>{digit ?? ''}</Text>
            <View style={[styles.underline, isActive && styles.underlineActive]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 28,
  },
  slot: {
    width: 28,
    alignItems: 'center',
    gap: 8,
  },
  digit: {
    color: AppColors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    height: 30,
  },
  underline: {
    height: 2,
    width: '100%',
    borderRadius: 1,
    backgroundColor: AppColors.border,
  },
  underlineActive: {
    backgroundColor: AppColors.textPrimary,
  },
});
