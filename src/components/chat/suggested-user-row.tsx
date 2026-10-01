import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';
import type { SuggestedUser } from '@/services/feed-api';
import { resolveAvatar } from '@/services/profile-api';

export function SuggestedUserRow({ user, onPress }: { user: SuggestedUser; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress}>
      <Image source={{ uri: resolveAvatar(user.profile_avatar) }} style={styles.avatar} contentFit="cover" />
      <View style={styles.text}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            @{user.user_name}
          </Text>
          {user.profile_privacy === 'Private' ? (
            <Ionicons name="lock-closed" size={12} color={AppColors.textSecondary} />
          ) : null}
        </View>
        <Text style={styles.meta}>{user.followers_count ?? 0} followers</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
});
