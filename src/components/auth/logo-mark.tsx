import { Image } from 'expo-image';

import { useAppColors } from '@/context/theme-context';
import { useTranslation } from 'react-i18next';

// White ELMONX wordmark (644×83 PNG, transparent), tinted to the theme's text colour.
const WORDMARK = require('@/assets/images/elmonx-wordmark.png');
const WORDMARK_RATIO = 644 / 83;

/** The ElmonX wordmark used in headers. `size` is the logo's height in points. */
export function LogoMark({ size = 16 }: { size?: number }) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  return (
    <Image
      source={WORDMARK}
      style={{ height: size, width: size * WORDMARK_RATIO }}
      contentFit="contain"
      tintColor={AppColors.textPrimary}
      accessibilityRole="image"
      accessibilityLabel={t('ElmonX')}
    />
  );
}
