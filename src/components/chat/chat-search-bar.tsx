import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type ChatSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export function ChatSearchBar({ value, onChangeText }: ChatSearchBarProps) {
  return (
    <View style={styles.row}>
      <Ionicons name="search-outline" size={16} color={AppColors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search"
        placeholderTextColor={AppColors.textPlaceholder}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
});
