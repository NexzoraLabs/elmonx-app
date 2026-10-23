import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useTranslation } from 'react-i18next';

export type RankInfoTopic = 'level' | 'rank';

// Same fixed tables as the website's rank-info-modal (level curve is fixed math, not backend config).
const LEVEL_XP_TABLE = [
  { level: 1, xp: '0' },
  { level: 5, xp: '200' },
  { level: 10, xp: '950' },
  { level: 15, xp: '2,300' },
  { level: 20, xp: '4,400' },
  { level: 25, xp: '7,200' },
  { level: 30, xp: '10,700' },
  { level: 35, xp: '14,900' },
  { level: 40, xp: '20,100' },
  { level: 45, xp: '26,100' },
  { level: 50, xp: '32,800' },
  { level: 55, xp: '40,400' },
  { level: 60, xp: '48,900' },
  { level: 65, xp: '58,400' },
  { level: 70, xp: '68,800' },
  { level: 75, xp: '80,000' },
  { level: 80, xp: '92,300' },
  { level: 85, xp: '105,400' },
  { level: 90, xp: '119,600' },
  { level: 95, xp: '134,600' },
  { level: 100, xp: '150,700' },
];

const RANK_TIERS = [
  { tier: 1, name: 'Viewing', minLevel: 1, maxLevel: 10 },
  { tier: 2, name: 'Paddle', minLevel: 11, maxLevel: 20 },
  { tier: 3, name: 'Hammer', minLevel: 21, maxLevel: 30 },
  { tier: 4, name: 'Vault', minLevel: 31, maxLevel: 40 },
  { tier: 5, name: 'Provenance', minLevel: 41, maxLevel: 50 },
  { tier: 6, name: 'Blue Chip', minLevel: 51, maxLevel: 60 },
  { tier: 7, name: 'Masterwork', minLevel: 61, maxLevel: 70 },
  { tier: 8, name: 'Landmark', minLevel: 71, maxLevel: 80 },
  { tier: 9, name: 'Estate', minLevel: 81, maxLevel: 90 },
  { tier: 10, name: 'Canon', minLevel: 91, maxLevel: 100 },
];

const TITLES: Record<RankInfoTopic, string> = {
  level: 'How Levels works',
  rank: 'How Rank works',
};

type Props = {
  topic: RankInfoTopic | null;
  currentTier: number | null;
  onClose: () => void;
};

export function RankInfoSheet({ topic, currentTier, onClose }: Props) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <BottomSheet visible={topic !== null} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>{topic ? t(TITLES[topic]) : ''}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('Close')} hitSlop={8} onPress={onClose} style={styles.close}>
          <Ionicons name="close" size={18} color={AppColors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {topic === 'level' ? (
          <>
            <Text style={styles.paragraph}>
              {t('You earn XP by completing daily actions and social quests — the more you do, the faster you level up. Each level takes a little more XP than the one before, so progress is quick at first and stretches out the further you climb.')}
            </Text>
            <Text style={styles.paragraph}>
              {t('Your progress bar shows how close you are to the next level — once it fills up, you level up automatically and the bar resets.')}
            </Text>
            <Text style={styles.sectionLabel}>{t('XP NEEDED BY LEVEL')}</Text>
            <View style={styles.grid}>
              {LEVEL_XP_TABLE.map((row) => (
                <View key={row.level} style={styles.gridCell}>
                  <Text style={styles.cellLevel}>{t('LVL {{n}}', { n: row.level })}</Text>
                  <Text style={styles.cellXp}>{t('{{n}} XP', { n: row.xp })}</Text>
                </View>
              ))}
            </View>
          </>
        ) : topic === 'rank' ? (
          <>
            <Text style={styles.paragraph}>
              {t('Your rank is based on your level — climb through ten ranks as you level up, from Viewing all the way to Canon.')}
            </Text>
            <View style={styles.tierList}>
              {RANK_TIERS.map((tier, i) => {
                const isYou = tier.tier === currentTier;
                return (
                  <View
                    key={tier.tier}
                    style={[styles.tierRow, i < RANK_TIERS.length - 1 && styles.tierDivider, isYou && styles.tierRowYou]}>
                    <View style={styles.tierNameWrap}>
                      <Text style={styles.tierName}>{tier.name}</Text>
                      {isYou ? (
                        <View style={styles.youBadge}>
                          <Text style={styles.youText}>{t('YOU')}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.tierRange}>
                      {t('Level {{min}}–{{max}}', { min: tier.minLevel, max: tier.maxLevel })}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.note}>{t('More rank perks are on the way — for now, your rank simply tracks your level.')}</Text>
          </>
        ) : null}
      </ScrollView>
    </BottomSheet>
  );
}

const useStyles = makeStyles((AppColors) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    maxHeight: 520,
  },
  body: {
    gap: 14,
    paddingBottom: 8,
  },
  paragraph: {
    color: AppColors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  sectionLabel: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCell: {
    width: '31.5%',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.background,
  },
  cellLevel: {
    color: AppColors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  cellXp: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  tierList: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  tierDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  tierRowYou: {
    backgroundColor: AppColors.subtleFill,
  },
  tierNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierName: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: AppColors.buttonPrimaryBg,
  },
  youText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  tierRange: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  note: {
    color: AppColors.textPlaceholder,
    fontSize: 12,
    lineHeight: 17,
  },
}));
