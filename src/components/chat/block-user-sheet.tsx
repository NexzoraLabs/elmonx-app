import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { AppColors } from '@/constants/app-colors';

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
  avatarColor: string;
  onConfirm: () => void;
};

export function BlockUserSheet({ visible, onClose, name, avatarColor, onConfirm }: BlockUserSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <PlaceholderThumb color={avatarColor} icon="person-outline" style={styles.avatar} iconSize={22} />
        <Text style={styles.title}>Block {name}?</Text>
        <Text style={styles.subtitle}>Are you sure you want to block this user.</Text>
      </View>

      <View style={styles.list}>
        {CONSEQUENCES.map((item) => (
          <View key={item.text} style={styles.row}>
            <Ionicons name={item.icon} size={18} color={AppColors.textSecondary} />
            <Text style={styles.rowText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <AuthButton
        label="Block"
        onPress={() => {
          onConfirm();
          onClose();
        }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
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
});
