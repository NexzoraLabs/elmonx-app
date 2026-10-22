import { Image, type ImageLoadEventData } from 'expo-image';
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

import { makeStyles } from '@/context/theme-context';
import type { HomeBanner } from '@/services/home-api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_INNER = SCREEN_WIDTH - 40;
// Fallback aspect ratio while image loads (roughly square-ish)
const FALLBACK_RATIO = 1;

function handleBannerPress(banner: HomeBanner) {
  if (banner.collectionId) {
    const path = banner.linkType === 'drop' ? '/drop/[id]' : '/collection/[id]';
    router.push({ pathname: path, params: { id: banner.collectionId } });
  }
}

function BannerSlide({ banner, onPress }: { banner: HomeBanner; onPress: () => void }) {
  const styles = useStyles();
  const imageUrl = banner.mobileImageUrl ?? banner.desktopImageUrl;
  const [ratio, setRatio] = useState<number>(FALLBACK_RATIO);

  const handleLoad = (e: ImageLoadEventData) => {
    const { width, height } = e.source;
    if (width && height) setRatio(width / height);
  };

  return (
    <Pressable style={styles.page} onPress={onPress}>
      <View style={[styles.slide, { height: SLIDE_INNER / ratio }]}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            transition={200}
            onLoad={handleLoad}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
        )}
      </View>
    </Pressable>
  );
}

export function FeaturedCarousel({ banners }: { banners: HomeBanner[] }) {
  const styles = useStyles();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
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
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}>
        {banners.map((banner) => (
          <BannerSlide
            key={banner.id}
            banner={banner}
            onPress={() => handleBannerPress(banner)}
          />
        ))}
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

const useStyles = makeStyles((AppColors) => ({
  page: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
  },
  slide: {
    width: SLIDE_INNER,
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
}));
