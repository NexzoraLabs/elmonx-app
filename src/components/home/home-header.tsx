import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import type { DrawerNavigationProp } from 'expo-router/drawer';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UserAvatar } from '@/components/account/user-avatar';
import { LogoMark } from '@/components/auth/logo-mark';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import { getUnreadCount } from '@/services/notifications-api';

export function HomeHeader() {
  const navigation = useNavigation<DrawerNavigationProp<Record<string, object | undefined>>>();
  const { token, user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!token) return;
    getUnreadCount(token)
      .then(setUnread)
      .catch(() => {});
  }, [token]);

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={8}
          onPress={() => { router.push('/notifications'); setUnread(0); }}>
          <View>
            <Ionicons name="notifications-outline" size={22} color={AppColors.textPrimary} />
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 99 ? '99+' : String(unread)}</Text>
              </View>
            )}
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open account"
          hitSlop={8}
          onPress={() => router.push('/account')}>
          <UserAvatar user={user} size={26} />
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
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: AppColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },
});
