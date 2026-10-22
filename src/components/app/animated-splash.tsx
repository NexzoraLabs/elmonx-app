import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { AppColors } from '@/constants/app-colors';

// Must match the native splash (iOS SplashScreen.storyboard / Android splashscreen_logo) so the
// hand-off from the static native splash to this animated one is seamless.
const LOGO_SIZE = 76;
const ROTATION_MS = 12000; // one full, very slow turn
const BREATHE_MS = 1800; // each half of the gentle zoom in/out
const BREATHE_SCALE = 1.05;
const MIN_VISIBLE_MS = 900;
const FADE_OUT_MS = 400;

/**
 * Animated continuation of the native splash: the white ElmonX X slowly turns and "breathes"
 * until the app is ready (`ready`, e.g. auth restored), then fades out and unmounts.
 */
export function AnimatedSplash({ ready }: { ready: boolean }) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), MIN_VISIBLE_MS);
    if (!reduceMotion) {
      rotation.value = withRepeat(withTiming(360, { duration: ROTATION_MS, easing: Easing.linear }), -1, false);
      scale.value = withRepeat(
        withSequence(
          withTiming(BREATHE_SCALE, { duration: BREATHE_MS, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: BREATHE_MS, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    }
    return () => {
      clearTimeout(timer);
      cancelAnimation(rotation);
      cancelAnimation(scale);
    };
  }, [reduceMotion, rotation, scale]);

  useEffect(() => {
    if (!ready || !minTimePassed) return;
    opacity.value = withTiming(0, { duration: FADE_OUT_MS, easing: Easing.out(Easing.quad) }, (finished) => {
      'worklet';
      if (finished) scheduleOnRN(setVisible, false);
    });
  }, [ready, minTimePassed, opacity]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.overlay, overlayStyle]}
      pointerEvents={ready ? 'none' : 'auto'}
      // Our overlay is now drawn on top, so the static native splash can go without a flash.
      onLayout={() => {
        void SplashScreen.hideAsync();
      }}>
      <Animated.View style={logoStyle}>
        <Image
          source={require('@/assets/images/splash-icon.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="ElmonX"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.background,
    zIndex: 1000,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
