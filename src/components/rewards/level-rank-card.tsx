import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { RankInfoSheet, type RankInfoTopic } from '@/components/rewards/rank-info-sheet';
import { makeStyles, useAppColors } from '@/context/theme-context';
import type { ProfileLevel, ProfileTier } from '@/services/rewards-api';
import { useTranslation } from 'react-i18next';

const TIER_NUMERALS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function tierNumeral(tier: number): string {
  return TIER_NUMERALS[tier] ?? String(tier);
}

type Props = {
  loading?: boolean;
  level: ProfileLevel | null;
  tier: ProfileTier | null;
};

export function LevelRankCard({ loading, level, tier }: Props) {
  const { t } = useTranslation();
  const styles = useStyles();
  const [infoOpen, setInfoOpen] = useState<RankInfoTopic | null>(null);

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonBadge} />
          <View style={styles.skeletonBadge} />
        </View>
        <View style={styles.skeletonBar} />
      </View>
    );
  }

  if (!level || !tier) return null;


  const progress = Math.min(100, Math.max(0, level.progress_percent));

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        {/* Level — same layout as Rank: label, current level, then what the next level costs. */}
        <View style={styles.badgeCol}>
          <HexBadge value={String(level.level)} fontSize={20} />
          <View style={styles.badgeTextCol}>
            <View style={styles.labelRow}>
              <Text style={styles.badgeLabel}>{t('LEVEL')}</Text>
              <InfoButton label={t('How Levels works')} onPress={() => setInfoOpen('level')} />
            </View>
            <Text style={styles.valueText} numberOfLines={1}>{t('Level {{level}}', { level: level.level })}</Text>
            <Text style={styles.subText}>
              {level.is_max_level ? t('Max level reached') : t('{{xp}} XP to Level {{level}}', { xp: level.xp_to_next_level, level: level.level + 1 })}
            </Text>
          </View>
        </View>

        {/* Rank — badge on the outer edge, same badge as Level with the tier numeral. */}
        <View style={[styles.badgeCol, styles.badgeColRight]}>
          <View style={styles.badgeTextColRight}>
            <View style={styles.labelRow}>
              <Text style={styles.badgeLabel}>{t('RANK')}</Text>
              <InfoButton label={t('How Rank works')} onPress={() => setInfoOpen('rank')} />
            </View>
            <Text style={styles.valueText} numberOfLines={1}>{tier.name}</Text>
            <Text style={styles.subText}>{t('Level {{min}}–{{max}}', { min: tier.min_level, max: tier.max_level })}</Text>
          </View>
          <HexBadge value={tierNumeral(tier.tier)} fontSize={16} />
        </View>
      </View>

      <RankInfoSheet topic={infoOpen} currentTier={tier.tier} onClose={() => setInfoOpen(null)} />

      <View>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>
            {t('{{current}} / {{total}} XP', { current: level.xp_into_level, total: level.xp_into_level + level.xp_to_next_level })}
          </Text>
          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    </View>
  );
}

// Website badge (level-rank-card.html): solid hexagon in the text colour with the value knocked
// out in the page background colour — white-on-dark in dark theme, black-on-light in light.
const HEX_PATH = 'M26 1 L51 15.5 L51 44.5 L26 59 L1 44.5 L1 15.5 Z';

function HexBadge({ value, fontSize }: { value: string; fontSize: number }) {
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <View style={styles.hex}>
      <Svg width="100%" height="100%" viewBox="0 0 52 60" style={StyleSheet.absoluteFill}>
        <Path d={HEX_PATH} fill={AppColors.textPrimary} />
      </Svg>
      <Text style={[styles.hexText, { fontSize }]}>{value}</Text>
    </View>
  );
}

function InfoButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { t } = useTranslation();
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={10} onPress={onPress} style={styles.info}>
      <Text style={styles.infoText}>{t('i')}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((AppColors) => ({
  card: {
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 14,
    padding: 16,
    gap: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  badgeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  badgeColRight: {
    justifyContent: 'flex-end',
  },
  hex: {
    width: 48,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexText: {
    color: AppColors.background,
    fontWeight: '900',
  },
  badgeTextCol: {
    flexShrink: 1,
  },
  badgeTextColRight: {
    alignItems: 'flex-end',
    flexShrink: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeLabel: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  info: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.borderFocused,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    color: AppColors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },
  valueText: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  subText: {
    color: AppColors.textSecondary,
    fontSize: 11,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: AppColors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  progressPercent: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: AppColors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: AppColors.textPrimary,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  skeletonBadge: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    backgroundColor: AppColors.border,
  },
  skeletonBar: {
    height: 10,
    borderRadius: 999,
    backgroundColor: AppColors.border,
  },
}));
