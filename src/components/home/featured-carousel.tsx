import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppColors } from '@/constants/app-colors';
import type { HomeBanner } from '@/services/home-api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 40;

function handleBannerPress(banner: HomeBanner) {
  if (banner.collectionId) {
    const path = banner.linkType === 'drop' ? '/drop/[id]' : '/collection/[id]';
    router.push({ pathname: path, params: { id: banner.collectionId } });
  }
}

export function FeaturedCarousel({ banners }: { banners: HomeBanner[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (SLIDE_WIDTH + 12));
    setActiveIndex(index);
  };

  if (banners.length === 0) return null;

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={SLIDE_WIDTH + 12}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={styles.scrollContent}>
        {banners.map((banner) => {
          const imageUrl = banner.mobileImageUrl ?? banner.desktopImageUrl;
          return (
            <Pressable
              key={banner.id}
              style={styles.slideWrapper}
              onPress={() => handleBannerPress(banner)}>
              <View style={styles.slide}>
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {banners.length > 1 ? (
        <View style={styles.dots}>
          {banners.map((banner, index) => (
            <View key={banner.id} style={[styles.dot, index === activeIndex && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  slideWrapper: {
    width: SLIDE_WIDTH,
  },
  slide: {
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: AppColors.surface,
  },
  placeholder: {
    backgroundColor: AppColors.surface,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.border,
  },
  dotActive: {
    width: 16,
    backgroundColor: AppColors.textPrimary,
  },
});
