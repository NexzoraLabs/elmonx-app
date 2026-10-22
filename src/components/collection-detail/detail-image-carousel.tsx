import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useTranslation } from 'react-i18next';

// Artwork is shown at its own shape (like the old Unity app), within sane limits so a very
// tall/wide image can't push the page around.
const DEFAULT_RATIO = 0.8;
const MIN_RATIO = 0.6;
const MAX_RATIO = 1.5;

type DetailImageCarouselProps = {
  images: string[];
  /** Placeholder tint when there is no image. */
  color: string;
};

/** Detail-page hero: large artwork on a light rounded shade, so the image area reads as one block
 * even when the artwork is small or has transparent margins. */
export function DetailImageCarousel({ images, color }: DetailImageCarouselProps) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const [index, setIndex] = useState(0);
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const hasMultiple = images.length > 1;
  const currentImage = images[index];

  const step = (delta: number) => setIndex((prev) => (prev + delta + images.length) % images.length);

  return (
    <View style={styles.container}>
      <View style={[styles.imageArea, { aspectRatio: ratio }]}>
        {currentImage ? (
          <Image
            source={{ uri: currentImage }}
            style={styles.image}
            contentFit="contain"
            transition={150}
            onLoad={(event) => {
              const { width, height } = event.source;
              if (width > 0 && height > 0) setRatio(Math.min(MAX_RATIO, Math.max(MIN_RATIO, width / height)));
            }}
          />
        ) : (
          <PlaceholderThumb color={color} icon="image-outline" style={styles.placeholder} iconSize={40} />
        )}

        {hasMultiple ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Previous image')}
              hitSlop={8}
              onPress={() => step(-1)}
              style={[styles.arrowButton, styles.arrowLeft]}>
              <Ionicons name="chevron-back" size={18} color={AppColors.textPrimary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Next image')}
              hitSlop={8}
              onPress={() => step(1)}
              style={[styles.arrowButton, styles.arrowRight]}>
              <Ionicons name="chevron-forward" size={18} color={AppColors.textPrimary} />
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  imageArea: {
    width: '100%',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 18,
    backgroundColor: AppColors.subtleFill,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: {
    left: 4,
  },
  arrowRight: {
    right: 4,
  },
}));
