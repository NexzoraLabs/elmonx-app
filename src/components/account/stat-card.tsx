import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  delta?: string;
};

export function StatCard({ icon, iconColor, label, value, delta }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Ionicons name={icon} size={18} color={iconColor} />
        <Text style={styles.value}>{value}</Text>
        {delta ? <Text style={styles.delta}>{delta}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  label: {
    color: AppColors.textSecondary,
    fontSize: 12,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  value: {
    color: AppColors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  delta: {
    color: AppColors.success,
    fontSize: 11,
    fontWeight: '600',
  },
});
