import { Pressable, Text, View } from 'react-native';

import { makeStyles } from '@/context/theme-context';
import { useTranslation } from 'react-i18next';

type BlockedFooterProps = {
  username: string;
  onUnblock: () => void;
  onDelete: () => void;
};

export function BlockedFooter({ username, onUnblock, onDelete }: BlockedFooterProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('You blocked')}{' '}{username}</Text>
      <Text style={styles.subtitle}>{t('You can\'t message this profile unless you unblock them.')}</Text>
      <View style={styles.buttonRow}>
        <Pressable style={[styles.button, styles.unblockButton]} onPress={onUnblock}>
          <Text style={styles.unblockLabel}>{t('Unblock')}</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.deleteButton]} onPress={onDelete}>
          <Text style={styles.deleteLabel}>{t('Delete Chat')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockButton: {
    backgroundColor: AppColors.border,
  },
  unblockLabel: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: AppColors.danger,
  },
  deleteLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
}));
