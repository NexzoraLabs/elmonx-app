import { useLocalSearchParams } from 'expo-router';

import { PostDetailScreen } from '@/components/feed/post-detail-screen';

/** Website `/post/:id`. */
export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PostDetailScreen id={id} isRepost={false} />;
}
