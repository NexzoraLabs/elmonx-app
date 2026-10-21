import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';
import { isSpecialDrop, type BlindBoxItemData, type Drop } from '@/services/drops-api';

const CARD_WIDTH = 180;

type RarityStyle = { label: string; colors: [string, string] };

/** Website rarity-badge: substring match in this order. */
function rarityStyle(rarity?: string): RarityStyle | null {
  if (!rarity) return null;
  const value = rarity.toLowerCase();
  if (value.includes('regular')) return { label: rarity, colors: ['#708090', '#4682b4'] };
  if (value.includes('secret')) return { label: 'Secret Rare', colors: ['#FFD700', '#B5A642'] };
  if (value.includes('legendary')) return { label: rarity, colors: ['#673AB7', '#3119bd'] };
  if (value.includes('rare')) return { label: rarity, colors: ['#228B22', '#50C878'] };
  return { label: rarity, colors: [AppColors.border, AppColors.border] };
}

/** Website odds: dropRemaining / itemRemaining, "0 in X" once the item is sold out. */
function oddsText(drop: Drop, item: BlindBoxItemData): string {
  const dropRemaining = (drop.total_editions || 0) - (drop.consumed_editions || 0);
  const itemRemaining = (item.total_editions || 0) - (item.consumed_editions || 0);
  if (item.total_editions === item.consumed_editions) return `Odds: 0 in ${dropRemaining}`;
  const calc = dropRemaining <= 0 || itemRemaining <= 0 ? '0' : (dropRemaining / itemRemaining).toFixed(2);
  return `Odds: 1 in ${calc}`;
}

export function BlindBoxItems({ drop }: { drop: Drop }) {
  const items = Array.isArray(drop.blind_box_items_data) ? drop.blind_box_items_data : [];
  if (items.length === 0) return null;
  const special = isSpecialDrop(drop._id);
  const isLayer2 = drop.type === 'Layer_2';

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Blind Box Items</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {items.map((item) => {
          const itemRemaining = (item.total_editions || 0) - (item.consumed_editions || 0);
          const rarity = special ? null : rarityStyle(item.rarity);
          const image = item.image?.[0]?.url;
          return (
            <Pressable
              key={item._id}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() =>
                router.push({ pathname: '/blindbox-item/[dropId]/[itemId]', params: { dropId: drop._id, itemId: item._id } })
              }>
              {/* Image area */}
              <View style={styles.thumbBox}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.thumb} contentFit="contain" transition={150} />
                ) : (
                  <Ionicons name="cube-outline" size={36} color={AppColors.textSecondary} />
                )}
              </View>

              {/* Content area — matches web's separated content section */}
              <View style={styles.content}>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {drop.title}
                </Text>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>

                <View style={styles.oddsRow}>
                  <Text style={styles.meta}>{oddsText(drop, item)}</Text>
                  <Text style={styles.meta}>{itemRemaining} left</Text>
                </View>

                <View style={styles.footerRow}>
                  {rarity ? (
                    <LinearGradient colors={rarity.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.rarityBadge}>
                      <Text style={styles.rarityText}>{rarity.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View />
                  )}
                  {isLayer2 ? (
                    <View style={styles.priceRow}>
                      <Image source={require('../../../assets/coin_icon.webp')} style={styles.coinIcon} contentFit="contain" />
                      <Text style={styles.price}>{drop.price || 0}</Text>
                    </View>
                  ) : (
                    <Text style={styles.price}>£{drop.price || 0}</Text>
                  )}
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
  },
  heading: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  list: {
    gap: 12,
    paddingHorizontal: 20,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  thumbBox: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 12,
    gap: 6,
  },
  subtitle: {
    color: AppColors.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  oddsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    color: AppColors.textSecondary,
    fontSize: 11,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rarityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinIcon: {
    width: 14,
    height: 14,
  },
  price: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});
