import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { makeStyles, useAppColors } from '@/context/theme-context';
import { useTranslation } from 'react-i18next';

const DIGIT_KEYS: { digit: string; letters?: string }[] = [
  { digit: '1' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
];

type NumericKeypadProps = {
  onPressDigit: (digit: string) => void;
  onBackspace: () => void;
};

export function NumericKeypad({ onPressDigit, onBackspace }: NumericKeypadProps) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <View style={styles.grid}>
      {DIGIT_KEYS.map((key) => (
        <Pressable
          key={key.digit}
          accessibilityRole="button"
          style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
          onPress={() => onPressDigit(key.digit)}>
          <Text style={styles.digit}>{key.digit}</Text>
          {key.letters ? <Text style={styles.letters}>{key.letters}</Text> : null}
        </Pressable>
      ))}

      <View style={styles.key} />

      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
        onPress={() => onPressDigit('0')}>
        <Text style={styles.digit}>0</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Backspace')}
        style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
        onPress={onBackspace}
        hitSlop={8}>
        <Ionicons name="backspace-outline" size={24} color={AppColors.textPrimary} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  key: {
    width: '30%',
    aspectRatio: 1.6,
    borderRadius: 14,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: {
    backgroundColor: AppColors.border,
  },
  digit: {
    color: AppColors.textPrimary,
    fontSize: 22,
    fontWeight: '600',
  },
  letters: {
    color: AppColors.textSecondary,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 2,
  },
}));
