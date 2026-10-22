import { Easing, ReduceMotion } from 'react-native-reanimated';

/**
 * ElmonX motion tokens — the ONLY timings/springs UI code should use, so every screen moves the same
 * way. Primitives live in `components/motion/`; see CLAUDE.md "Motion system".
 *
 * Feel: quick and springy, never slow. Things rise in from slightly below, presses squish a little,
 * likes pop. All of it is skipped when the phone has Reduce Motion on.
 */
export const MOTION = {
  duration: {
    fast: 140,
    base: 240,
    slow: 380,
  },
  easing: {
    out: Easing.out(Easing.cubic),
    inOut: Easing.inOut(Easing.cubic),
  },
  spring: {
    /** Press in / out (buttons, cards). */
    press: { damping: 18, stiffness: 340, mass: 0.6 },
    /** Celebratory bounce (like, claim). */
    pop: { damping: 9, stiffness: 280, mass: 0.6 },
    /** Indicators that slide between positions (tab underline). */
    slide: { damping: 22, stiffness: 260, mass: 0.8 },
  },
  /** Scale while pressed: buttons/pills squish more than big cards. */
  pressScale: { button: 0.96, card: 0.98 },
  /** List / grid entrance: items rise this far and are staggered by this delay. */
  enterOffset: 14,
  stagger: 45,
  /** Only the first screenful is staggered; later items (pagination, scroll-back) just fade in. */
  staggerMax: 10,
  reduceMotion: ReduceMotion.System,
} as const;
