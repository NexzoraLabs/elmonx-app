import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CommunityHeader } from '@/components/social/community-header';
import { CommunityPostCard } from '@/components/home/community-post-card';
import { CreatePostPrompt } from '@/components/social/create-post-prompt';
import { SegmentTabs } from '@/components/social/segment-tabs';
import { AppColors } from '@/constants/app-colors';
import { COMMUNITY_POSTS } from '@/data/home-mock';

const SEGMENTS = ['For you', 'Following'] as const;

export default function SocialScreen() {
  const [segment, setSegment] = useState<(typeof SEGMENTS)[number]>('For you');

  const posts =
    segment === 'For you' ? COMMUNITY_POSTS : COMMUNITY_POSTS.filter((post) => post.isFollowing);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CommunityHeader onPressCompose={() => {}} />
      <SegmentTabs
        options={SEGMENTS}
        selected={segment}
        onSelect={(option) => setSegment(option as (typeof SEGMENTS)[number])}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {segment === 'For you' ? <CreatePostPrompt onPress={() => {}} /> : null}

        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={28} color={AppColors.textSecondary} />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySubtitle}>
              Posts from people you follow will show up here.
            </Text>
          </View>
        ) : (
          posts.map((post) => <CommunityPostCard key={post.id} post={post} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: AppColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
});
