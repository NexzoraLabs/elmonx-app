import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';

type ConversationHeaderProps = {
  name: string;
  username: string;
  avatarColor: string;
  onPressMenu: () => void;
};

export function ConversationHeader({ name, username, avatarColor, onPressMenu }: ConversationHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
      </Pressable>

      <PlaceholderThumb color={avatarColor} icon="person-outline" style={styles.avatar} iconSize={16} />

      <View style={styles.nameBlock}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.username} numberOfLines={1}>
          {username}
        </Text>
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="More options" hitSlop={8} onPress={onPressMenu}>
        <Ionicons name="ellipsis-horizontal" size={20} color={AppColors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  username: {
    color: AppColors.textSecondary,
    fontSize: 11,
  },
});
