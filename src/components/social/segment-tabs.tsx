import { Pressable, StyleSheet, Text, View } from 'react-native';

import { makeStyles } from '@/context/theme-context';
import { useTranslation } from 'react-i18next';

type SegmentTabsProps = {
  options: readonly string[];
  selected: string;
  onSelect: (option: string) => void;
};

export function SegmentTabs({ options, selected, onSelect }: SegmentTabsProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isActive = option === selected;
        return (
          <Pressable key={option} style={styles.tab} onPress={() => onSelect(option)}>
            <Text style={[styles.label, isActive && styles.labelActive]}>{t(option)}</Text>
            <View style={[styles.underline, isActive && styles.underlineActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  row: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 12,
    gap: 12,
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
    width: '60%',
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  underlineActive: {
    backgroundColor: AppColors.textPrimary,
  },
}));
