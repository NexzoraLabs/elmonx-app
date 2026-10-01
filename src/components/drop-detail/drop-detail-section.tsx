import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { DetailImageCarousel } from '@/components/collection-detail/detail-image-carousel';
import { ViewIn3DButton } from '@/components/collection-detail/view-in-3d-button';
import { Viewer3DModal } from '@/components/collection-detail/viewer-3d-modal';
import { BlindBoxItems } from '@/components/drop-detail/blind-box-items';
import { DropAccordion } from '@/components/drop-detail/drop-accordion';
import { DropInfoCard } from '@/components/drop-detail/drop-info-card';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import {
  getPlatformUnityAsset,
  slugify,
  toggleDropLike,
  type Currency,
  type CurrencyRates,
  type Drop,
} from '@/services/drops-api';
import { isUnityViewerAvailable, presentUnityViewer } from '@/services/unity-bridge';

type Props = {
  drop: Drop;
  currency: Currency;
  rates: CurrencyRates;
  onCurrencyChange: (currency: Currency) => void;
  /** Comments count lives in the parent so the comments sheet can update it. */
  commentsCount: number;
  onOpenComments: (drop: Drop) => void;
  onOpenAllowlist: (drop: Drop) => void;
};

/** One drop, laid out like the website's drop-details block (same checks, minus purchasing). */
export function DropDetailSection({
  drop,
  currency,
  rates,
  onCurrencyChange,
  commentsCount,
  onOpenComments,
  onOpenAllowlist,
}: Props) {
  const { token } = useAuth();
  const [liked, setLiked] = useState(Boolean(drop.self_like));
  const [likes, setLikes] = useState(drop.total_likes ?? 0);
  const [viewerVisible, setViewerVisible] = useState(false);

  const remaining = (drop.total_editions || 0) - (drop.consumed_editions || 0);
  const image = drop.images?.[0]?.original_url;
  const platformAsset = getPlatformUnityAsset(drop);
  const unityEntry = drop.unity_assets?.[0];
  const isPrivate = drop.sale_title === 'Private';
  const isLayer2 = drop.type === 'Layer_2';

  const requireAuth = () => {
    if (token) return true;
    Alert.alert('Sign in required', 'Please sign in to continue.');
    return false;
  };

  const handleLike = async () => {
    if (!requireAuth() || !token) return;
    // Optimistic like, then trust the server's count (website behaviour).
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikes((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));
    try {
      const res = await toggleDropLike(token, drop._id);
      setLiked(res.liked);
      setLikes(res.likes_count);
    } catch (e) {
      setLiked(!nextLiked);
      setLikes((prev) => Math.max(0, prev + (nextLiked ? -1 : 1)));
      Alert.alert('Error', e instanceof Error ? e.message : 'Unable to like.');
    }
  };

  const handleShare = () => {
    if (!requireAuth()) return;
    const url = `https://elmonx.com/drop/${slugify(drop.title)}/${drop._id}`;
    Share.share({ message: url, url });
  };

  const handleViewIn3D = () => {
    if (unityEntry && platformAsset && isUnityViewerAvailable()) {
      presentUnityViewer(unityEntry, platformAsset);
    } else {
      setViewerVisible(true);
    }
  };

  return (
    <View>
      <DetailImageCarousel images={image ? [image] : []} color={AppColors.surface} />

      {platformAsset ? <ViewIn3DButton onPress={handleViewIn3D} /> : null}

      <View style={styles.titleBlock}>
        {isPrivate ? (
          <Pressable
            disabled={!isLayer2}
            onPress={() => onOpenAllowlist(drop)}
            style={({ pressed }) => [styles.privatePill, pressed && styles.pressed]}>
            <Text style={styles.privateText}>PRIVATE SALE</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>{drop.title}</Text>

        <View style={styles.socialRow}>
          <Pressable style={styles.socialItem} hitSlop={6} onPress={handleLike}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? AppColors.danger : AppColors.textPrimary} />
            <Text style={styles.socialText}>{likes}</Text>
          </Pressable>
          <Pressable
            style={styles.socialItem}
            hitSlop={6}
            onPress={() => requireAuth() && onOpenComments(drop)}>
            <Ionicons name="chatbubble-outline" size={19} color={AppColors.textPrimary} />
            <Text style={styles.socialText}>{commentsCount}</Text>
          </Pressable>
          <Pressable style={styles.socialItem} hitSlop={6} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={AppColors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <DropInfoCard
        drop={drop}
        remaining={remaining}
        currency={currency}
        rates={rates}
        onCurrencyChange={onCurrencyChange}
      />

      {drop.is_country_blocked ? (
        <View style={styles.disclaimer}>
          <Ionicons name="warning-outline" size={16} color={AppColors.gold} />
          <Text style={styles.disclaimerText}>
            Due to licensing restrictions, this drop is not accessible to users located in{' '}
            {(drop.block_country_list ?? []).map((c) => `"${c.name}"`).join(', ')}.
          </Text>
        </View>
      ) : null}

      <DropAccordion drop={drop} remaining={remaining} onCheckAllowlist={() => onOpenAllowlist(drop)} />

      <BlindBoxItems drop={drop} />

      <Viewer3DModal visible={viewerVisible} onClose={() => setViewerVisible(false)} title={drop.title} imageUrl={image} />
    </View>
  );
}

const styles = StyleSheet.create({
  titleBlock: {
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 8,
  },
  privatePill: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.buttonPrimaryBg,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  privateText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 2,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socialText: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(245,180,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,180,0,0.3)',
  },
  disclaimerText: {
    flex: 1,
    color: AppColors.gold,
    fontSize: 12,
    lineHeight: 18,
  },
});
