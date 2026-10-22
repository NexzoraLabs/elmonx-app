/**
 * Theme palettes. Components read the active one with `useAppColors()` / `makeStyles()` from
 * `@/context/theme-context` — never import a palette directly into a component, or it won't
 * follow the light/dark switch.
 */
export const DarkColors = {
  background: '#0A0A0B',
  surface: '#17171A',
  border: '#2A2A2D',
  borderFocused: '#5C5C61',
  textPrimary: '#FFFFFF',
  textSecondary: '#9A9AA1',
  textPlaceholder: '#6B6B70',
  link: '#3D8BFF',
  buttonPrimaryBg: '#FFFFFF',
  buttonPrimaryText: '#0A0A0B',
  buttonSecondaryBorder: '#3A3A3D',
  buttonSecondaryText: '#FFFFFF',
  buttonDisabledBg: '#232326',
  buttonDisabledText: '#6B6B70',
  iconMuted: '#9A9AA1',
  danger: '#FF453A',
  success: '#34C759',
  gold: '#F5B400',
  rarityCommon: '#34C759',
  rarityRare: '#3D8BFF',
  rarityUltraRare: '#FF9F0A',
  overlay: 'rgba(0,0,0,0.6)',
  /** Faint fill/hairline on top of `surface` (chips, inactive tracks, pressed rows). */
  subtleFill: 'rgba(255,255,255,0.08)',
  /** Text/icons drawn on top of photos, video or a dark scrim — white in both themes. */
  onMedia: '#FFFFFF',
  /** Dark translucent backing behind badges/buttons that sit on photos — same in both themes. */
  mediaScrim: 'rgba(0,0,0,0.65)',
};

export type Palette = { [K in keyof typeof DarkColors]: string };

/** Mirrors the website's light theme (Tailwind grays: white page, gray-50/100 cards, gray-200 borders). */
export const LightColors: Palette = {
  background: '#FFFFFF',
  surface: '#F4F4F5',
  border: '#E4E4E7',
  borderFocused: '#A1A1AA',
  textPrimary: '#0A0A0B',
  textSecondary: '#5F5F67',
  textPlaceholder: '#9A9AA1',
  link: '#1F6FEB',
  buttonPrimaryBg: '#0A0A0B',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBorder: '#D4D4D8',
  buttonSecondaryText: '#0A0A0B',
  buttonDisabledBg: '#E4E4E7',
  buttonDisabledText: '#9A9AA1',
  iconMuted: '#71717A',
  danger: '#E5372B',
  success: '#22A447',
  gold: '#D49B00',
  rarityCommon: '#22A447',
  rarityRare: '#1F6FEB',
  rarityUltraRare: '#E68A00',
  overlay: 'rgba(0,0,0,0.4)',
  subtleFill: 'rgba(0,0,0,0.05)',
  onMedia: '#FFFFFF',
  mediaScrim: 'rgba(0,0,0,0.65)',
};

export type AppColor = keyof Palette;
