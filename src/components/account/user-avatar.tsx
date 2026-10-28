import { Image } from 'expo-image';

import { makeStyles } from '@/context/theme-context';
import type { UserData } from '@/services/auth-api';
import { DEFAULT_AVATAR, isRealAvatar } from '@/services/profile-api';

type Props = {
  user: UserData | null;
  size: number;
};

export function UserAvatar({ user, size }: Props) {
  const styles = useStyles();
  const avatarUrl = [user?.profile_avatar_url, user?.profile_avatar].find(isRealAvatar);
  const shape = { width: size, height: size, borderRadius: size / 2 };

  return (
    <Image
      cachePolicy="memory-disk"
      source={avatarUrl ?? DEFAULT_AVATAR}
      style={[styles.image, shape]}
      contentFit="cover"
    />
  );
}

const useStyles = makeStyles((AppColors) => ({
  image: {
    backgroundColor: AppColors.surface,
  },
}));
