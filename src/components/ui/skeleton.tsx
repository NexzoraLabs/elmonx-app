import { useEffect } from 'react';
import { type DimensionValue } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { AppColors } from '@/constants/app-colors';

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: object;
};

export function Skeleton({ width = '100%', height, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.set(withRepeat(withTiming(0.85, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true));
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: AppColors.surface }, animatedStyle, style]}
    />
  );
}

