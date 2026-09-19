import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

export type ProfileTab = 'posts' | 'reposts';

type ProfileTabsProps = {
  selected: ProfileTab;
  onSelect: (tab: ProfileTab) => void;
};

export function ProfileTabs({ selected, onSelect }: ProfileTabsProps) {
  return (
    <View style={styles.row}>
      <Tab
        icon="reader-outline"
        isActive={selected === 'posts'}
        onPress={() => onSelect('posts')}
      />
      <Tab
        icon="repeat-outline"
        isActive={selected === 'reposts'}
        onPress={() => onSelect('reposts')}
      />
    </View>
  );
}

function Tab({
  icon,
  isActive,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.tab} onPress={onPress}>
      <Ionicons name={icon} size={20} color={isActive ? AppColors.textPrimary : AppColors.textSecondary} />
      <View style={[styles.underline, isActive && styles.underlineActive]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 12,
    width: 60,
    gap: 8,
  },
  underline: {
    height: 2,
    width: '100%',
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  underlineActive: {
    backgroundColor: AppColors.textPrimary,
  },
});
