import { Pressable, Text, View } from 'react-native';

import { makeStyles } from '@/context/theme-context';
import { useTranslation } from 'react-i18next';

// The backend has no message requests, so there is no "Requests" filter.
export type ChatFilter = 'All' | 'Unread';

type ChatFilterTabsProps = {
  selected: ChatFilter;
  onSelect: (filter: ChatFilter) => void;
  unreadCount: number;
};

export function ChatFilterTabs({ selected, onSelect, unreadCount }: ChatFilterTabsProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const tabs: { key: ChatFilter; label: string; count?: number }[] = [
    { key: 'All', label: t('All') },
    { key: 'Unread', label: t('Unread'), count: unreadCount },
  ];

  return (
    <View style={styles.row}>
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

const useStyles = makeStyles((AppColors) => ({
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
}));
