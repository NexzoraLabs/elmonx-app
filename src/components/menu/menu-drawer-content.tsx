import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { DrawerContentComponentProps } from 'expo-router/drawer';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/app-colors';
import { ACCOUNT_MENU_ITEMS, MARKET_MENU_ITEMS, type MenuItem } from '@/data/menu-items';

type Segment = 'account' | 'market';

export function MenuDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState<Segment>('account');
  const items = segment === 'account' ? ACCOUNT_MENU_ITEMS : MARKET_MENU_ITEMS;

  const handlePressItem = (item: MenuItem) => {
    props.navigation.closeDrawer();
    if (item.key === 'profile') {
      router.push('/account');
    }
    // TODO: wire up the remaining destinations once those screens are designed.
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Menu</Text>

      <View style={styles.segmentRow}>
        <Pressable
          style={[styles.segment, segment === 'account' && styles.segmentActive]}
          onPress={() => setSegment('account')}>
          <Ionicons
            name="person-outline"
            size={16}
            color={segment === 'account' ? AppColors.textPrimary : AppColors.textSecondary}
          />
          <Text style={[styles.segmentLabel, segment === 'account' && styles.segmentLabelActive]}>
            Account
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, segment === 'market' && styles.segmentActive]}
          onPress={() => setSegment('market')}>
          <Ionicons
            name="storefront-outline"
            size={16}
            color={segment === 'market' ? AppColors.textPrimary : AppColors.textSecondary}
          />
          <Text style={[styles.segmentLabel, segment === 'market' && styles.segmentLabelActive]}>
            Market
          </Text>
        </Pressable>
      </View>

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
});
