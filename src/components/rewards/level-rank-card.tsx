import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';
import type { ProfileLevel, ProfileTier } from '@/services/rewards-api';

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
  const [infoOpen, setInfoOpen] = useState<'level' | 'rank' | null>(null);

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

  const toggleInfo = (key: 'level' | 'rank') =>
    setInfoOpen((prev) => (prev === key ? null : key));

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        {/* Level */}
        <View style={styles.badgeCol}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{level.level}</Text>
          </View>
          <View style={styles.badgeTextCol}>
            <View style={styles.labelRow}>
              <Text style={styles.badgeLabel}>LEVEL</Text>
              <Pressable hitSlop={8} onPress={() => toggleInfo('level')}>
                <Ionicons
                  name={infoOpen === 'level' ? 'information-circle' : 'information-circle-outline'}
                  size={14}
                  color={AppColors.textSecondary}
                />
              </Pressable>
            </View>
            <Text style={styles.badgeSubtext}>
              {level.is_max_level ? 'Max level reached' : `${level.xp_to_next_level} XP to Level ${level.level + 1}`}
            </Text>
          </View>
        </View>

        {/* Rank */}
        <View style={[styles.badgeCol, styles.badgeColRight]}>
          <View style={styles.badgeTextColRight}>
            <View style={styles.labelRowRight}>
              <Pressable hitSlop={8} onPress={() => toggleInfo('rank')}>
                <Ionicons
                  name={infoOpen === 'rank' ? 'information-circle' : 'information-circle-outline'}
                  size={14}
                  color={AppColors.textSecondary}
                />
              </Pressable>
              <Text style={styles.badgeLabel}>RANK</Text>
            </View>
            <Text style={[styles.badgeSubtext, styles.textRight]}>{tier.name}</Text>
            <Text style={[styles.badgeSubtext, styles.textRight]}>Level {tier.min_level}–{tier.max_level}</Text>
          </View>
          <View style={[styles.levelBadge, styles.tierBadge]}>
            <Text style={styles.levelBadgeText}>{tierNumeral(tier.tier)}</Text>
          </View>
        </View>
      </View>

      {/* Info dropdowns */}
      {infoOpen === 'level' ? (
        <View style={styles.infoBubble}>
          <Text style={styles.infoText}>
            Your XP level increases as you earn XP by completing activities. Each level requires more XP to progress.
          </Text>
        </View>
      ) : null}
      {infoOpen === 'rank' ? (
        <View style={styles.infoBubble}>
          <Text style={styles.infoText}>
            Your rank tier is determined by your current level. Progress through levels to advance to higher rank tiers and unlock more rewards.
          </Text>
        </View>
      ) : null}

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, level.progress_percent))}%` }]} />
      </View>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>
          {level.xp_into_level} / {level.xp_into_level + level.xp_to_next_level} XP
        </Text>
        <Text style={styles.progressLabel}>{Math.round(level.progress_percent)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  badgeColRight: {
    justifyContent: 'flex-end',
  },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(61,139,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBadge: {
    backgroundColor: 'rgba(245,180,0,0.15)',
  },
  levelBadgeText: {
    color: AppColors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
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
    gap: 4,
  },
  labelRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeLabel: {
    color: AppColors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeSubtext: {
    color: AppColors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  textRight: {
    textAlign: 'right',
  },
  infoBubble: {
    backgroundColor: 'rgba(61,139,255,0.1)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(61,139,255,0.2)',
  },
  infoText: {
    color: AppColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: AppColors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: AppColors.link,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: AppColors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  skeletonBadge: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: AppColors.border,
  },
  skeletonBar: {
    height: 6,
    borderRadius: 999,
    backgroundColor: AppColors.border,
  },
});
