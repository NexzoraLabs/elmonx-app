import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type ProfileStatsRowProps = {
  postCount: number;
  followersCount: string;
  followingCount: number;
};

export function ProfileStatsRow({ postCount, followersCount, followingCount }: ProfileStatsRowProps) {
  return (
    <View style={styles.row}>
      <Stat value={String(postCount)} label="Post" />
      <Stat value={followersCount} label="Followers" />
      <Stat value={String(followingCount)} label="Followings" />
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 32,
  },
  stat: {},
  value: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
