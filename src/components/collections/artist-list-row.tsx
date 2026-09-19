import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { Artist } from '@/data/artists-mock';

export function ArtistListRow({ artist }: { artist: Artist }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => router.push(`/artist/${artist.id}`)}>
      <PlaceholderThumb color={artist.color} icon="person-outline" style={styles.avatar} iconSize={18} />
      <Text style={styles.name} numberOfLines={1}>
        {artist.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  name: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});
