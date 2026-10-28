import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { makeStyles, useAppColors } from '@/context/theme-context';
import type { AvatarSource } from '@/services/profile-api';
import { useTranslation } from 'react-i18next';

type ConversationHeaderProps = {
  username: string;
  avatarUrl: AvatarSource;
  online: boolean;
  typing: boolean;
  onPressProfile: () => void;
  onPressMenu: () => void;
};

export function ConversationHeader({ username, avatarUrl, online, typing, onPressProfile, onPressMenu }: ConversationHeaderProps) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Go back')}
        hitSlop={8}
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
      </Pressable>

      <Pressable style={styles.identity} onPress={onPressProfile}>
        <View>
          <Image source={avatarUrl} style={styles.avatar} contentFit="cover" />
          {online ? <View style={styles.onlineDot} /> : null}
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.name} numberOfLines={1}>
            @{username}
          </Text>
          {typing ? (
            <Text style={styles.typing}>{t('typing…')}</Text>
          ) : online ? (
            <Text style={styles.status}>{t('online')}</Text>
          ) : null}
        </View>
      </Pressable>

      <Pressable accessibilityRole="button" accessibilityLabel={t('More options')} hitSlop={8} onPress={onPressMenu}>
        <Ionicons name="ellipsis-horizontal" size={20} color={AppColors.textPrimary} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.success,
    borderWidth: 2,
    borderColor: AppColors.background,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  status: {
    color: AppColors.success,
    fontSize: 11,
    marginTop: 1,
  },
  typing: {
    color: AppColors.success,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 1,
  },
}));
