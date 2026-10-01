import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';
import { isSpecialDrop, type BlindBoxItemData, type Drop } from '@/services/drops-api';

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
  const items = drop.blind_box_items_data ?? [];
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
            <View key={item._id} style={styles.card}>
              <View style={styles.thumbBox}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.thumb} contentFit="contain" transition={150} />
                ) : (
                  <Ionicons name="cube-outline" size={28} color={AppColors.textSecondary} />
                )}
                {rarity ? (
                  <LinearGradient colors={rarity.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.rarity}>
                    <Text style={styles.rarityText}>{rarity.label}</Text>
                  </LinearGradient>
                ) : null}
              </View>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {drop.title}
              </Text>
              <Text style={styles.meta}>{oddsText(drop, item)}</Text>
              <View style={styles.footerRow}>
                <Text style={styles.meta}>{itemRemaining} left</Text>
                {isLayer2 ? (
                  <View style={styles.priceRow}>
                    <Ionicons name="logo-bitcoin" size={12} color={AppColors.gold} />
                    <Text style={styles.price}>{drop.price || 0}</Text>
                  </View>
                ) : (
                  <Text style={styles.price}>£{drop.price || 0}</Text>
                )}
              </View>
            </View>
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
    width: 150,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 10,
    gap: 3,
  },
  thumbBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 6,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  rarity: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rarityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    color: AppColors.textSecondary,
    fontSize: 11,
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  price: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
});
