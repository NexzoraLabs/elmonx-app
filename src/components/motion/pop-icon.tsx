import { useEffect, useRef, type ReactNode } from 'react';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { MOTION } from '@/constants/motion';

/**
 * Wraps an icon that should "pop" when it turns on — like hearts, follow checks, claimed badges.
 * Bounces only on the off → on change (not on mount, not when turning off).
 */
export function PopIcon({ active, peak = 1.35, children }: { active: boolean; peak?: number; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const wasActive = useRef(active);

  useEffect(() => {
    if (active && !wasActive.current && !reduceMotion) {
      scale.set(withSequence(withSpring(peak, MOTION.spring.pop), withSpring(1, MOTION.spring.pop)));
    }
    wasActive.current = active;
  }, [active, peak, reduceMotion, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
