import { useState, type ReactNode } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { MOTION } from '@/constants/motion';
import { haptic as playHaptic, type HapticKind } from '@/components/motion/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  children?: ReactNode | ((state: PressableStateCallbackType) => ReactNode);
  /** 'button' (default) for buttons/pills/icons, 'card' for big tiles, or an exact scale. */
  pressScale?: keyof typeof MOTION.pressScale | number;
  /** Tactile feedback on press (see haptics.ts for which kind to use). */
  haptic?: HapticKind;
};

/**
 * Drop-in `Pressable` that squishes slightly while held and springs back — the app-wide press
 * feel. Same props as Pressable (style/children may be functions of `{ pressed }`).
 */
export function PressableScale({
  pressScale = 'button',
  haptic,
  style,
  children,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: Props) {
  const reduceMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const scale = useSharedValue(1);
  const target = typeof pressScale === 'number' ? pressScale : MOTION.pressScale[pressScale];
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const state: PressableStateCallbackType = { pressed, hovered: false };
  const resolvedStyle = typeof style === 'function' ? style(state) : style;

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e: GestureResponderEvent) => {
        setPressed(true);
        if (!reduceMotion) scale.set(withSpring(target, MOTION.spring.press));
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        setPressed(false);
        scale.set(withSpring(1, MOTION.spring.press));
        onPressOut?.(e);
      }}
      onPress={(e: GestureResponderEvent) => {
        if (haptic) playHaptic(haptic);
        onPress?.(e);
      }}
      style={[resolvedStyle, animatedStyle]}>
      {typeof children === 'function' ? children(state) : children}
    </AnimatedPressable>
  );
}
