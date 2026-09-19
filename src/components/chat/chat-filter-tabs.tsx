import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

export type ChatFilter = 'All' | 'Unread' | 'Requests';

type ChatFilterTabsProps = {
  selected: ChatFilter;
  onSelect: (filter: ChatFilter) => void;
  unreadCount: number;
  requestsCount: number;
};

export function ChatFilterTabs({ selected, onSelect, unreadCount, requestsCount }: ChatFilterTabsProps) {
  const tabs: { key: ChatFilter; label: string; count?: number }[] = [
    { key: 'All', label: 'All' },
    { key: 'Unread', label: 'Unread', count: unreadCount },
    { key: 'Requests', label: 'Requests', count: requestsCount },
  ];

  return (
    <View style={styles.row}>
      <Ionicons name="options-outline" size={18} color={AppColors.textSecondary} />
      {tabs.map((tab) => {
        const isActive = tab.key === selected;
        return (
          <Pressable
            key={tab.key}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onSelect(tab.key)}>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            {tab.count ? (
              <View style={[styles.badge, isActive && styles.badgeActive]}>
                <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>{tab.count}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
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
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pillActive: {
    backgroundColor: AppColors.surface,
  },
  label: {
    color: AppColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: AppColors.textPrimary,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: AppColors.buttonPrimaryBg,
  },
  badgeText: {
    color: AppColors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: AppColors.buttonPrimaryText,
  },
});
