import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { AppColors } from '@/constants/app-colors';

/** Cover image, or the striped placeholder when the user has none. */
export function CoverBanner({ uri, children }: { uri?: string; children?: ReactNode }) {
  return (
    <View style={styles.cover}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="none">
          {Array.from({ length: 14 }).map((_, index) => {
            const x = index * 36 - 60;
            return (
              <Line key={index} x1={x} y1={160} x2={x + 90} y2={-20} stroke="rgba(255,255,255,0.35)" strokeWidth={6} />
            );
          })}
        </Svg>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    height: 150,
    backgroundColor: AppColors.surface,
    overflow: 'hidden',
  },
});
