import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import * as feedApi from '@/services/feed-api';
import type { RelationshipStatus } from '@/services/feed-api';
import type { PostAuthor } from '@/services/profile-api';

export type PostOptionsTarget = {
  user: PostAuthor;
  /** Root post id to report. */
  postId?: string;
};

type Props = {
  target: PostOptionsTarget | null;
  onClose: () => void;
  onBlocked: (userId: string) => void;
};

export function PostOptionsSheet({ target, onClose, onBlocked }: Props) {
  return (
    <BottomSheet visible={target !== null} onClose={onClose}>
      {target ? <OptionsContent key={target.user._id} target={target} onClose={onClose} onBlocked={onBlocked} /> : null}
    </BottomSheet>
  );
}

function followLabel(status: RelationshipStatus | null): string {
  if (status === 'Accepted') return 'Unfollow';
  if (status === 'Pending') return 'Withdraw follow request';
  return 'Follow';
}

function OptionsContent({ target, onClose, onBlocked }: Props & { target: PostOptionsTarget }) {
  const { token } = useAuth();
  const [status, setStatus] = useState<RelationshipStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'menu' | 'report'>('menu');
  const user = target.user;

  useEffect(() => {
    if (!token) return;
    let active = true;
    feedApi
      .getFollowStatus(token, user._id)
      .then((value) => active && setStatus(value))
      .catch(() => active && setStatus('None'));
    return () => {
      active = false;
    };
  }, [token, user._id]);

  const handleFollow = async () => {
    if (!token || busy || status === null) return;
    setBusy(true);
    try {
      if (status === 'Accepted' || status === 'Pending') {
        await feedApi.unfollowUser(token, user._id);
        setStatus('None');
      } else {
        setStatus(await feedApi.followUser(token, user._id));
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const handleBlock = () => {
    if (!token) return;
    Alert.alert(`Block @${user.user_name}?`, "They won't be able to see your profile or posts.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await feedApi.blockUser(token, user._id);
            onBlocked(user._id);
            onClose();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Unable to block.');
          }
        },
      },
    ]);
  };

  const handleReport = async (reason: string) => {
    if (!token || !target.postId) return;
    try {
      await feedApi.reportPost(token, target.postId, reason);
      onClose();
      Alert.alert('Reported', 'Thanks for letting us know. We will review this post.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Unable to report.');
    }
  };

  if (mode === 'report') {
    return (
      <View>
        <Text style={styles.title}>Why are you reporting this post?</Text>
        {feedApi.REPORT_REASONS.map((reason) => (
          <Pressable key={reason} style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={() => handleReport(reason)}>
            <Text style={styles.rowLabel}>{reason}</Text>
            <Ionicons name="chevron-forward" size={16} color={AppColors.textSecondary} />
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>@{user.user_name}</Text>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={handleFollow} disabled={status === null || busy}>
        <View style={styles.rowLeft}>
          <Ionicons name="person-add-outline" size={18} color={AppColors.textPrimary} />
          <Text style={styles.rowLabel}>{status === null ? 'Loading…' : followLabel(status)}</Text>
        </View>
        {busy || status === null ? <ActivityIndicator size="small" color={AppColors.textSecondary} /> : null}
      </Pressable>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={handleBlock}>
        <View style={styles.rowLeft}>
          <Ionicons name="ban-outline" size={18} color={AppColors.danger} />
          <Text style={[styles.rowLabel, styles.danger]}>Block @{user.user_name}</Text>
        </View>
      </Pressable>
      {target.postId ? (
        <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={() => setMode('report')}>
          <View style={styles.rowLeft}>
            <Ionicons name="flag-outline" size={18} color={AppColors.danger} />
            <Text style={[styles.rowLabel, styles.danger]}>Report post</Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  pressed: {
    opacity: 0.6,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    color: AppColors.textPrimary,
    fontSize: 15,
  },
  danger: {
    color: AppColors.danger,
  },
});
