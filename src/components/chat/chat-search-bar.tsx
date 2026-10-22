import { Ionicons } from '@expo/vector-icons';
import { TextInput, View } from 'react-native';

import { makeStyles, useAppColors } from '@/context/theme-context';
import { useTranslation } from 'react-i18next';

type ChatSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export function ChatSearchBar({ value, onChangeText }: ChatSearchBarProps) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Ionicons name="search-outline" size={16} color={AppColors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={t('Search')}
        placeholderTextColor={AppColors.textPlaceholder}
        style={styles.input}
      />
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
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
}));
