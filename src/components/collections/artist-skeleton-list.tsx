import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';

function ArtistSkeletonRow() {
  return (
    <View style={styles.row}>
      <Skeleton width={44} height={44} borderRadius={22} />
      <Skeleton width="60%" height={14} />
    </View>
  );
}

export function ArtistSkeletonList({ count = 8 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <ArtistSkeletonRow key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
});
