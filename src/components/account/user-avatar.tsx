import { Image } from 'expo-image';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { makeStyles, useAppColors } from '@/context/theme-context';
import type { UserData } from '@/services/auth-api';
import { isImageUrl } from '@/services/profile-api';

type Props = {
  user: UserData | null;
  size: number;
};

export function UserAvatar({ user, size }: Props) {
  const AppColors = useAppColors();
  const styles = useStyles();
  const avatarUrl = [user?.profile_avatar_url, user?.profile_avatar].find(
    (url) => isImageUrl(url) && url !== 'images/avatar/default.png'
  );
  const shape = { width: size, height: size, borderRadius: size / 2 };

  return avatarUrl ? (
    <Image cachePolicy="memory-disk" source={{ uri: avatarUrl }} style={[styles.image, shape]} contentFit="cover" />
  ) : (
    <PlaceholderThumb color={AppColors.surface} icon="person-outline" style={shape} iconSize={size * 0.45} />
  );
}

const useStyles = makeStyles((AppColors) => ({
  image: {
    backgroundColor: AppColors.surface,
  },
}));
