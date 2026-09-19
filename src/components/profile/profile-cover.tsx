import Svg, { Line } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';

const STRIPE_COUNT = 14;

export function ProfileCover({ avatarColor }: { avatarColor: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="none">
          {Array.from({ length: STRIPE_COUNT }).map((_, index) => {
            const x = index * 36 - 60;
            return (
              <Line
                key={index}
                x1={x}
                y1={160}
                x2={x + 90}
                y2={-20}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={6}
              />
            );
          })}
        </Svg>
      </View>

      <PlaceholderThumb color={avatarColor} icon="person-outline" style={styles.avatar} iconSize={30} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 44,
  },
  banner: {
    height: 140,
    backgroundColor: AppColors.background,
    overflow: 'hidden',
  },
  avatar: {
    position: 'absolute',
    bottom: -36,
    left: 20,
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: AppColors.background,
  },
});
