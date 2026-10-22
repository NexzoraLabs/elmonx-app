import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

// Welcome-screen artwork: three real drop images fanned out (front, left, right).
const FRONT_IMAGE = 'https://assets.elmonx.com/drops/1792071914968_760944894.webp';
const LEFT_IMAGE = 'https://assets.elmonx.com/drops/1776862843984_576666441.webp';
const RIGHT_IMAGE = 'https://assets.elmonx.com/drops/1780316209621_577398966.webp';

export function CollectibleHero() {
  return (
    <View style={styles.container}>
      <View style={[styles.card, styles.sideCard, styles.leftCard]}>
        <Image source={{ uri: LEFT_IMAGE }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      </View>
      <View style={[styles.card, styles.sideCard, styles.rightCard]}>
        <Image source={{ uri: RIGHT_IMAGE }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      </View>
      <View style={[styles.card, styles.centerCard]}>
        <Image source={{ uri: FRONT_IMAGE }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    overflow: 'hidden',
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  sideCard: {
    position: 'absolute',
    width: 120,
    height: 170,
    borderRadius: 14,
  },
  leftCard: {
    transform: [{ rotate: '-14deg' }, { translateX: -70 }],
  },
  rightCard: {
    transform: [{ rotate: '14deg' }, { translateX: 70 }],
  },
  centerCard: {
    width: 140,
    height: 190,
    borderRadius: 16,
  },
});
