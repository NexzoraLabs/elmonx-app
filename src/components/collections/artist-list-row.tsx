import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { Brand } from '@/services/brands-api';

export function ArtistListRow({ brand }: { brand: Brand }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() =>
        router.push({
          pathname: '/artist/[id]',
          params: { id: brand._id, name: brand.title, image: brand.image ?? '', description: brand.description ?? '' },
        })
      }>
      {brand.image ? (
        <Image source={{ uri: brand.image }} style={styles.avatar} contentFit="cover" transition={150} />
      ) : (
        <PlaceholderThumb color="#1B1F2E" icon="person-outline" style={styles.avatar} iconSize={18} />
      )}
      <Text style={styles.name} numberOfLines={1}>
        {brand.title}
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
