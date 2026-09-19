import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

/**
 * Text placeholder for the ElmonX wordmark. Swap for the exported
 * logo asset (SVG/PNG) from Figma once available.
 */
export function LogoMark({ size = 16 }: { size?: number }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.glyph, { fontSize: size }]}>☰</Text>
      <Text style={[styles.word, { fontSize: size }]}>LMONX</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  glyph: {
    color: AppColors.textPrimary,
  },
  word: {
    color: AppColors.textPrimary,
    fontWeight: '700',
    letterSpacing: 3,
  },
});
