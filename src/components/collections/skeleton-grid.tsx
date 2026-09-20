import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';

function SkeletonCard({ layout }: { layout: 'grid' | 'single' }) {
  const isSingle = layout === 'single';
  return (
    <View style={isSingle ? styles.cardSingle : styles.cardGrid}>
      <Skeleton style={isSingle ? styles.thumbSingle : styles.thumbGrid} borderRadius={14} />
      <Skeleton width="70%" height={13} style={styles.titleLine} />
      <Skeleton width="45%" height={11} style={styles.dateLine} />
    </View>
  );
}

export function SkeletonGrid({ layout = 'grid', count = 6 }: { layout?: 'grid' | 'single'; count?: number }) {
  return (
    <View style={layout === 'single' ? styles.list : styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} layout={layout} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 20,
  },
  cardGrid: {
    width: '48%',
  },
  cardSingle: {
    width: '100%',
  },
  thumbGrid: {
    width: '100%',
    aspectRatio: 0.85,
  },
  thumbSingle: {
    width: '100%',
    aspectRatio: 1.6,
  },
  titleLine: {
    marginTop: 8,
  },
  dateLine: {
    marginTop: 6,
  },
});
