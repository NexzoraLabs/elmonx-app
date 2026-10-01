import { useLocalSearchParams } from 'expo-router';

import { DropDetailsScreen } from '@/components/drop-detail/drop-details-screen';

/** Website `/drop/:name/:id`: a single drop. */
export default function DropDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DropDetailsScreen key={id} mode="drop" id={id} />;
}
