import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArtistWaveHeader } from '@/components/collections/artist-wave-header';
import { AppColors } from '@/constants/app-colors';
import { ARTISTS } from '@/data/artists-mock';

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const artist = ARTISTS.find((item) => item.id === id);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ArtistWaveHeader color={artist?.color ?? AppColors.surface} />
        <Text style={styles.name}>{artist?.name ?? 'Unknown Artist'}</Text>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Artist Details</Text>
          <Text style={styles.bio}>{artist?.bio ?? 'No details available for this artist yet.'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  backButton: {
    marginTop: 8,
    marginLeft: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  detailsCard: {
    marginTop: 24,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  detailsTitle: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  bio: {
    color: AppColors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});
