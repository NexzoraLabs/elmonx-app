import { Pressable, ScrollView, Text } from 'react-native';

import { makeStyles } from '@/context/theme-context';
import { useTranslation } from 'react-i18next';
import { haptic, TabIndicator } from '@/components/motion';

type CategoryTabsProps = {
  categories: readonly string[];
  selected: string;
  onSelect: (category: string) => void;
  underline?: boolean;
};

export function CategoryTabs({ categories, selected, onSelect, underline }: CategoryTabsProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.row}>
      {categories.map((category) => {
        const isActive = category === selected;
        return (
          <Pressable key={category} onPress={() => {
            if (!isActive) haptic('selection');
            onSelect(category);
          }} hitSlop={4} style={styles.tab}>
            <Text style={[styles.label, isActive && styles.labelActive]}>{t(category)}</Text>
            {underline ? (
              <TabIndicator active={isActive} style={[styles.underline, styles.underlineActive]} />
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const useStyles = makeStyles((AppColors) => ({
  scrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tab: {
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  labelActive: {
    color: AppColors.textPrimary,
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
}));
