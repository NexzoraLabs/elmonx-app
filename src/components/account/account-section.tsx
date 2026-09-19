import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';
import type { AccountSection as AccountSectionData } from '@/data/account-menu';

type AccountSectionProps = {
  section: AccountSectionData;
  onPressRow: (key: string) => void;
};

export function AccountSection({ section, onPressRow }: AccountSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{section.title}</Text>
      {section.rows.map((row) => (
        <Pressable
          key={row.key}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => onPressRow(row.key)}>
          <View style={styles.rowLeft}>
            <Ionicons name={row.icon} size={20} color={AppColors.textPrimary} />
            <Text style={styles.label}>{row.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={AppColors.textSecondary} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  label: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});
