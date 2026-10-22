import { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { MOTION } from '@/constants/motion';

/**
 * Celebratory bounce for an icon (like heart, follow check, claimed badge): `pop()` scales it up and
 * springs it back. Apply `style` to an `Animated.View` around the icon.
 */
export function usePop(peak = 1.3) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const pop = () => {
    if (reduceMotion) return;
    scale.set(withSequence(withSpring(peak, MOTION.spring.pop), withSpring(1, MOTION.spring.pop)));
  };
  return { style, pop };
}
