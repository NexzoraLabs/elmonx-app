import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';

export function ArtistWaveHeader({ color, imageUrl }: { color: string; imageUrl?: string }) {
  return (
    <View style={styles.container}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 200"
        style={StyleSheet.absoluteFill}
        preserveAspectRatio="none">
        <Path
          d="M0 130 C 80 70, 160 190, 240 110 S 380 60, 400 90"
          stroke="#34C759"
          strokeWidth={3}
          fill="none"
        />
        <Path
          d="M0 110 C 90 160, 170 60, 250 130 S 370 150, 400 110"
          stroke="#3D8BFF"
          strokeWidth={3}
          fill="none"
        />
        <Path
          d="M0 150 C 100 90, 180 150, 260 90 S 360 100, 400 130"
          stroke="#F5B400"
          strokeWidth={3}
          fill="none"
        />
      </Svg>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.avatar} contentFit="cover" transition={150} />
      ) : (
        <PlaceholderThumb color={color} icon="person-outline" style={styles.avatar} iconSize={28} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#0A0A0B',
  },
});
