import * as WebBrowser from 'expo-web-browser';
import { Text, type StyleProp, type TextStyle } from 'react-native';

import { SHARE_URL } from '@/config/env';

/** Inline link to a website legal page (terms, privacy) inside a sentence. */
export function LegalLink({ path, label, style }: { path: string; label: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={style} accessibilityRole="link" onPress={() => WebBrowser.openBrowserAsync(`${SHARE_URL}${path}`)}>
      {label}
    </Text>
  );
}
