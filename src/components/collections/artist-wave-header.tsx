import { Image } from 'expo-image';
import { Dimensions, StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useAppColors } from '@/context/theme-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMG_SIZE = SCREEN_WIDTH - 80;

export function ArtistWaveHeader({ color, imageUrl }: { color: string; imageUrl?: string }) {
  const AppColors = useAppColors();
  return (
    <View style={styles.container}>
      <View style={[styles.imageBox, { backgroundColor: color || AppColors.surface }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
            <Ionicons name="person-outline" size={48} color={AppColors.textSecondary} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  imageBox: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: 20,
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
