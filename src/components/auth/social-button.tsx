import { Ionicons } from '@expo/vector-icons';

import { useAppColors } from '@/context/theme-context';

import { AuthButton } from './auth-button';
import { GoogleIcon } from './google-icon';
import { useTranslation } from 'react-i18next';

type SocialProvider = 'google' | 'apple';

type SocialButtonProps = {
  provider: SocialProvider;
  onPress: () => void;
  disabled?: boolean;
};

export function SocialButton({ provider, onPress, disabled }: SocialButtonProps) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const label = provider === 'google' ? t('Continue with Google') : t('Continue with Apple');
  const icon =
    provider === 'google' ? (
      <GoogleIcon size={18} />
    ) : (
      <Ionicons name="logo-apple" size={20} color={AppColors.textPrimary} />
    );

  return <AuthButton label={label} variant="secondary" icon={icon} onPress={onPress} disabled={disabled} />;
}
