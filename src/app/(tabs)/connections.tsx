import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BlockedList, FollowersList, FollowingList } from '@/components/connections/connection-lists';
import { useConnectionsStyles as useStyles } from '@/components/connections/connections-styles';
import { useAppColors } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from 'react-i18next';
import { TabIndicator } from '@/components/motion';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TABS: Tab[] = ['followers', 'following', 'blocked'];

type Tab = 'followers' | 'following' | 'blocked';

export default function ConnectionsScreen() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { token, user } = useAuth();
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialIndex = params.tab === 'following' ? 1 : params.tab === 'blocked' ? 2 : 0;
  const [tabIndex, setTabIndex] = useState(initialIndex);
  const scrollRef = useRef<ScrollView>(null);
  const myUserId = (user as { _id?: string })?._id ?? '';

  const goToTab = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setTabIndex(index);
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setTabIndex(index);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Go back')}
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('Connections')}</Text>
        <View style={styles.backButton} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabs}>
        {TABS.map((key, i) => {
          const active = tabIndex === i;
          const label = key.charAt(0).toUpperCase() + key.slice(1);
          return (
            <Pressable key={key} style={styles.tab} onPress={() => goToTab(i)}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t(label)}</Text>
              <TabIndicator active={active} style={[styles.tabIndicator, styles.tabIndicatorActive]} />
            </Pressable>
          );
        })}
      </View>

      {/* Swipeable pages */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        contentOffset={{ x: initialIndex * SCREEN_WIDTH, y: 0 }}
        onMomentumScrollEnd={handleMomentumEnd}
        style={styles.pager}>
        <View style={styles.page}>
          <FollowersList token={token} userId={myUserId} />
        </View>
        <View style={styles.page}>
          <FollowingList token={token} userId={myUserId} />
        </View>
        <View style={styles.page}>
          <BlockedList token={token} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
