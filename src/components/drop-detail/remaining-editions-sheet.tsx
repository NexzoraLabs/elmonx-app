import { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PressableScale } from '@/components/motion';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { makeStyles } from '@/context/theme-context';
import { getRemainingEditions, type RemainingEdition } from '@/services/drops-api';

type Props = {
  /** Drop to list; null keeps the sheet closed. */
  drop: { _id: string; title: string } | null;
  onClose: () => void;
};

const SKELETON_ROWS = [0, 1, 2, 3, 4];

/** Website "Check Remaining" modal: unsold editions (token id + name) of a Layer 2 drop. */
export function RemainingEditionsSheet({ drop, onClose }: Props) {
  return (
    <BottomSheet visible={drop !== null} onClose={onClose}>
      {drop ? <RemainingEditionsContent key={drop._id} drop={drop} onClose={onClose} /> : null}
    </BottomSheet>
  );
}

function RemainingEditionsContent({ drop, onClose }: { drop: { _id: string; title: string }; onClose: () => void }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const { height } = useWindowDimensions();
  const [editions, setEditions] = useState<RemainingEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setEditions(await getRemainingEditions(drop._id));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [drop._id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  return (
    <View style={[styles.container, { maxHeight: height * 0.65 }]}>
      <Text style={styles.title}>{t('Remaining Editions')}</Text>

      {loading ? (
        <View style={styles.skeletons}>
          {SKELETON_ROWS.map((row) => (
            <View key={row} style={styles.row}>
              <Skeleton width="60%" height={14} />
              <Skeleton width="18%" height={14} />
            </View>
          ))}
        </View>
      ) : failed ? (
        <View style={styles.messageBox}>
          <Text style={styles.message}>{t("Couldn't load remaining editions.")}</Text>
          <PressableScale pressScale="button" onPress={load} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>{t('Try Again')}</Text>
          </PressableScale>
        </View>
      ) : editions.length === 0 ? (
        <View style={styles.messageBox}>
          <Text style={styles.message}>{t('No editions remaining.')}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.count}>
            {editions.length === 1 ? t('1 edition available') : t('{{n}} editions available', { n: editions.length })}
          </Text>
          <FlatList
            data={editions}
            keyExtractor={(item) => item.token_id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name || drop.title}
                </Text>
                <Text style={styles.token}>{t('Token #{{id}}', { id: item.token_id })}</Text>
              </View>
            )}
          />
        </>
      )}

      <PressableScale pressScale="button" haptic="light" onPress={onClose} style={styles.button}>
        <Text style={styles.buttonText}>{t('Close')}</Text>
      </PressableScale>
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  container: {
    gap: 12,
    paddingBottom: 8,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  count: {
    color: AppColors.textSecondary,
    fontSize: 12,
  },
  skeletons: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  name: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 13,
  },
  token: {
    color: AppColors.textSecondary,
    fontSize: 12,
  },
  messageBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  message: {
    color: AppColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  secondaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  secondaryButtonText: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.buttonPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 15,
    fontWeight: '700',
  },
}));
