import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  pointsLabel: string;
  extra?: ReactNode;
  children: ReactNode;
};

export function RewardIconRow({ icon, title, description, pointsLabel, extra, children }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.iconBadge}>
          <Ionicons name={icon} size={18} color={AppColors.link} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
          {extra}
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.points}>{pointsLabel}</Text>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(61,139,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    color: AppColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  points: {
    color: AppColors.success,
    fontSize: 14,
    fontWeight: '700',
  },
});
