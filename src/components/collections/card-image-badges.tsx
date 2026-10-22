import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageSource } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import type { CollectionGridItem } from '@/data/collections-mock';

/**
 * Badges laid over the bottom-left of an NFT card's artwork (Collections grid + Home cards), same
 * checks as the website's nft-card: edition type (Digital Proof / Artist Proof / Study), the blind
 * box item's rarity, and "Airdrop" when the drop is free.
 *
 * Artwork from design (`assets/images/badges/`): the edition tags are complete images (icon + text
 * baked in, English only); the rarity labels are blank gradient pills with the text drawn on top.
 * `DigitalProofTag.png` was generated from the Artist Proof tag in blue until design supplies one.
 */
export function CardImageBadges({ item }: { item: CollectionGridItem }) {
  const { t } = useTranslation();
  const edition = editionTag(item.dropEdition);
  const rarity = rarityOf(item.rarity);
  const isAirdrop = item.priceKind === 'airdrop';
  if (!edition && !rarity && !isAirdrop) return null;

  return (
    <View style={styles.row} pointerEvents="none">
      {edition ? (
        <Image
          source={edition.source}
          style={{ height: BADGE_HEIGHT, width: BADGE_HEIGHT * edition.aspect }}
          contentFit="contain"
          accessibilityLabel={t(edition.label)}
        />
      ) : null}
      {rarity ? <RarityBadge rarity={rarity} /> : null}
      {isAirdrop ? <AirdropBadge /> : null}
    </View>
  );
}

const BADGE_HEIGHT = 18;

type EditionTag = { label: string; source: ImageSource; aspect: number };

// Website nft-card: isDigitalProof / isArtistProof / isStudyEdition. Aspect = image width / height.
function editionTag(edition?: string): EditionTag | null {
  if (!edition) return null;
  const lower = edition.toLowerCase();
  if (edition === 'Digital Proof') {
    return { label: 'Digital Proof', source: require('@/assets/images/badges/DigitalProofTag.png'), aspect: 694 / 160 };
  }
  if (lower === 'artist proof' || lower === 'artist_proof') {
    return { label: 'Artist Proof', source: require('@/assets/images/badges/ArtistProofTag.png'), aspect: 624 / 160 };
  }
  if (edition === 'Study') {
    return { label: 'Study', source: require('@/assets/images/badges/StudyTag.png'), aspect: 472 / 160 };
  }
  return null;
}

type Rarity = 'Regular' | 'Rare' | 'Secret Rare' | 'Legendary';

// Website rarity-badge: getRarityLabel (order matters — "Secret Rare" contains "rare").
function rarityOf(rarity?: string): Rarity | null {
  const lower = rarity?.toLowerCase() ?? '';
  if (!lower) return null;
  if (lower.includes('regular')) return 'Regular';
  if (lower.includes('secret')) return 'Secret Rare';
  if (lower.includes('legendary')) return 'Legendary';
  if (lower.includes('rare')) return 'Rare';
  return null;
}

// Blank gradient pills (480×108) — the label is drawn on top.
const RARITY_BACKGROUND: Record<Rarity, ImageSource> = {
  Regular: require('@/assets/images/badges/RegularLabel.png'),
  Rare: require('@/assets/images/badges/RareLabel.png'),
  'Secret Rare': require('@/assets/images/badges/SecretRareLabel.png'),
  Legendary: require('@/assets/images/badges/LegendaryLabel.png'),
};
const RARITY_ASPECT = 480 / 108;

function RarityBadge({ rarity }: { rarity: Rarity }) {
  const { t } = useTranslation();
  return (
    <View style={styles.rarity}>
      <Image source={RARITY_BACKGROUND[rarity]} style={StyleSheet.absoluteFill} contentFit="fill" />
      <Ionicons name="sparkles" size={8} color="#fff" />
      <Text style={styles.text} numberOfLines={1}>
        {t(rarity)}
      </Text>
    </View>
  );
}

function AirdropBadge() {
  const { t } = useTranslation();
  return (
    <View style={styles.airdrop}>
      <Ionicons name="gift" size={9} color="#fff" />
      <Text style={styles.text}>{t('Airdrop')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  rarity: {
    height: BADGE_HEIGHT,
    minWidth: BADGE_HEIGHT * RARITY_ASPECT,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: BADGE_HEIGHT / 2,
    overflow: 'hidden',
  },
  airdrop: {
    height: BADGE_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    borderRadius: BADGE_HEIGHT / 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  text: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});
