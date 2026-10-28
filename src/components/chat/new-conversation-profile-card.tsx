import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { makeStyles, useAppColors } from '@/context/theme-context';
import type { AvatarSource } from '@/services/profile-api';
import { useTranslation } from 'react-i18next';

type Props = {
  username: string;
  avatarUrl: AvatarSource;
  onViewProfile: () => void;
};

/** Empty thread (website: "No messages yet. Say hi!"). */
export function NewConversationProfileCard({ username, avatarUrl, onViewProfile }: Props) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Image source={avatarUrl} style={styles.avatar} contentFit="cover" />
      <Text style={styles.username}>@{username}</Text>
      <Text style={styles.meta}>{t('No messages yet. Say hi!')}</Text>

      <Pressable style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]} onPress={onViewProfile}>
        <Ionicons name="person-outline" size={16} color={AppColors.textPrimary} />
        <Text style={styles.actionLabel}>{t('View Profile')}</Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 6,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: AppColors.surface,
    marginBottom: 8,
  },
  username: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  meta: {
    color: AppColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  actionButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: AppColors.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  actionLabel: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
}));
