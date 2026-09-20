import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { ArtistListRow } from '@/components/collections/artist-list-row';
import { ArtistSkeletonList } from '@/components/collections/artist-skeleton-list';
import { AppColors } from '@/constants/app-colors';
import { fetchBrands, type Brand } from '@/services/brands-api';

export function ArtistsTabPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchBrands()
      .then((data) => {
        if (cancelled) return;
        setBrands(data);
        setError(false);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.page}>
        <ArtistSkeletonList />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.page, styles.center]}>
        <Text style={styles.emptyText}>Couldn&apos;t load artists. Pull to try again later.</Text>
      </View>
    );
  }

  if (brands.length === 0) {
    return (
      <View style={[styles.page, styles.center]}>
        <Text style={styles.emptyText}>Nothing here yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.flexFill}
      data={brands}
      keyExtractor={(item) => item._id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => <ArtistListRow brand={item} />}
    />
  );
}

const styles = StyleSheet.create({
  flexFill: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
