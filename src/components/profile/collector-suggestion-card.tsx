import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { CollectorSuggestion } from '@/data/profile-mock';

export function CollectorSuggestionCard({ suggestion }: { suggestion: CollectorSuggestion }) {
  const [following, setFollowing] = useState(false);

  return (
    <View style={styles.card}>
      <PlaceholderThumb color={suggestion.color} icon="person-outline" style={styles.avatar} iconSize={20} />
      <Text style={styles.name} numberOfLines={1}>
        {suggestion.name}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        Member since {suggestion.memberSince}
      </Text>
      <Pressable
        style={[styles.followButton, following && styles.followButtonActive]}
        onPress={() => setFollowing((prev) => !prev)}>
        <Text style={[styles.followLabel, following && styles.followLabelActive]}>
          {following ? 'Following' : 'Follow'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 108,
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  meta: {
    color: AppColors.textSecondary,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  followButton: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: AppColors.buttonPrimaryBg,
  },
  followButtonActive: {
    backgroundColor: AppColors.border,
  },
  followLabel: {
    color: AppColors.buttonPrimaryText,
    fontSize: 11,
    fontWeight: '700',
  },
  followLabelActive: {
    color: AppColors.textPrimary,
  },
});
