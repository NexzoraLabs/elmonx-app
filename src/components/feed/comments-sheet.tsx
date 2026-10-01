import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { timeAgo } from '@/components/feed/post-card';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import * as feedApi from '@/services/feed-api';
import type { CommentTarget, PostComment } from '@/services/feed-api';
import { resolveAvatar } from '@/services/profile-api';

const MAX_COMMENT = 500;

type Props = {
  target: CommentTarget | null;
  /** Root post id, used to record a view when the sheet opens. */
  viewPostId?: string;
  currentUserId: string | null;
  onClose: () => void;
  onCountChange: (delta: number) => void;
};

export function CommentsSheet({ target, viewPostId, currentUserId, onClose, onCountChange }: Props) {
  return (
    <Modal visible={target !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {target ? (
        <CommentsContent
          key={`${target.kind}-${target.id}`}
          target={target}
          viewPostId={viewPostId}
          currentUserId={currentUserId}
          onClose={onClose}
          onCountChange={onCountChange}
        />
      ) : null}
    </Modal>
  );
}

function CommentsContent({
  target,
  viewPostId,
  currentUserId,
  onClose,
  onCountChange,
}: Props & { target: CommentTarget }) {
  const { token } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setComments(await feedApi.getComments(token, target));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load comments.');
    } finally {
      setIsLoading(false);
    }
  }, [token, target]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
    if (token && viewPostId) feedApi.recordPostView(token, viewPostId).catch(() => {});
  }, [load, token, viewPostId]);

  const handleSend = async () => {
    const value = text.trim();
    if (!token || !value || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      const created = await feedApi.addComment(token, target, value);
      setComments((prev) => [created, ...prev]);
      setText('');
      onCountChange(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to post comment.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = (comment: PostComment) => {
    if (!token) return;
    Alert.alert('Delete comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await feedApi.deleteComment(token, target, comment._id);
            setComments((prev) => prev.filter((c) => c._id !== comment._id));
            onCountChange(-1);
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Unable to delete comment.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={styles.headerSide} />
          <Text style={styles.title}>Comments</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={onClose} style={styles.headerSide}>
            <Ionicons name="close" size={22} color={AppColors.textPrimary} />
          </Pressable>
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator style={styles.loading} color={AppColors.link} />
            ) : (
              <Text style={styles.empty}>No comments yet. Be the first to comment.</Text>
            )
          }
          renderItem={({ item }) => {
            const own = Boolean(currentUserId && item.author?._id === currentUserId);
            return (
              <View style={styles.commentRow}>
                <Image
                  source={{ uri: resolveAvatar(item.author?.profile_avatar) }}
                  style={styles.avatar}
                  contentFit="cover"
                />
                <View style={styles.commentBody}>
                  <Text style={styles.commentMeta}>
                    <Text style={styles.commentAuthor}>{item.author?.user_name ?? 'Unknown'}</Text>
                    {'  '}
                    {timeAgo(item.created_at)}
                  </Text>
                  <Text style={styles.commentText}>{item.comment}</Text>
                </View>
                {own ? (
                  <Pressable hitSlop={10} onPress={() => handleDelete(item)}>
                    <Ionicons name="trash-outline" size={16} color={AppColors.textSecondary} />
                  </Pressable>
                ) : null}
              </View>
            );
          }}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write a comment…"
            placeholderTextColor={AppColors.textPlaceholder}
            maxLength={MAX_COMMENT}
            multiline
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send comment"
            disabled={!text.trim() || isSending}
            onPress={handleSend}
            style={[styles.sendButton, (!text.trim() || isSending) && styles.sendDisabled]}>
            {isSending ? (
              <ActivityIndicator size="small" color={AppColors.buttonPrimaryText} />
            ) : (
              <Ionicons name="arrow-up" size={18} color={AppColors.buttonPrimaryText} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  headerSide: {
    width: 28,
    alignItems: 'flex-end',
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexGrow: 1,
  },
  loading: {
    paddingVertical: 40,
  },
  empty: {
    color: AppColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 40,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  commentMeta: {
    color: AppColors.textSecondary,
    fontSize: 11,
  },
  commentAuthor: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  commentText: {
    color: AppColors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    color: AppColors.danger,
    fontSize: 12,
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.border,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    color: AppColors.textPrimary,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.buttonPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.4,
  },
});
