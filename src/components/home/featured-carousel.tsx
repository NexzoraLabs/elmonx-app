import { Image, type ImageLoadEventData } from 'expo-image';
import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
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
import { SHARE_URL } from '@/config/env';
import type { HomeBanner } from '@/services/home-api';
import { appRouteForWebsiteUrl } from '@/services/website-links';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_INNER = SCREEN_WIDTH - 40;
// Fallback aspect ratio while image loads (roughly square-ish)
const FALLBACK_RATIO = 1;

/** Website banner.ts: collection → its page, internal → that site path (in the app when we have the
 * screen, else the website), external → browser. */
function handleBannerPress(banner: HomeBanner) {
  if (banner.linkType === 'collection' && banner.collectionId) {
    router.push({ pathname: '/collection/[id]', params: { id: banner.collectionId } });
    return;
  }
  const url = banner.linkUrl?.trim();
  if (!url) return;
  if (banner.linkType === 'internal') {
    const route = appRouteForWebsiteUrl(url);
    if (route) router.push(route as Href);
    else WebBrowser.openBrowserAsync(/^https?:/i.test(url) ? url : `${SHARE_URL}${url.startsWith('/') ? '' : '/'}${url}`);
    return;
  }
  if (banner.linkType === 'external') WebBrowser.openBrowserAsync(url);
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
    <Pressable style={styles.page} onPress={onPress} accessibilityRole="button" accessibilityLabel={banner.collectionTitle ?? undefined}>
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
