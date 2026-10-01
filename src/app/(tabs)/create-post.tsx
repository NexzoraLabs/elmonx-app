import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UserAvatar } from '@/components/account/user-avatar';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import * as feedApi from '@/services/feed-api';
import type { LocalImage } from '@/services/feed-api';
import { emitFeedChanged } from '@/services/feed-events';

export default function CreatePostScreen() {
  const { token, user } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = feedApi.MAX_POST_CONTENT - content.length;
  const canPost = (content.trim().length > 0 || images.length > 0) && remaining >= 0 && !isPosting;

  const handlePickImages = async () => {
    const slots = feedApi.MAX_POST_IMAGES - images.length;
    if (slots <= 0) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add images to your post.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: slots,
      quality: 0.85,
    });
    if (result.canceled) return;
    const picked = result.assets.map((asset) => ({ uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName }));
    setImages((prev) => [...prev, ...picked].slice(0, feedApi.MAX_POST_IMAGES));
  };

  const handlePost = async () => {
    if (!token || !canPost) return;
    setIsPosting(true);
    setError(null);
    try {
      const uploaded = images.length > 0 ? await feedApi.uploadPostImages(token, images) : [];
      const text = content.trim();
      await feedApi.createPost(token, {
        ...(text ? { content: text } : {}),
        ...(uploaded.length > 0 ? { images: uploaded } : {}),
      });
      emitFeedChanged();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create post.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Create Post</Text>
          <Pressable
            accessibilityRole="button"
            disabled={!canPost}
            onPress={handlePost}
            style={[styles.postButton, !canPost && styles.postButtonDisabled]}>
            {isPosting ? (
              <ActivityIndicator size="small" color={AppColors.buttonPrimaryText} />
            ) : (
              <Text style={styles.postLabel}>Post</Text>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.composer}>
            <UserAvatar user={user} size={40} />
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="What's new?"
              placeholderTextColor={AppColors.textPlaceholder}
              multiline
              autoFocus
              style={styles.input}
            />
          </View>

          {images.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
              {images.map((image, index) => (
                <View key={`${image.uri}-${index}`}>
                  <Image source={{ uri: image.uri }} style={styles.preview} contentFit="cover" />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove image"
                    hitSlop={6}
                    onPress={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                    style={styles.removeImage}>
                    <Ionicons name="close" size={14} color={AppColors.textPrimary} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.toolbar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add photos"
            disabled={images.length >= feedApi.MAX_POST_IMAGES}
            onPress={handlePickImages}
            style={({ pressed }) => [styles.toolButton, pressed && styles.pressed]}>
            <Ionicons
              name="image-outline"
              size={22}
              color={images.length >= feedApi.MAX_POST_IMAGES ? AppColors.textPlaceholder : AppColors.textPrimary}
            />
            <Text style={styles.toolLabel}>
              {images.length}/{feedApi.MAX_POST_IMAGES}
            </Text>
          </Pressable>
          <Text style={[styles.counter, remaining < 0 && styles.counterOver]}>{remaining}</Text>
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
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  cancel: {
    color: AppColors.textSecondary,
    fontSize: 15,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  postButton: {
    minWidth: 64,
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: AppColors.buttonPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    opacity: 0.4,
  },
  postLabel: {
    color: AppColors.buttonPrimaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  composer: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 120,
    color: AppColors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  imageRow: {
    gap: 10,
  },
  preview: {
    width: 140,
    height: 140,
    borderRadius: 14,
    backgroundColor: AppColors.surface,
  },
  removeImage: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: AppColors.danger,
    fontSize: 13,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.border,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolLabel: {
    color: AppColors.textSecondary,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  counter: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  counterOver: {
    color: AppColors.danger,
  },
});
