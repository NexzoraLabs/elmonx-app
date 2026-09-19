import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';

type DetailImageCarouselProps = {
  images: string[];
  color: string;
};

export function DetailImageCarousel({ images, color }: DetailImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const hasMultiple = images.length > 1;
  const currentImage = images[index];

  return (
    <View style={styles.row}>
      {hasMultiple ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous image"
          hitSlop={8}
          onPress={() => setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
          style={styles.arrowButton}>
          <Ionicons name="chevron-back" size={18} color={AppColors.textPrimary} />
        </Pressable>
      ) : (
        <View style={styles.arrowSpacer} />
      )}

      <View style={styles.imageWrapper}>
        {currentImage ? (
          <Image source={{ uri: currentImage }} style={styles.image} contentFit="contain" transition={150} />
        ) : (
          <PlaceholderThumb color={color} icon="image-outline" style={styles.image} iconSize={40} />
        )}
      </View>

      {hasMultiple ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next image"
          hitSlop={8}
          onPress={() => setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
          style={styles.arrowButton}>
          <Ionicons name="chevron-forward" size={18} color={AppColors.textPrimary} />
        </Pressable>
      ) : (
        <View style={styles.arrowSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowSpacer: {
    width: 32,
  },
  imageWrapper: {
    flex: 1,
    aspectRatio: 0.9,
    marginHorizontal: 12,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
