import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SuggestedUserRow } from '@/components/chat/suggested-user-row';
import { AppColors } from '@/constants/app-colors';
import { SUGGESTED_USERS } from '@/data/chat-mock';

export default function NewMessageScreen() {
  const [query, setQuery] = useState('');

  const suggestions = SUGGESTED_USERS.filter((user) =>
    user.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>New Message</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.toRow}>
        <Text style={styles.toLabel}>To:</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={AppColors.textPlaceholder}
          style={styles.toInput}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Suggested</Text>
        {suggestions.map((user) => (
          <SuggestedUserRow key={user.id} user={user} onPress={() => router.back()} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  toRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  toLabel: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
  toInput: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
});
