import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BlockUserSheet } from '@/components/chat/block-user-sheet';
import { BlockedFooter } from '@/components/chat/blocked-footer';
import { ChatOptionsSheet } from '@/components/chat/chat-options-sheet';
import { ConversationHeader } from '@/components/chat/conversation-header';
import { DeleteConversationSheet } from '@/components/chat/delete-conversation-sheet';
import { ForwardMessageSheet } from '@/components/chat/forward-message-sheet';
import { MessageBubble } from '@/components/chat/message-bubble';
import { MessageContextMenu } from '@/components/chat/message-context-menu';
import { MessageInputBar } from '@/components/chat/message-input-bar';
import { NewConversationProfileCard } from '@/components/chat/new-conversation-profile-card';
import { ReportSheet } from '@/components/chat/report-sheet';
import { RequestFooter } from '@/components/chat/request-footer';
import { UnblockUserSheet } from '@/components/chat/unblock-user-sheet';
import { UploadSheet } from '@/components/chat/upload-sheet';
import { AppColors } from '@/constants/app-colors';
import { useChat } from '@/context/chat-context';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getConversation,
    sendMessage,
    blockConversation,
    unblockConversation,
    deleteConversation,
    acceptRequest,
    rejectRequest,
  } = useChat();

  const conversation = getConversation(id);

  const [optionsVisible, setOptionsVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [blockVisible, setBlockVisible] = useState(false);
  const [unblockVisible, setUnblockVisible] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [forwardVisible, setForwardVisible] = useState(false);
  const [contextMenuMessageId, setContextMenuMessageId] = useState<string | null>(null);

  if (!conversation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.notFound}>Conversation not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ConversationHeader
        name={conversation.name}
        username={conversation.username}
        avatarColor={conversation.avatarColor}
        onPressMenu={() => setOptionsVisible(true)}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {conversation.messages.length === 0 ? (
          <NewConversationProfileCard conversation={conversation} />
        ) : (
          <ScrollView contentContainerStyle={styles.messages}>
            {conversation.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onLongPress={() => setContextMenuMessageId(message.id)}
              />
            ))}
          </ScrollView>
        )}

        {conversation.isBlocked ? (
          <BlockedFooter
            username={conversation.username}
            onUnblock={() => setUnblockVisible(true)}
            onDelete={() => setDeleteVisible(true)}
          />
        ) : conversation.isRequest ? (
          <RequestFooter
            onReject={() => {
              rejectRequest(conversation.id);
              router.back();
            }}
            onAccept={() => acceptRequest(conversation.id)}
          />
        ) : (
          <MessageInputBar
            onSend={(text) => sendMessage(conversation.id, text)}
            onPressAttach={() => setUploadVisible(true)}
          />
        )}
      </KeyboardAvoidingView>

      <ChatOptionsSheet
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        username={conversation.username.replace(/^_/, '')}
        onViewProfile={() => {}}
        onBlock={() => setBlockVisible(true)}
        onReport={() => setReportVisible(true)}
        onDelete={() => setDeleteVisible(true)}
      />

      <BlockUserSheet
        visible={blockVisible}
        onClose={() => setBlockVisible(false)}
        name={conversation.name}
        avatarColor={conversation.avatarColor}
        onConfirm={() => blockConversation(conversation.id)}
      />

      <UnblockUserSheet
        visible={unblockVisible}
        onClose={() => setUnblockVisible(false)}
        username={conversation.username}
        onConfirm={() => unblockConversation(conversation.id)}
      />

      <ReportSheet
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        onSubmit={() => {}}
      />

      <DeleteConversationSheet
        visible={deleteVisible}
        onClose={() => setDeleteVisible(false)}
        onConfirm={() => {
          deleteConversation(conversation.id);
          router.back();
        }}
      />

      <UploadSheet
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
        onSelect={() => {}}
      />

      <ForwardMessageSheet
        visible={forwardVisible}
        onClose={() => setForwardVisible(false)}
        onSend={() => {}}
      />

      <MessageContextMenu
        visible={contextMenuMessageId !== null}
        onClose={() => setContextMenuMessageId(null)}
        onReply={() => {}}
        onForward={() => setForwardVisible(true)}
        onCopy={() => {}}
        onDelete={() => {}}
      />
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
  messages: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  notFound: {
    color: AppColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
});
