import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CountdownDigits } from '@/components/home/countdown-badge';
import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { FeaturedBanner } from '@/data/home-mock';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 40;

export function FeaturedCarousel({ banners }: { banners: FeaturedBanner[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (SLIDE_WIDTH + 12));
    setActiveIndex(index);
  };

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
        {banners.map((banner) => (
          <View key={banner.id} style={styles.slideWrapper}>
            <LinearGradient
              colors={banner.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.slide}>
              <Text style={styles.eyebrow}>{banner.eyebrow}</Text>
              <Text style={styles.title}>{banner.title}</Text>
            </LinearGradient>

            <View style={styles.infoRow}>
              <PlaceholderThumb color={banner.colors[1]} style={styles.avatar} icon="person-outline" />
              <View style={styles.infoText}>
                <Text style={styles.dropTitle} numberOfLines={1}>
                  {banner.dropTitle}
                </Text>
                <CountdownDigits targetMs={banner.endsAt} />
                <Text style={styles.dropSubtitle}>{banner.dropSubtitle}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {banners.map((banner, index) => (
          <View key={banner.id} style={[styles.dot, index === activeIndex && styles.dotActive]} />
        ))}
      </View>
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
    height: 150,
    borderRadius: 20,
    justifyContent: 'flex-end',
    padding: 16,
  },
  eyebrow: {
    color: 'rgba(10,10,11,0.7)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    color: '#0A0A0B',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    gap: 4,
  },
  dropTitle: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  dropSubtitle: {
    color: AppColors.textSecondary,
    fontSize: 11,
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
