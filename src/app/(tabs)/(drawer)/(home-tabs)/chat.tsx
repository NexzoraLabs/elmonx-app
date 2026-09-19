import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatFilterTabs, type ChatFilter } from '@/components/chat/chat-filter-tabs';
import { ChatSearchBar } from '@/components/chat/chat-search-bar';
import { ConversationRow } from '@/components/chat/conversation-row';
import { MessagesHeader } from '@/components/chat/messages-header';
import { AppColors } from '@/constants/app-colors';
import { useChat } from '@/context/chat-context';

export default function ChatListScreen() {
  const { conversations } = useChat();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ChatFilter>('All');

  const unreadCount = conversations.filter((c) => c.unreadCount > 0).length;
  const requestsCount = conversations.filter((c) => c.isRequest).length;

  const filtered = conversations
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    .filter((c) => {
      if (filter === 'Unread') return c.unreadCount > 0;
      if (filter === 'Requests') return c.isRequest;
      return true;
    });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <MessagesHeader onPressCompose={() => router.push('/chat/new')} />
      <ChatSearchBar value={query} onChangeText={setQuery} />
      <ChatFilterTabs
        selected={filter}
        onSelect={setFilter}
        unreadCount={unreadCount}
        requestsCount={requestsCount}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No conversations here yet.</Text>
          </View>
        ) : (
          filtered.map((conversation) => (
            <ConversationRow key={conversation.id} conversation={conversation} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
});
