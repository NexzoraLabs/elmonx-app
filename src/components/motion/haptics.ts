import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticKind = 'light' | 'medium' | 'selection' | 'success' | 'warning' | 'error';

/**
 * One place for tactile feedback so it stays consistent: `light` = taps on primary buttons/cards,
 * `selection` = tab/pill/toggle changes, `medium` = like/follow, `success`/`error` = result of an
 * action (claim, purchase, bid). Never throws — haptics are optional sugar.
 */
export function haptic(kind: HapticKind): void {
  if (Platform.OS === 'web') return;
  const run = () => {
    switch (kind) {
      case 'light':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      case 'medium':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      case 'selection':
        return Haptics.selectionAsync();
      case 'success':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'warning':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      case 'error':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  run()?.catch(() => {});
}
