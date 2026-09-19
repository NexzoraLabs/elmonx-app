import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type ViewStyle } from 'react-native';

type PlaceholderThumbProps = {
  color: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  iconSize?: number;
};

/**
 * Flat color block standing in for real artwork/photos until asset
 * exports arrive from Figma. Swap the View for an Image with the same
 * style prop once real sources are available.
 */
export function PlaceholderThumb({ color, icon, style, iconSize = 22 }: PlaceholderThumbProps) {
  return (
    <View style={[styles.base, { backgroundColor: color }, style]}>
      {icon ? <Ionicons name={icon} size={iconSize} color="rgba(255,255,255,0.85)" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
