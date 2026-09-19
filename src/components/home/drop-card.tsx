import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LogoMark } from '@/components/auth/logo-mark';
import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { DropItem } from '@/data/home-mock';

export function DropCard({ item }: { item: DropItem }) {
  return (
    <View style={styles.card}>
      <View style={styles.thumbWrapper}>
        <PlaceholderThumb color={item.color} icon="sparkles-outline" iconSize={30} style={styles.thumb} />
        <View style={styles.logoOverlay}>
          <LogoMark size={9} />
        </View>
      </View>
      <Pressable style={styles.notifyButton}>
        <Text style={styles.notifyLabel}>Notify Me</Text>
      </Pressable>
      <Text style={styles.expected}>Expected {item.expected}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
  },
  thumbWrapper: {
    width: 150,
    height: 150,
  },
  thumb: {
    width: 150,
    height: 150,
    borderRadius: 16,
  },
  logoOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  notifyButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.buttonSecondaryBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  notifyLabel: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  expected: {
    color: AppColors.textSecondary,
    fontSize: 11,
    marginTop: 8,
  },
});
