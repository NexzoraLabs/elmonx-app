import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { UserData } from '@/services/auth-api';
import { isImageUrl } from '@/services/profile-api';

type Props = {
  user: UserData | null;
  size: number;
};

export function UserAvatar({ user, size }: Props) {
  const avatarUrl = [user?.profile_avatar_url, user?.profile_avatar].find(
    (url) => isImageUrl(url) && url !== 'images/avatar/default.png'
  );
  const shape = { width: size, height: size, borderRadius: size / 2 };

  return avatarUrl ? (
    <Image source={{ uri: avatarUrl }} style={[styles.image, shape]} contentFit="cover" />
  ) : (
    <PlaceholderThumb color={AppColors.surface} icon="person-outline" style={shape} iconSize={size * 0.45} />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: AppColors.surface,
  },
});
