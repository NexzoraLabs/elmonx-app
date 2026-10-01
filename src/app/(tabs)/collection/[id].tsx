import { useLocalSearchParams } from 'expo-router';

import { DropDetailsScreen } from '@/components/drop-detail/drop-details-screen';

/** Website `/collection/:name/:id`: every drop in the collection, stacked. */
export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DropDetailsScreen key={id} mode="collection" id={id} />;
}
