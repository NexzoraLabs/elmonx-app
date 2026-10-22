import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { MOTION } from '@/constants/motion';

/**
 * Entrance for the `index`-th item of a list/grid/section: rises in from slightly below, staggered
 * over the first screenful (later items — next page, scroll-back — just fade in quickly).
 * Use as `entering={enterAt(index)}` on an `Animated.View`, or through `<Appear>`.
 */
export function enterAt(index = 0) {
  if (index >= MOTION.staggerMax) {
    return FadeIn.duration(MOTION.duration.fast).reduceMotion(MOTION.reduceMotion);
  }
  return FadeInDown.duration(MOTION.duration.base)
    .delay(index * MOTION.stagger)
    .easing(MOTION.easing.out)
    .withInitialValues({ transform: [{ translateY: MOTION.enterOffset }] })
    .reduceMotion(MOTION.reduceMotion);
}

type AppearProps = {
  /** Position in its list/section — drives the stagger. 0 = no delay. */
  index?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** Wrapper that plays the standard entrance once when it mounts. */
export function Appear({ index = 0, style, children }: AppearProps) {
  return (
    <Animated.View entering={enterAt(index)} style={style}>
      {children}
    </Animated.View>
  );
}
