import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { AccordionSection } from '@/components/collection-detail/accordion-section';
import { BlindBoxItemCard } from '@/components/collection-detail/blind-box-item-card';
import { DetailHeader } from '@/components/collection-detail/detail-header';
import { DetailImageCarousel } from '@/components/collection-detail/detail-image-carousel';
import { DropTimePill } from '@/components/collection-detail/drop-time-pill';
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
} from '@/data/collection-detail-mock';

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const source = findDetailSource(id);

  if (!source) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DetailHeader />
        <Text style={styles.notFound}>This item isn&apos;t available anymore.</Text>
      </SafeAreaView>
    );
  }

  const variant = getDetailVariant(source.id);
  const availability = getAvailability(source.id);
  const price = getPrice(source.id);
  const blindBoxItems = variant === 'blindBox' ? getBlindBoxItems(source.id) : [];

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <DetailHeader />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <DetailImageCarousel images={source.imageUrl ? [source.imageUrl] : []} color={source.color} />

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
          <DropTimePill targetMs={getComingSoonTarget(source.id)} />
        ) : null}

        <View style={styles.accordions}>
          <AccordionSection title="Description" content={DESCRIPTION_TEXT} />
          <AccordionSection title="Editions" content="This piece is issued as a single verified edition." />
          <AccordionSection title="Details" content={DETAILS_TEXT} />
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
