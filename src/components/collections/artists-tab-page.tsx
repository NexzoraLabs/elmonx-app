import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { ArtistListRow } from '@/components/collections/artist-list-row';
import { ArtistSkeletonList } from '@/components/collections/artist-skeleton-list';
import { makeStyles } from '@/context/theme-context';
import { fetchBrands, type Brand } from '@/services/brands-api';
import { useTranslation } from 'react-i18next';
import { Appear } from '@/components/motion';

/** Parent remounts this (via `key`) when the search changes, so it loads once per search. */
export function ArtistsTabPage({ search = '' }: { search?: string }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchBrands(search)
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
  }, [search]);

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
        <Text style={styles.emptyText}>{t('Couldn\'t load artists. Pull to try again later.')}</Text>
      </View>
    );
  }

  if (brands.length === 0) {
    return (
      <View style={[styles.page, styles.center]}>
        <Text style={styles.emptyText}>{search.trim() ? t('No artists found for "{{search}}".', { search: search.trim() }) : t('Nothing here yet.')}</Text>
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
      renderItem={({ item, index }) => (
        <Appear index={index}>
          <ArtistListRow brand={item} />
        </Appear>
      )}
    />
  );
}

const useStyles = makeStyles((AppColors) => ({
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
}));
