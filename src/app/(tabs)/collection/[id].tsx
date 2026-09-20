import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { AccordionSection } from '@/components/collection-detail/accordion-section';
import { BlindBoxItemCard } from '@/components/collection-detail/blind-box-item-card';
import { DetailHeader } from '@/components/collection-detail/detail-header';
import { DetailImageCarousel } from '@/components/collection-detail/detail-image-carousel';
import { DropTimePill } from '@/components/collection-detail/drop-time-pill';
import { ViewIn3DButton } from '@/components/collection-detail/view-in-3d-button';
import { Viewer3DModal } from '@/components/collection-detail/viewer-3d-modal';
import { AppColors } from '@/constants/app-colors';
import {
  DESCRIPTION_TEXT,
  DETAILS_TEXT,
  findDetailSource,
  getAvailability,
  getBlindBoxItems,
  getComingSoonTarget,
  getDetailVariant,
  getPrice,
  type Availability,
  type BlindBoxItem,
  type DetailVariant,
} from '@/data/collection-detail-mock';
import { fetchDropById, formatDropDate, getPlatformUnityAsset, type Drop } from '@/services/drops-api';

function dropAvailability(drop: Drop): Availability {
  if (drop.is_sale_closed) return 'soldOut';
  if (!drop.is_open_drop && drop.total_editions > 0 && drop.consumed_editions >= drop.total_editions) {
    return 'soldOut';
  }
  if (new Date(drop.release_date).getTime() > Date.now()) return 'comingSoon';
  return 'available';
}

function dropBlindBoxItems(drop: Drop): BlindBoxItem[] {
  const price = drop.price.toFixed(2);
  return drop.blind_box_items_data.map((item) => ({
    id: item._id,
    title: item.title,
    date: formatDropDate(drop.release_date),
    price,
    rarity: item.rarity === 'rare' || item.rarity === 'ultraRare' ? item.rarity : 'common',
    color: '#1B1F2E',
    imageUrl: item.image[0]?.url,
  }));
}

function dropDetailsText(drop: Drop): string {
  return `Format: ${drop.drop_edition}\nBlockchain: ${drop.type.replace('_', ' ')}\nTotal Editions: ${drop.total_editions}\nContract: ${drop.contract_address}`;
}

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mockSource = findDetailSource(id);

  const [drop, setDrop] = useState<Drop | null>(null);
  const [loading, setLoading] = useState(!mockSource);
  const [loadError, setLoadError] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);

  useEffect(() => {
    if (mockSource || !id) return;
    let cancelled = false;
    fetchDropById(id)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setDrop(result);
          setLoadError(false);
        } else {
          setLoadError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!mockSource && loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DetailHeader />
        <View style={styles.loadingState}>
          <ActivityIndicator color={AppColors.textPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!mockSource && (loadError || !drop)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DetailHeader />
        <Text style={styles.notFound}>This item isn&apos;t available anymore.</Text>
      </SafeAreaView>
    );
  }

  const source = mockSource ?? {
    id: drop!._id,
    title: drop!.title,
    subtitle: `Drop Date : ${formatDropDate(drop!.release_date)}`,
    color: '#1B1F2E',
    imageUrl: drop!.images[0]?.original_url,
  };
  const images = mockSource ? (mockSource.imageUrl ? [mockSource.imageUrl] : []) : drop!.images.map((img) => img.original_url);

  const variant: DetailVariant = mockSource ? getDetailVariant(source.id) : drop!.is_blind_box ? 'blindBox' : 'single';
  const availability: Availability = mockSource ? getAvailability(source.id) : dropAvailability(drop!);
  const price = mockSource ? getPrice(source.id) : drop!.price.toFixed(2);
  const description = mockSource ? DESCRIPTION_TEXT : drop!.description;
  const detailsText = mockSource ? DETAILS_TEXT : dropDetailsText(drop!);
  const comingSoonTarget = mockSource ? getComingSoonTarget(source.id) : new Date(drop!.release_date).getTime();
  const blindBoxItems: BlindBoxItem[] =
    variant === 'blindBox' ? (mockSource ? getBlindBoxItems(source.id) : dropBlindBoxItems(drop!)) : [];
  const platformAsset = mockSource ? undefined : getPlatformUnityAsset(drop!);

  const footerButton =
    variant === 'blindBox' ? (
      <AuthButton label="Buy Now" onPress={() => {}} />
    ) : availability === 'soldOut' ? (
      <AuthButton label="Sold Out" onPress={() => {}} disabled />
    ) : availability === 'comingSoon' ? (
      <AuthButton label="Notify Me" onPress={() => {}} />
    ) : (
      <AuthButton label="Buy Now" onPress={() => {}} />
    );

  const editionsText = mockSource
    ? 'This piece is issued as a single verified edition.'
    : `Issued in ${drop!.total_editions} edition${drop!.total_editions === 1 ? '' : 's'}. ${drop!.consumed_editions} claimed.`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <DetailHeader />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <DetailImageCarousel images={images} color={source.color} />

        {platformAsset ? <ViewIn3DButton onPress={() => setViewerVisible(true)} /> : null}

        <View style={styles.infoRow}>
          <View style={styles.infoText}>
            <Text style={styles.title}>{source.title}</Text>
            <Text style={styles.subtitle}>{source.subtitle}</Text>
          </View>
          <View style={styles.priceRow}>
            <Ionicons name="logo-bitcoin" size={16} color={AppColors.gold} />
            <Text style={styles.price}>{price}</Text>
          </View>
        </View>

        {variant === 'single' && availability === 'comingSoon' ? (
          <DropTimePill targetMs={comingSoonTarget} />
        ) : null}

        <View style={styles.accordions}>
          <AccordionSection title="Description" content={description} />
          <AccordionSection title="Editions" content={editionsText} />
          <AccordionSection title="Details" content={detailsText} />
        </View>

        {variant === 'blindBox' ? (
          <View style={styles.blindBoxSection}>
            <View style={styles.blindBoxHeader}>
              <Text style={styles.blindBoxTitle}>Blind Box Items</Text>
              <Ionicons name="chevron-forward" size={18} color={AppColors.textSecondary} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.blindBoxList}>
              {blindBoxItems.map((item) => (
                <BlindBoxItemCard
                  key={item.id}
                  title={item.title}
                  date={item.date}
                  price={item.price}
                  rarity={item.rarity}
                  color={item.color}
                  imageUrl={item.imageUrl}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>{footerButton}</View>

      <Viewer3DModal
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        title={source.title}
        imageUrl={images[0]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  notFound: {
    color: AppColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  accordions: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  blindBoxSection: {
    marginTop: 8,
  },
  blindBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  blindBoxTitle: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  blindBoxList: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
});
