import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { compactCount } from '@/components/feed/post-card';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import * as feedApi from '@/services/feed-api';
import type { RelationshipStatus, SuggestedUser } from '@/services/feed-api';
import { resolveAvatar } from '@/services/profile-api';

function initialStatus(user: SuggestedUser): RelationshipStatus {
  if (user.relationship_status) return user.relationship_status;
  return user.is_following ? 'Accepted' : 'None';
}

export function SuggestedUsersStrip() {
  const { token } = useAuth();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [statuses, setStatuses] = useState<Record<string, RelationshipStatus>>({});

  useEffect(() => {
    let active = true;
    feedApi
      .getSuggestedUsers(token, 10)
      .then((list) => active && setUsers(list))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token]);

  if (users.length === 0) return null;

  const handleFollow = async (user: SuggestedUser) => {
    if (!token) return;
    const current = statuses[user._id] ?? initialStatus(user);
    try {
      if (current === 'Accepted' || current === 'Pending') {
        await feedApi.unfollowUser(token, user._id);
        setStatuses((prev) => ({ ...prev, [user._id]: 'None' }));
      } else {
        const next = await feedApi.followUser(token, user._id);
        setStatuses((prev) => ({ ...prev, [user._id]: next }));
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Collectors to Follow</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {users.map((user) => {
          const status = statuses[user._id] ?? initialStatus(user);
          const label = status === 'Accepted' ? 'Following' : status === 'Pending' ? 'Requested' : 'Follow';
          const active = status === 'Accepted' || status === 'Pending';
          return (
            <Pressable
              key={user._id}
              style={styles.card}
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: user.user_name } })}>
              <Image source={{ uri: resolveAvatar(user.profile_avatar) }} style={styles.avatar} contentFit="cover" />
              <Text style={styles.name} numberOfLines={1}>
                {user.user_name}
              </Text>
              <Text style={styles.followers}>{compactCount(user.followers_count)} followers</Text>
              <Pressable
                onPress={() => handleFollow(user)}
                style={({ pressed }) => [styles.followButton, active && styles.followButtonActive, pressed && styles.pressed]}>
                <Text style={[styles.followLabel, active && styles.followLabelActive]}>{label}</Text>
              </Pressable>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  row: {
    gap: 12,
    paddingHorizontal: 20,
  },
  card: {
    width: 128,
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    gap: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.border,
    marginBottom: 4,
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: '100%',
  },
  followers: {
    color: AppColors.textSecondary,
    fontSize: 11,
  },
  followButton: {
    marginTop: 6,
    alignSelf: 'stretch',
    height: 30,
    borderRadius: 15,
    backgroundColor: AppColors.buttonPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonActive: {
    backgroundColor: AppColors.border,
  },
  followLabel: {
    color: AppColors.buttonPrimaryText,
    fontSize: 12,
    fontWeight: '700',
  },
  followLabelActive: {
    color: AppColors.textPrimary,
  },
  pressed: {
    opacity: 0.7,
  },
});
