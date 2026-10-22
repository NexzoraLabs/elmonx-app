import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import EmojiPicker, { type EmojiType } from 'rn-emoji-keyboard';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UserAvatar } from '@/components/account/user-avatar';
import { GiphyPickerSheet } from '@/components/feed/giphy-picker-sheet';
import type { Palette } from '@/constants/app-colors';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import * as feedApi from '@/services/feed-api';
import type { LocalImage } from '@/services/feed-api';
import { emitFeedChanged } from '@/services/feed-events';
import type { GiphyGif } from '@/services/giphy-api';
import { useTranslation } from 'react-i18next';

const PICKER_QUALITY = 0.85;

const toLocalImage = (asset: ImagePicker.ImagePickerAsset): LocalImage => ({
  uri: asset.uri,
  mimeType: asset.mimeType,
  fileName: asset.fileName,
});

export default function CreatePostScreen() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { token, user } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);
  // A Giphy pick is already hosted on Giphy's CDN — it never goes through the upload step.
  const [gif, setGif] = useState<GiphyGif | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGifs, setShowGifs] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Caret position, so emoji go where the user is typing (like the website's insertEmoji).
  const selection = useRef({ start: 0, end: 0 });

  const remaining = feedApi.MAX_POST_CONTENT - content.length;
  // Website rule (same as X): a GIF is exclusive — one GIF and no photos beside it.
  const canAddImages = !isPosting && !gif && images.length < feedApi.MAX_POST_IMAGES;
  const canAddGif = !isPosting && !gif && images.length === 0;
  const canPost = (content.trim().length > 0 || images.length > 0 || !!gif) && remaining >= 0 && !isPosting;

  const addImages = (assets: ImagePicker.ImagePickerAsset[]) => {
    setImages((prev) => [...prev, ...assets.map(toLocalImage)].slice(0, feedApi.MAX_POST_IMAGES));
  };

  // System photo picker: runs out-of-process and only hands back what the user picks,
  // so it needs no photo-library permission (and we don't ask for one).
  const handlePickImages = async () => {
    const slots = feedApi.MAX_POST_IMAGES - images.length;
    if (!canAddImages || slots <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: slots,
      quality: PICKER_QUALITY,
    });
    if (!result.canceled) addImages(result.assets);
  };

  const handleTakePhoto = async () => {
    if (!canAddImages) return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t('Camera access needed'),
        t('Allow camera access in Settings to take a photo for your post.'),
        permission.canAskAgain
          ? [{ text: t('OK') }]
          : [
              { text: t('Not now'), style: 'cancel' },
              { text: t('Open Settings'), onPress: () => void Linking.openSettings() },
            ],
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: PICKER_QUALITY });
    if (!result.canceled) addImages(result.assets);
  };

  const openGifPicker = () => {
    if (!canAddGif) return;
    Keyboard.dismiss();
    setShowGifs(true);
  };

  const openEmojiPicker = () => {
    if (isPosting) return;
    Keyboard.dismiss();
    setShowEmoji(true);
  };

  const handleGifSelected = (picked: GiphyGif) => {
    setGif(picked);
    setShowGifs(false);
  };

  const handleEmojiSelected = (emoji: EmojiType) => {
    const value = emoji.emoji;
    if (content.length + value.length > feedApi.MAX_POST_CONTENT) return;
    const start = Math.min(selection.current.start, content.length);
    const end = Math.min(selection.current.end, content.length);
    setContent(content.slice(0, start) + value + content.slice(end));
    const caret = start + value.length;
    selection.current = { start: caret, end: caret };
  };

  const handlePost = async () => {
    if (!token || !canPost) return;
    setIsPosting(true);
    setError(null);
    try {
      // Giphy URL goes into `images` directly, exactly where an uploaded path would (website does the same).
      const media = gif ? [gif.url] : images.length > 0 ? await feedApi.uploadPostImages(token, images) : [];
      const text = content.trim();
      await feedApi.createPost(token, {
        ...(text ? { content: text } : {}),
        ...(media.length > 0 ? { images: media } : {}),
      });
      emitFeedChanged();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Unable to create post.'));
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <Text style={styles.cancel}>{t('Cancel')}</Text>
          </Pressable>
          <Text style={styles.title}>{t('Create Post')}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={!canPost}
            onPress={handlePost}
            style={[styles.postButton, !canPost && styles.postButtonDisabled]}>
            {isPosting ? (
              <ActivityIndicator size="small" color={AppColors.buttonPrimaryText} />
            ) : (
              <Text style={styles.postLabel}>{t('Post')}</Text>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.composer}>
            <UserAvatar user={user} size={40} />
            <TextInput
              value={content}
              onChangeText={setContent}
              onSelectionChange={(event) => {
                selection.current = event.nativeEvent.selection;
              }}
              placeholder={t('What\'s new?')}
              placeholderTextColor={AppColors.textPlaceholder}
              multiline
              autoFocus
              maxLength={feedApi.MAX_POST_CONTENT}
              style={styles.input}
            />
          </View>

          {images.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
              {images.map((image, index) => (
                <View key={`${image.uri}-${index}`}>
                  <Image source={{ uri: image.uri }} style={styles.preview} contentFit="cover" />
                  <RemoveButton
                    label={t('Remove image')}
                    disabled={isPosting}
                    onPress={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                  />
                </View>
              ))}
            </ScrollView>
          ) : null}

          {gif ? (
            <View style={styles.gifPreviewWrap}>
              <Image
                source={{ uri: gif.url }}
                style={[styles.gifPreview, { aspectRatio: gif.width && gif.height ? gif.width / gif.height : 1 }]}
                contentFit="contain"
                accessibilityLabel={gif.title}
              />
              <View style={styles.gifBadge}>
                <Text style={styles.gifBadgeLabel}>{t('GIF')}</Text>
              </View>
              <RemoveButton label={t('Remove GIF')} disabled={isPosting} onPress={() => setGif(null)} />
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.toolbar}>
          <View style={styles.tools}>
            <ToolButton icon="image-outline" label={t('Add photos')} disabled={!canAddImages} onPress={handlePickImages} />
            <ToolButton icon="camera-outline" label={t('Take photo')} disabled={!canAddImages} onPress={handleTakePhoto} />
            <ToolButton label={t('Add GIF')} disabled={!canAddGif} onPress={openGifPicker}>
              <View style={[styles.gifIcon, !canAddGif && styles.gifIconDisabled]}>
                <Text style={[styles.gifIconLabel, !canAddGif && styles.toolDisabledText]}>{t('GIF')}</Text>
              </View>
            </ToolButton>
            <ToolButton icon="happy-outline" label={t('Add emoji')} disabled={isPosting} onPress={openEmojiPicker} />
            {images.length > 0 ? (
              <Text style={styles.toolLabel}>
                {images.length}/{feedApi.MAX_POST_IMAGES}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.counter, remaining < 0 && styles.counterOver]}>{remaining}</Text>
        </View>

        <GiphyPickerSheet visible={showGifs} onClose={() => setShowGifs(false)} onSelect={handleGifSelected} />
      </KeyboardAvoidingView>

      <EmojiPicker
        open={showEmoji}
        onClose={() => setShowEmoji(false)}
        onEmojiSelected={handleEmojiSelected}
        allowMultipleSelections
        enableSearchBar
        enableRecentlyUsed
        categoryPosition="bottom"
        theme={emojiTheme(AppColors)}
      />
    </SafeAreaView>
  );
}

function ToolButton({
  icon,
  label,
  disabled,
  onPress,
  children,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  disabled: boolean;
  onPress: () => void;
  children?: ReactNode;
}) {
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.toolButton, pressed && styles.pressed]}>
      {children ??
        (icon ? (
          <Ionicons name={icon} size={22} color={disabled ? AppColors.textPlaceholder : AppColors.textPrimary} />
        ) : null)}
    </Pressable>
  );
}

function RemoveButton({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={styles.removeImage}>
      <Ionicons name="close" size={14} color={AppColors.onMedia} />
    </Pressable>
  );
}

const emojiTheme = (AppColors: Palette) => ({
  backdrop: AppColors.overlay,
  knob: AppColors.border,
  container: AppColors.surface,
  header: AppColors.textSecondary,
  skinTonesContainer: AppColors.background,
  category: {
    icon: AppColors.textPlaceholder,
    iconActive: AppColors.textPrimary,
    container: AppColors.background,
    containerActive: AppColors.border,
  },
  search: {
    background: AppColors.background,
    text: AppColors.textPrimary,
    placeholder: AppColors.textPlaceholder,
    icon: AppColors.textPlaceholder,
  },
  emoji: {
    selected: AppColors.border,
  },
});

const useStyles = makeStyles((AppColors) => ({
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
  gifPreviewWrap: {
    alignSelf: 'flex-start',
    width: '75%',
  },
  gifPreview: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: AppColors.surface,
  },
  gifBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  gifBadgeLabel: {
    color: AppColors.onMedia,
    fontSize: 11,
    fontWeight: '700',
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
  tools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  toolButton: {
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gifIcon: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: AppColors.textPrimary,
  },
  gifIconDisabled: {
    borderColor: AppColors.textPlaceholder,
  },
  gifIconLabel: {
    color: AppColors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
  toolDisabledText: {
    color: AppColors.textPlaceholder,
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
}));
