import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { MOTION } from '@/constants/motion';
import { makeStyles } from '@/context/theme-context';

// Website home "ElmonX Partnerships" logos (components/home-sections/partners), same order.
const PARTNERS = [
  { name: 'Wallet Guard', logo: require('../../../assets/images/partners/11.webp') },
  { name: 'Patrick Hughes', logo: require('../../../assets/images/partners/22.webp') },
  { name: 'Asprey Studio', logo: require('../../../assets/images/partners/33.webp') },
  { name: 'OpenSea', logo: require('../../../assets/images/partners/44.webp') },
  { name: 'Veve', logo: require('../../../assets/images/partners/55.webp') },
  { name: 'Bridgeman', logo: require('../../../assets/images/partners/66.webp') },
  { name: 'Doodles', logo: require('../../../assets/images/partners/77.webp') },
  { name: 'Mondrian', logo: require('../../../assets/images/partners/88.webp') },
];

/**
 * Endless logo strip like the website's. The list is rendered twice and slid left by one copy's
 * width, so the loop is seamless. With Reduce Motion on it's a plain horizontal scroller.
 */
export function PartnersStrip() {
  const { t } = useTranslation();
  const styles = useStyles();
  const reduceMotion = useReducedMotion();
  const [copyWidth, setCopyWidth] = useState(0);
  const offset = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion || copyWidth === 0) return;
    offset.set(0);
    offset.set(
      withRepeat(withTiming(-copyWidth, { duration: (copyWidth / MOTION.marqueeSpeed) * 1000, easing: Easing.linear }), -1, false)
    );
    return () => cancelAnimation(offset);
  }, [copyWidth, reduceMotion, offset]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }));

  const logos = (copy: number) =>
    PARTNERS.map((partner) => (
      <View key={`${copy}-${partner.name}`} style={styles.logoTile} accessibilityLabel={partner.name}>
        <Image source={partner.logo} style={styles.logo} contentFit="contain" />
      </View>
    ));

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{t('ElmonX Partnerships')}</Text>
      {reduceMotion ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {logos(0)}
        </ScrollView>
      ) : (
        <View style={styles.viewport}>
          <Animated.View style={[styles.track, animatedStyle]}>
            <View style={styles.row} onLayout={(e) => setCopyWidth(e.nativeEvent.layout.width)}>
              {logos(0)}
            </View>
            <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {logos(1)}
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  section: {
    gap: 12,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  viewport: {
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 12,
    paddingLeft: 0,
  },
  logoTile: {
    width: 150,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  logo: {
    width: '100%',
    height: 56,
  },
}));
