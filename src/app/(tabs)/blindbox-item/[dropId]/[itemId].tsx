import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DetailImageCarousel } from '@/components/collection-detail/detail-image-carousel';
import { ViewIn3DButton } from '@/components/collection-detail/view-in-3d-button';
import { Viewer3DModal } from '@/components/collection-detail/viewer-3d-modal';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import { isSpecialDrop, fetchDropById, type BlindBoxItemData, type Drop, type UnityAssetEntry, type UnityAssetFile } from '@/services/drops-api';
import { useViewerAccess } from '@/hooks/use-viewer-access';
import { isUnityViewerAvailable, presentUnityViewer } from '@/services/unity-bridge';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

type RarityStyle = { label: string; colors: [string, string] };

function rarityStyle(rarity: string | undefined, fallbackColor: string): RarityStyle | null {
  if (!rarity) return null;
  const value = rarity.toLowerCase();
  if (value.includes('regular')) return { label: rarity, colors: ['#708090', '#4682b4'] };
  if (value.includes('secret')) return { label: 'Secret Rare', colors: ['#FFD700', '#B5A642'] };
  if (value.includes('legendary')) return { label: rarity, colors: ['#673AB7', '#3119bd'] };
  if (value.includes('rare')) return { label: rarity, colors: ['#228B22', '#50C878'] };
  return { label: rarity, colors: [fallbackColor, fallbackColor] };
}

function oddsText(drop: Drop, item: BlindBoxItemData): string {
  const dropRemaining = (drop.total_editions || 0) - (drop.consumed_editions || 0);
  const itemRemaining = (item.total_editions || 0) - (item.consumed_editions || 0);
  if (item.total_editions === item.consumed_editions) return i18n.t('{{a}} in {{b}}', { a: 0, b: dropRemaining });
  const calc = dropRemaining <= 0 || itemRemaining <= 0 ? '0' : (dropRemaining / itemRemaining).toFixed(2);
  return i18n.t('{{a}} in {{b}}', { a: 1, b: calc });
}

export default function BlindBoxItemScreen() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { token } = useAuth();
  const { dropId, itemId } = useLocalSearchParams<{ dropId: string; itemId: string }>();
  const [drop, setDrop] = useState<Drop | null>(null);
  const [item, setItem] = useState<BlindBoxItemData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    if (!dropId || !itemId) { setIsLoading(false); return; }
    let active = true;
    fetchDropById(dropId, token)
      .then((d) => {
        if (!active || !d) return;
        setDrop(d);
        const items = Array.isArray(d.blind_box_items_data) ? d.blind_box_items_data : [];
        const found = items.find((i) => i._id === itemId) ?? null;
        setItem(found);
      })
      .catch(() => {})
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [dropId, itemId, token]);

  const resolveAccess = useViewerAccess();
  const [viewerLoading, setViewerLoading] = useState(false);

  const handleViewIn3D = async () => {
    if (!item || viewerLoading) return;
    // Each blind box item has its own unity_assets (per API response).
    const unityEntry: UnityAssetEntry | undefined = item.unity_assets?.[0];
    const platformAsset: UnityAssetFile | undefined = unityEntry
      ? (Platform.OS === 'ios' ? unityEntry.IOS_assets : unityEntry.Android_assets)
      : undefined;
    if (unityEntry && platformAsset?.original_url && isUnityViewerAvailable()) {
      // Old app (BlindBoxItemDetails): owned = this revealed item; "AR for all" comes from the parent drop.
      setViewerLoading(true);
      try {
        const access = await resolveAccess({ blindBoxItemId: item._id, arAvailableToAll: drop?.is_ar_available_to_all });
        presentUnityViewer(unityEntry, platformAsset, access);
      } finally {
        setViewerLoading(false);
      }
    } else {
      setViewerVisible(true);
    }
  };

  const image = item?.image?.[0]?.url;
  const rarity = drop && !isSpecialDrop(drop._id) ? rarityStyle(item?.rarity, AppColors.border) : null;
  const itemRemaining = item ? (item.total_editions || 0) - (item.consumed_editions || 0) : 0;
  const isSoldOut = item ? item.total_editions > 0 && item.consumed_editions >= item.total_editions : false;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Go back')}
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {item?.title ?? ''}
        </Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={AppColors.link} />
      ) : !item || !drop ? (
        <View style={styles.empty}>
          <Ionicons name="cube-outline" size={32} color={AppColors.textSecondary} />
          <Text style={styles.emptyText}>{t('Item not found.')}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Image + View in 3D (always shown; Unity if available, else image modal) */}
          <DetailImageCarousel images={image ? [image] : []} color={AppColors.surface} />
          {/* View in 3D: centred under the artwork, like the drop page. */}
          {item ? (
            <View style={styles.viewIn3D}>
              <ViewIn3DButton onPress={() => void handleViewIn3D()} loading={viewerLoading} />
            </View>
          ) : null}

          {/* Info */}
          <View style={styles.infoBlock}>
            {rarity ? (
              <LinearGradient colors={rarity.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.rarityBadge}>
                <Text style={styles.rarityText}>{t(rarity.label)}</Text>
              </LinearGradient>
            ) : null}
            <Text style={styles.collectionName} numberOfLines={1}>{drop.title}</Text>
            <Text style={styles.itemTitle}>{item.title}</Text>
            {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
          </View>

          {/* Stats card */}
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t('Odds')}</Text>
              <Text style={styles.statValue}>{oddsText(drop, item)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t('Remaining')}</Text>
              <Text style={[styles.statValue, isSoldOut && styles.soldOut]}>
                {isSoldOut ? t('Sold out') : t('{{n}} left', { n: itemRemaining })}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t('Total Editions')}</Text>
              <Text style={styles.statValue}>{item.total_editions || 0}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t('Price')}</Text>
              {drop.type === 'Layer_2' ? (
                <View style={styles.priceRow}>
                  <Image source={require('../../../../../assets/coin_icon.webp')} style={styles.coinIcon} contentFit="contain" />
                  <Text style={styles.statValue}>{drop.price || 0}</Text>
                </View>
              ) : (
                <Text style={styles.statValue}>£{drop.price || 0}</Text>
              )}
            </View>
          </View>

          {/* See parent drop */}
          <Pressable
            style={({ pressed }) => [styles.parentButton, pressed && styles.pressed]}
            onPress={() => router.push({ pathname: '/drop/[id]', params: { id: drop._id } })}>
            <Text style={styles.parentButtonText}>{t('See Drop Details')}</Text>
            <Ionicons name="arrow-forward" size={16} color={AppColors.buttonPrimaryText} />
          </Pressable>

          <Viewer3DModal
            visible={viewerVisible}
            onClose={() => setViewerVisible(false)}
            title={item.title}
            imageUrl={image}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((AppColors) => ({
  viewIn3D: { alignItems: 'center', marginTop: 4 },
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  headerTitle: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  loading: { paddingVertical: 60 },
  empty: { alignItems: 'center', gap: 12, paddingTop: 80 },
  emptyText: { color: AppColors.textSecondary, fontSize: 14 },
  content: { paddingBottom: 40 },
  infoBlock: { paddingHorizontal: 20, paddingTop: 20, gap: 6 },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  rarityText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  collectionName: {
    color: AppColors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemTitle: { color: AppColors.textPrimary, fontSize: 22, fontWeight: '700' },
  description: {
    color: AppColors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  statsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  statLabel: { color: AppColors.textSecondary, fontSize: 13 },
  statValue: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' },
  soldOut: { color: AppColors.danger },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  coinIcon: { width: 16, height: 16 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: AppColors.border },
  parentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 20,
    height: 52,
    borderRadius: 26,
    backgroundColor: AppColors.buttonPrimaryBg,
  },
  parentButtonText: { color: AppColors.buttonPrimaryText, fontSize: 15, fontWeight: '700' },
}));
