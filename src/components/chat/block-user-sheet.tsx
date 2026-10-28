import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { Image } from 'expo-image';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { makeStyles, useAppColors } from '@/context/theme-context';
import type { AvatarSource } from '@/services/profile-api';
import { useTranslation } from 'react-i18next';

const CONSEQUENCES: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }[] = [
  { icon: 'eye-off-outline', text: "They won't be able to find your profile or content on ElmonX." },
  {
    icon: 'eye-off-outline',
    text: "No one will be able to see their replies to your posts unless you unblock them.",
  },
  { icon: 'chatbubble-ellipses-outline', text: "They won't be able to message you directly." },
  { icon: 'notifications-off-outline', text: "They won't be notified that you blocked them." },
];

type BlockUserSheetProps = {
  visible: boolean;
  onClose: () => void;
  name: string;
  avatarUrl: AvatarSource;
  onConfirm: () => void;
};

export function BlockUserSheet({ visible, onClose, name, avatarUrl, onConfirm }: BlockUserSheetProps) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Image source={avatarUrl} style={styles.avatar} contentFit="cover" />
        <Text style={styles.title}>{t('Block {{name}}?', { name })}</Text>
        <Text style={styles.subtitle}>{t('Are you sure you want to block this user.')}</Text>
      </View>

      <View style={styles.list}>
        {CONSEQUENCES.map((item) => (
          <View key={item.text} style={styles.row}>
            <Ionicons name={item.icon} size={18} color={AppColors.textSecondary} />
            <Text style={styles.rowText}>{t(item.text)}</Text>
          </View>
        ))}
      </View>

      <AuthButton
        label={t('Block')}
        onPress={() => {
          onConfirm();
          onClose();
        }}
      />
    </BottomSheet>
  );
}

const useStyles = makeStyles((AppColors) => ({
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: AppColors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  list: {
    gap: 14,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rowText: {
    flex: 1,
    color: AppColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
}));
