import { useLocalSearchParams } from 'expo-router';

import { PostDetailScreen } from '@/components/feed/post-detail-screen';

/** Website `/post/repost/:id` (a repost's own page). */
export default function RepostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PostDetailScreen id={id} isRepost />;
}
