import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import type { DrawerNavigationProp } from 'expo-router/drawer';
import { Pressable, StyleSheet, View } from 'react-native';

import { LogoMark } from '@/components/auth/logo-mark';
import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import { CURRENT_USER_ID, PROFILES } from '@/data/profile-mock';

export function HomeHeader() {
  const navigation = useNavigation<DrawerNavigationProp<Record<string, object | undefined>>>();
  const currentUser = PROFILES[CURRENT_USER_ID];

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        hitSlop={8}
        onPress={() => navigation.openDrawer()}>
        <Ionicons name="menu-outline" size={24} color={AppColors.textPrimary} />
      </Pressable>

      <LogoMark size={14} />

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" hitSlop={8}>
          <Ionicons name="add-circle-outline" size={22} color={AppColors.textPrimary} />
        </Pressable>
        <Pressable accessibilityRole="button" hitSlop={8}>
          <Ionicons name="search-outline" size={22} color={AppColors.textPrimary} />
        </Pressable>
        <Pressable accessibilityRole="button" hitSlop={8}>
          <Ionicons name="notifications-outline" size={22} color={AppColors.textPrimary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          hitSlop={8}
          onPress={() => router.push(`/profile/${CURRENT_USER_ID}`)}>
          <PlaceholderThumb
            color={currentUser.avatarColor}
            icon="person-outline"
            style={styles.profileAvatar}
            iconSize={14}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
});
