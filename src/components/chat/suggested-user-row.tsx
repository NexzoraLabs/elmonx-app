import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { makeStyles, useAppColors } from '@/context/theme-context';
import type { SuggestedUser } from '@/services/feed-api';
import { resolveAvatar } from '@/services/profile-api';
import { useTranslation } from 'react-i18next';
import { followersLabel } from '@/i18n';

export function SuggestedUserRow({ user, onPress }: { user: SuggestedUser; onPress: () => void }) {
  // Re-render on language change (the follower label is translated via i18n).
  useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress}>
      <Image source={resolveAvatar(user.profile_avatar)} style={styles.avatar} contentFit="cover" />
      <View style={styles.text}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            @{user.user_name}
          </Text>
          {user.profile_privacy === 'Private' ? (
            <Ionicons name="lock-closed" size={12} color={AppColors.textSecondary} />
          ) : null}
        </View>
        <Text style={styles.meta}>{followersLabel(user.followers_count ?? 0)}</Text>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((AppColors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.surface,
  },
  text: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  meta: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
}));
