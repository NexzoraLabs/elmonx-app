import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import type { DrawerContentComponentProps } from 'expo-router/drawer';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserAvatar } from '@/components/account/user-avatar';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import { ACCOUNT_MENU_ITEMS, type MenuItem } from '@/data/menu-items';

type Segment = 'account' | 'market';

// Temporary: these menu items open the public website until dedicated in-app
// screens exist for them.
const MENU_ITEM_URLS: Record<string, string> = {
  explorer: 'https://elmonx.com/explorer',
  community: 'https://elmonx.com/feed',
  blogs: 'https://elmonx.com/articles',
  news: 'https://elmonx.com/news',
  faqs: 'https://elmonx.com/faqs',
  privacy: 'https://elmonx.com/privacy-policy',
  terms: 'https://elmonx.com/terms-and-conditions',
};

export function MenuDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState<Segment>('account');
  const items = ACCOUNT_MENU_ITEMS;
  const { user, signOut } = useAuth();

  const handlePressItem = (item: MenuItem) => {
    props.navigation.closeDrawer();
    if (item.key === 'profile') {
      router.push('/account');
      return;
    }
    const url = MENU_ITEM_URLS[item.key];
    if (url) {
      WebBrowser.openBrowserAsync(url);
    }
  };

  const handleLogOut = async () => {
    props.navigation.closeDrawer();
    await signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Menu</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {items.map((item) => (
          <Pressable
            key={item.key}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={() => handlePressItem(item)}>
            <View style={styles.itemLeft}>
              <Ionicons name={item.icon} size={20} color={AppColors.textPrimary} />
              <Text style={styles.itemLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={AppColors.textSecondary} />
          </Pressable>
        ))}
      </ScrollView>

      {user ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.userRow}>
            <UserAvatar user={user} size={40} />
            <View style={styles.userText}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.user_name}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user.email_address}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Log out"
              hitSlop={10}
              style={({ pressed }) => [styles.logOutButton, pressed && styles.itemPressed]}
              onPress={handleLogOut}>
              <Ionicons name="log-out-outline" size={22} color={AppColors.danger} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingHorizontal: 20,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: AppColors.border,
  },
  segmentLabel: {
    color: AppColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentLabelActive: {
    color: AppColors.textPrimary,
  },
  list: {
    paddingBottom: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  itemPressed: {
    opacity: 0.6,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  itemLabel: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.border,
    paddingTop: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userText: {
    flex: 1,
  },
  userName: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  userEmail: {
    color: AppColors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  logOutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surface,
  },
});
