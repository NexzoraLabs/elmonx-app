import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { AppColors } from '@/constants/app-colors';
import { FORWARD_CONTACTS } from '@/data/chat-mock';

type ForwardMessageSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSend: (contactIds: string[]) => void;
};

export function ForwardMessageSheet({ visible, onClose, onSend }: ForwardMessageSheetProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const contacts = FORWARD_CONTACTS.filter((contact) =>
    contact.name.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleSend = () => {
    onSend(selected);
    setSelected([]);
    setQuery('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Message Forward</Text>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={AppColors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search for ElmonX profiles"
          placeholderTextColor={AppColors.textPlaceholder}
          style={styles.searchInput}
        />
      </View>

      <ScrollView style={styles.grid}>
        <View style={styles.gridInner}>
          {contacts.map((contact) => {
            const isSelected = selected.includes(contact.id);
            return (
              <Pressable key={contact.id} style={styles.contact} onPress={() => toggle(contact.id)}>
                <View>
                  <PlaceholderThumb
                    color={contact.color}
                    icon="person-outline"
                    style={styles.avatar}
                    iconSize={18}
                  />
                  {isSelected ? (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                    </View>
                  ) : null}
                </View>
                <Text style={styles.contactName} numberOfLines={1}>
                  {contact.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <AuthButton label="Send" onPress={handleSend} disabled={selected.length === 0} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    color: AppColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  grid: {
    maxHeight: 320,
  },
  gridInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 16,
  },
  contact: {
    width: '22%',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: AppColors.rarityRare,
    borderWidth: 2,
    borderColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactName: {
    color: AppColors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
});
