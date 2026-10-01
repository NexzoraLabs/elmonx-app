import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';
import type { ChatMessage } from '@/services/chat-api';

type MessageBubbleProps = {
  message: ChatMessage;
  fromMe: boolean;
  /** Pending local send (shown dimmed until the server confirms). */
  pending?: boolean;
  onLongPress: () => void;
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function MessageBubble({ message, fromMe, pending, onLongPress }: MessageBubbleProps) {
  const removed = Boolean(message.is_deleted);

  return (
    <View style={[styles.row, fromMe ? styles.rowRight : styles.rowLeft]}>
      <Pressable
        onLongPress={removed ? undefined : onLongPress}
        delayLongPress={250}
        style={[styles.column, fromMe ? styles.columnRight : styles.columnLeft, pending && styles.pending]}>
        {!removed && message.attachment_url ? (
          <Image source={{ uri: message.attachment_url }} style={styles.image} contentFit="cover" transition={150} />
        ) : null}
        {removed ? (
          <View style={[styles.bubble, styles.bubbleRemoved]}>
            <Text style={styles.removedText}>Message removed</Text>
          </View>
        ) : message.message ? (
          <View style={[styles.bubble, fromMe ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={[styles.text, fromMe && styles.textMine]}>{message.message}</Text>
          </View>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={styles.timestamp}>{formatTime(message.created_at)}</Text>
          {fromMe && !removed ? (
            pending ? (
              <Ionicons name="time-outline" size={12} color={AppColors.textSecondary} />
            ) : message.is_read ? (
              <Ionicons name="checkmark-done" size={13} color={AppColors.rarityRare} />
            ) : (
              <Ionicons name="checkmark" size={13} color={AppColors.textSecondary} />
            )
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  column: {
    maxWidth: '78%',
    gap: 4,
  },
  columnRight: {
    alignItems: 'flex-end',
  },
  columnLeft: {
    alignItems: 'flex-start',
  },
  pending: {
    opacity: 0.6,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: AppColors.buttonPrimaryBg,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: AppColors.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleRemoved: {
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  text: {
    color: AppColors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  textMine: {
    color: AppColors.buttonPrimaryText,
  },
  removedText: {
    color: AppColors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  image: {
    width: 220,
    height: 220,
    maxHeight: 280,
    borderRadius: 14,
    backgroundColor: AppColors.surface,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    color: AppColors.textSecondary,
    fontSize: 10,
  },
});
