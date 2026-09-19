import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { SuggestedUser } from '@/data/chat-mock';

export function SuggestedUserRow({ user, onPress }: { user: SuggestedUser; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress}>
      <PlaceholderThumb color={user.color} icon="person-outline" style={styles.avatar} iconSize={18} />
      <View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.meta}>Member since {user.memberSince}</Text>
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
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
