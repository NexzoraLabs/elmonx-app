import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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

import { DarkColors, LightColors } from '@/constants/app-colors';
import { LAUNCH_SYSTEM_MODE, useTheme } from '@/context/theme-context';
import { useTranslation } from 'react-i18next';

const X_LOGO = require('@/assets/images/splash-icon.png');
const WORDMARK = require('@/assets/images/elmonx-wordmark.png');

// Must match the native splash image (X 76pt, 12pt gap, ELMONX wordmark 18pt tall — 140×106 in
// iOS SplashScreenLogo / Android splashscreen_logo) so the hand-off is seamless.
const LOGO_SIZE = 76;
const GAP = 12;
const WORDMARK_HEIGHT = 18;
const WORDMARK_WIDTH = WORDMARK_HEIGHT * (644 / 83);

const ROTATION_MS = 12000; // one full, very slow turn
const BREATHE_MS = 1800; // each half of the gentle zoom in/out
const BREATHE_SCALE = 1.05;
const THEME_BLEND_MS = 350;
const MIN_VISIBLE_MS = 900;
const FADE_OUT_MS = 400;

/**
 * Animated continuation of the native splash: the X slowly turns and "breathes" above the ELMONX
 * wordmark until the app is ready, then fades out.
 *
 * The native splash can only follow the phone's light/dark setting, not the in-app theme, so this
 * starts in the phone's colours (identical to the native splash) and cross-fades to the app's chosen
 * theme. When the two match there is nothing to blend.
 */
export function AnimatedSplash({ ready }: { ready: boolean }) {
  const { t } = useTranslation();
  const { mode } = useTheme();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  // 0 = launch (phone) colours, 1 = app theme colours.
  const blend = useSharedValue(mode === LAUNCH_SYSTEM_MODE ? 1 : 0);

  const launchColors = LAUNCH_SYSTEM_MODE === 'dark' ? DarkColors : LightColors;
  const appColors = mode === 'dark' ? DarkColors : LightColors;

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), MIN_VISIBLE_MS);
    blend.value = withTiming(1, { duration: THEME_BLEND_MS, easing: Easing.inOut(Easing.quad) });
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
  }, [reduceMotion, rotation, scale, blend]);

  useEffect(() => {
    if (!ready || !minTimePassed) return;
    opacity.value = withTiming(0, { duration: FADE_OUT_MS, easing: Easing.out(Easing.quad) }, (finished) => {
      'worklet';
      if (finished) scheduleOnRN(setVisible, false);
    });
  }, [ready, minTimePassed, opacity]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const appLayerStyle = useAnimatedStyle(() => ({ opacity: blend.value }));
  const spinStyle = useAnimatedStyle(() => ({
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
      <View style={[StyleSheet.absoluteFill, { backgroundColor: launchColors.background }]} />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: appColors.background }, appLayerStyle]} />

      <View style={styles.column} accessibilityLabel={t('ElmonX')}>
        <Animated.View style={[styles.logo, spinStyle]}>
          <Image source={X_LOGO} style={StyleSheet.absoluteFill} contentFit="contain" tintColor={launchColors.textPrimary} />
          <Animated.View style={[StyleSheet.absoluteFill, appLayerStyle]}>
            <Image source={X_LOGO} style={StyleSheet.absoluteFill} contentFit="contain" tintColor={appColors.textPrimary} />
          </Animated.View>
        </Animated.View>
        <View style={styles.wordmark}>
          <Image source={WORDMARK} style={StyleSheet.absoluteFill} contentFit="contain" tintColor={launchColors.textPrimary} />
          <Animated.View style={[StyleSheet.absoluteFill, appLayerStyle]}>
            <Image source={WORDMARK} style={StyleSheet.absoluteFill} contentFit="contain" tintColor={appColors.textPrimary} />
          </Animated.View>
        </View>
      </View>
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
    zIndex: 1000,
  },
  column: {
    alignItems: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  wordmark: {
    width: WORDMARK_WIDTH,
    height: WORDMARK_HEIGHT,
    marginTop: GAP,
  },
});
