import { Ionicons } from '@expo/vector-icons';

import { AuthButton } from './auth-button';
import { GoogleIcon } from './google-icon';

type SocialProvider = 'google' | 'apple';

type SocialButtonProps = {
  provider: SocialProvider;
  onPress: () => void;
};

export function SocialButton({ provider, onPress }: SocialButtonProps) {
  const label = provider === 'google' ? 'Continue with Google' : 'Continue with Apple';
  const icon =
    provider === 'google' ? (
      <GoogleIcon size={18} />
    ) : (
      <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
    );

  return <AuthButton label={label} variant="secondary" icon={icon} onPress={onPress} />;
}
