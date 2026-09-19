import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type MessageInputBarProps = {
  onSend: (text: string) => void;
  onPressAttach: () => void;
};

export function MessageInputBar({ onSend, onPressAttach }: MessageInputBarProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Attach"
        hitSlop={8}
        onPress={onPressAttach}
        style={styles.attachButton}>
        <Ionicons name="add" size={22} color={AppColors.textPrimary} />
      </Pressable>

      <View style={styles.inputWrapper}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Send a message"
          placeholderTextColor={AppColors.textPlaceholder}
          style={styles.input}
          multiline
          onSubmitEditing={handleSend}
        />
      </View>

      {text.trim().length > 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Send" onPress={handleSend} hitSlop={8}>
          <Ionicons name="arrow-up-circle" size={32} color={AppColors.textPrimary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
