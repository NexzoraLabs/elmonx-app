import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { MOTION } from '@/constants/motion';

/**
 * Underline under a tab: grows in from the centre when its tab becomes active and shrinks away when
 * it isn't. `style` is the underline in its *active* look (size + colour) — visibility is animated.
 */
export function TabIndicator({ active, style }: { active: boolean; style: StyleProp<ViewStyle> }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.set(reduceMotion ? (active ? 1 : 0) : withSpring(active ? 1 : 0, MOTION.spring.slide));
  }, [active, progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scaleX: 0.2 + 0.8 * progress.get() }],
  }));

  return <Animated.View style={[style, animatedStyle]} />;
}
