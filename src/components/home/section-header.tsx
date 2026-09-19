import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type SectionHeaderProps = {
  title: string;
  eyebrow?: string;
  onPressSeeAll?: () => void;
};

export function SectionHeader({ title, eyebrow, onPressSeeAll }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {onPressSeeAll ? (
        <Pressable hitSlop={8} onPress={onPressSeeAll}>
          <Ionicons name="chevron-forward" size={20} color={AppColors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  eyebrow: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
});
