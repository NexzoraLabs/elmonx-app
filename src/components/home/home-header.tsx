import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import type { DrawerNavigationProp } from 'expo-router/drawer';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UserAvatar } from '@/components/account/user-avatar';
import { LogoMark } from '@/components/auth/logo-mark';
import { makeStyles, useAppColors, useTheme } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import { getUnreadCount } from '@/services/notifications-api';
import { useTranslation } from 'react-i18next';

type HomeHeaderProps = {
  /**
   * 'main' (default): menu + wordmark on the left (home tabs).
   * 'back': only a back button on the left (e.g. My Account); the right-side actions are the same,
   * except the avatar opens Personal Information instead of My Account.
   */
  variant?: 'main' | 'back';
};

export function HomeHeader({ variant = 'main' }: HomeHeaderProps) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const navigation = useNavigation<DrawerNavigationProp<Record<string, object | undefined>>>();
  const { token, user } = useAuth();
  const { isDark, toggleMode } = useTheme();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!token) return;
    getUnreadCount(token)
      .then(setUnread)
      .catch(() => {});
  }, [token]);

  return (
    <View style={styles.row}>
      {variant === 'back' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Go back')}
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
      ) : (
        // Menu + wordmark together on the left; actions stay on the right.
        <View style={styles.brand}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Open menu')}
            hitSlop={8}
            onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu-outline" size={24} color={AppColors.textPrimary} />
          </Pressable>
          <LogoMark size={14} />
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isDark ? t('Switch to light theme') : t('Switch to dark theme')}
          hitSlop={8}
          onPress={toggleMode}>
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={AppColors.textPrimary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Notifications')}
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
          accessibilityLabel={variant === 'back' ? t('Personal information') : t('Open account')}
          hitSlop={8}
          onPress={() => router.push(variant === 'back' ? '/personal-info' : '/account')}>
          <UserAvatar user={user} size={26} />
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    // Thin divider so the pinned header reads as separate from the scrolling content.
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
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
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
}));
