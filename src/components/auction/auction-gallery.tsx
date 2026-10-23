import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';

import { haptic } from '@/components/motion';
import { makeStyles } from '@/context/theme-context';

/**
 * Swipeable auction artwork with a thumbnail strip. Pages are as wide as the screen (they were a
 * fixed 380pt, which misaligned paging on most phones) and tapping a thumbnail scrolls to it.
 */
export function AuctionGallery({ images }: { images: string[] }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [selected, setSelected] = useState(0);

  const select = (index: number) => {
    haptic('selection');
    setSelected(index);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  return (
    <>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.imageScrollOuter}
        onMomentumScrollEnd={(e) => setSelected(Math.round(e.nativeEvent.contentOffset.x / width))}>
        {images.map((uri, i) => (
          <View key={`${uri}-${i}`} style={[styles.mainImageWrap, { width }]}>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" cachePolicy="memory-disk" />
          </View>
        ))}
      </ScrollView>
      {images.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
          {images.map((uri, i) => (
            <Pressable
              key={`${uri}-${i}`}
              accessibilityRole="button"
              accessibilityLabel={t('Image {{n}}', { n: i + 1 })}
              accessibilityState={{ selected: i === selected }}
              onPress={() => select(i)}
              style={[styles.thumb, i === selected && styles.thumbActive]}>
              <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </>
  );
}

const useStyles = makeStyles((AppColors) => ({
  imageScrollOuter: {
    height: 320,
  },
  mainImageWrap: {
    height: 320,
    backgroundColor: AppColors.surface,
  },
  thumbRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: AppColors.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: AppColors.textPrimary,
  },
}));
