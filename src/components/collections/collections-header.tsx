import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type CollectionsHeaderProps = {
  searchActive: boolean;
  onPressSearch: () => void;
  /** Hidden on the Artists tab, which has no filters on the website. */
  onPressFilter?: () => void;
  activeFilterCount: number;
};

export function CollectionsHeader({ searchActive, onPressSearch, onPressFilter, activeFilterCount }: CollectionsHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>Collections</Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search"
          hitSlop={8}
          style={[styles.button, searchActive && styles.buttonActive]}
          onPress={onPressSearch}>
          <Ionicons
            name={searchActive ? 'close' : 'search-outline'}
            size={18}
            color={searchActive ? AppColors.buttonPrimaryText : AppColors.textPrimary}
          />
        </Pressable>
        {onPressFilter ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Filters" hitSlop={8} style={styles.button} onPress={onPressFilter}>
            <Ionicons name="options-outline" size={18} color={AppColors.textPrimary} />
            {activeFilterCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
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
  title: {
    color: AppColors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: AppColors.buttonPrimaryBg,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: AppColors.link,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
