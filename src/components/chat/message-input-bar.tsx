import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';
import { MAX_MESSAGE_LENGTH } from '@/services/chat-api';

export type PickedImage = { uri: string; mimeType?: string; fileName?: string | null };

type MessageInputBarProps = {
  onSend: (input: { text: string; image: PickedImage | null }) => Promise<boolean>;
  /** Website: typing=true on input, false after 2s idle or on send. */
  onTypingChange: (isTyping: boolean) => void;
};

const TYPING_IDLE_MS = 2000;

export function MessageInputBar({ onSend, onTypingChange }: MessageInputBarProps) {
  const [text, setText] = useState('');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [sending, setSending] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(
    () => () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    },
    []
  );

  const stopTyping = () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingChange(false);
    }
  };

  const handleChange = (value: string) => {
    setText(value);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingChange(true);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to send images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setImage({ uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName });
  };

  const canSend = (text.trim().length > 0 || image !== null) && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    stopTyping();
    setSending(true);
    const ok = await onSend({ text: text.trim(), image });
    setSending(false);
    if (ok) {
      setText('');
      setImage(null);
    }
  };

  return (
    <View style={styles.container}>
      {image ? (
        <View style={styles.previewRow}>
          <View>
            <Image source={{ uri: image.uri }} style={styles.preview} contentFit="cover" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove image"
              hitSlop={6}
              onPress={() => setImage(null)}
              style={styles.removePreview}>
              <Ionicons name="close" size={12} color={AppColors.textPrimary} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Attach image"
          hitSlop={8}
          onPress={handlePickImage}
          style={styles.attachButton}>
          <Ionicons name="image-outline" size={20} color={AppColors.textPrimary} />
        </Pressable>

        <View style={styles.inputWrapper}>
          <TextInput
            value={text}
            onChangeText={handleChange}
            placeholder="Send a message"
            placeholderTextColor={AppColors.textPlaceholder}
            style={styles.input}
            multiline
            maxLength={MAX_MESSAGE_LENGTH}
          />
        </View>

        {canSend || sending ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Send" onPress={handleSend} hitSlop={8} disabled={sending}>
            {sending ? (
              <ActivityIndicator color={AppColors.textPrimary} />
            ) : (
              <Ionicons name="arrow-up-circle" size={32} color={AppColors.textPrimary} />
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.border,
  },
  previewRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  preview: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
  },
  removePreview: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  input: {
    color: AppColors.textPrimary,
    fontSize: 14,
    padding: 0,
    maxHeight: 100,
  },
});
