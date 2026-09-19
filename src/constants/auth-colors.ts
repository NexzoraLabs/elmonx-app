export const AuthColors = {
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
} as const;

export type AuthColor = keyof typeof AuthColors;
