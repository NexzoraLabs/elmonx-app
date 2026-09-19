import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { ChatMessage } from '@/data/chat-mock';

type MessageBubbleProps = {
  message: ChatMessage;
  onLongPress: () => void;
};

export function MessageBubble({ message, onLongPress }: MessageBubbleProps) {
  return (
    <View style={[styles.row, message.fromMe ? styles.rowRight : styles.rowLeft]}>
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={250}
        style={[styles.bubble, message.fromMe ? styles.bubbleMine : styles.bubbleTheirs]}>
        {message.imageColor ? (
          <PlaceholderThumb color={message.imageColor} icon="image-outline" style={styles.image} iconSize={30} />
        ) : (
          <Text style={styles.text}>{message.text}</Text>
        )}
        <View style={styles.metaRow}>
          <Text style={styles.timestamp}>{message.timestamp}</Text>
          {message.fromMe && message.read ? (
            <Ionicons name="checkmark-done" size={13} color={AppColors.rarityRare} />
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  bubbleMine: {
    backgroundColor: AppColors.surface,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: AppColors.border,
    borderBottomLeftRadius: 4,
  },
  text: {
    color: AppColors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  timestamp: {
    color: AppColors.textSecondary,
    fontSize: 10,
  },
});
