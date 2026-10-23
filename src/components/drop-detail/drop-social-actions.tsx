import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';

import { SHARE_URL } from '@/config/env';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import { slugify, toggleDropLike, type Drop } from '@/services/drops-api';
import { useTranslation } from 'react-i18next';
import { haptic, PopIcon } from '@/components/motion';

type Props = {
  drop: Drop;
  /** Comments count lives in the screen so the comments sheet can update it. */
  commentsCount: number;
  onOpenComments: (drop: Drop) => void;
};

/** Like / comment / share for one drop (website behaviour). Sits in the single-drop header, or under
 * each drop's title on a collection page. */
export function DropSocialActions({ drop, commentsCount, onOpenComments }: Props) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { token } = useAuth();
  const [liked, setLiked] = useState(Boolean(drop.self_like));
  const [likes, setLikes] = useState(drop.total_likes ?? 0);
  const likeBusy = useRef(false);

  const requireAuth = () => {
    if (token) return true;
    Alert.alert(t('Sign in required'), t('Please sign in to continue.'));
    return false;
  };

  const handleLike = async () => {
    // Website dropLikeBusyIds: ignore taps while a toggle is in flight, or two toggles race.
    if (!requireAuth() || !token || likeBusy.current) return;
    likeBusy.current = true;
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
      Alert.alert(t('Error'), e instanceof Error ? e.message : t('Unable to like.'));
    } finally {
      likeBusy.current = false;
    }
  };

  // Website: sharing needs no sign-in.
  const handleShare = () => {
    const url = `${SHARE_URL}/drop/${slugify(drop.title)}/${drop._id}`;
    Share.share({ message: url, url });
  };

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.item}
        hitSlop={6}
        onPress={() => {
          haptic('light');
          handleLike();
        }}
        accessibilityRole="button"
        accessibilityLabel={liked ? t('Unlike') : t('Like')}>
        <PopIcon active={liked}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? AppColors.danger : AppColors.textPrimary} />
        </PopIcon>
        <Text style={styles.count}>{likes}</Text>
      </Pressable>
      <Pressable
        style={styles.item}
        hitSlop={6}
        onPress={() => requireAuth() && onOpenComments(drop)}
        accessibilityRole="button"
        accessibilityLabel={t('Comments')}>
        <Ionicons name="chatbubble-outline" size={19} color={AppColors.textPrimary} />
        <Text style={styles.count}>{commentsCount}</Text>
      </Pressable>
      <Pressable style={styles.item} hitSlop={6} onPress={handleShare} accessibilityRole="button" accessibilityLabel={t('Share')}>
        <Ionicons name="share-outline" size={20} color={AppColors.textPrimary} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  count: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
}));
