import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Share, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { haptic, PressableScale } from '@/components/motion';
import { SegmentTabs } from '@/components/social/segment-tabs';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useAuth } from '@/context/auth-context';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { appLocale } from '@/i18n';
import { buildStatementCsv, getCaratHistoryBetween } from '@/services/wallet-api';

type Props = { visible: boolean; onClose: () => void };

// Translated where rendered (SegmentTabs → t(option)).
const MODES = ['Month', 'Year', 'Custom range'] as const;
type Mode = (typeof MODES)[number];

// Months are counted as one number (year * 12 + month) so ranges are simple comparisons.
const toIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();
const monthStart = (index: number) => new Date(Math.floor(index / 12), index % 12, 1);
const monthKey = (index: number) => `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;

/**
 * "Export statement": share X-Coin transactions for a month, a whole year or a range of months as a CSV
 * (website parity). Month boundaries are the phone's own time zone. iOS shares the file itself (Save to
 * Files, Mail, AirDrop…); Android's share sheet only carries text, so there the CSV goes as text.
 */
export function ExportStatementSheet({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { token } = useAuth();
  const [nowIndex] = useState(() => toIndex(new Date()));
  const [mode, setMode] = useState<Mode>('Month');
  const [month, setMonth] = useState(nowIndex);
  const [year, setYear] = useState(Math.floor(nowIndex / 12));
  const [from, setFrom] = useState(nowIndex - 2);
  const [to, setTo] = useState(nowIndex);
  const [exporting, setExporting] = useState(false);

  const locale = appLocale('en-GB');
  const monthLabel = (index: number) => monthStart(index).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const shortMonthLabel = (index: number) => monthStart(index).toLocaleDateString(locale, { month: 'short', year: 'numeric' });

  // [start, end) month indexes + the file name suffix for the chosen mode.
  const range =
    mode === 'Month'
      ? { start: month, end: month + 1, suffix: monthKey(month) }
      : mode === 'Year'
        ? { start: year * 12, end: year * 12 + 12, suffix: String(year) }
        : { start: from, end: to + 1, suffix: from === to ? monthKey(from) : `${monthKey(from)}_to_${monthKey(to)}` };

  const handleExport = async () => {
    if (!token || exporting) return;
    setExporting(true);
    try {
      const rows = await getCaratHistoryBetween(token, monthStart(range.start), monthStart(range.end));
      if (rows.length === 0) {
        Alert.alert(t('Export statement'), t('No transactions in that period.'));
        return;
      }
      const csv = buildStatementCsv(rows);
      const fileName = `elmonx-xcoin-transactions-${range.suffix}.csv`;
      if (Platform.OS === 'ios') {
        const file = new File(Paths.cache, fileName);
        file.create({ overwrite: true });
        file.write(csv);
        await Share.share({ url: file.uri });
      } else {
        await Share.share({ title: fileName, message: csv });
      }
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), e instanceof Error ? e.message : t('Could not export transactions. Please try again.'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={() => !exporting && onClose()}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('Export statement')}</Text>
        <Text style={styles.subtitle}>
          {t('Choose a month, a year or a range of months to export your X-Coin transactions as a spreadsheet (CSV).')}
        </Text>

        <SegmentTabs options={MODES} selected={mode} onSelect={(option) => setMode(option as Mode)} />

        {mode === 'Month' && (
          <Stepper
            label={monthLabel(month)}
            prevLabel={t('Previous month')}
            nextLabel={t('Next month')}
            onPrev={() => setMonth(month - 1)}
            onNext={() => setMonth(month + 1)}
            nextDisabled={month >= nowIndex}
          />
        )}

        {mode === 'Year' && (
          <Stepper
            label={String(year)}
            prevLabel={t('Previous year')}
            nextLabel={t('Next year')}
            onPrev={() => setYear(year - 1)}
            onNext={() => setYear(year + 1)}
            nextDisabled={year >= Math.floor(nowIndex / 12)}
          />
        )}

        {mode === 'Custom range' && (
          <View style={styles.rangeRows}>
            <View style={styles.rangeRow}>
              <Text style={styles.rangeLabel}>{t('From')}</Text>
              <View style={styles.rangeStepper}>
                <Stepper
                  label={shortMonthLabel(from)}
                  prevLabel={t('Previous month')}
                  nextLabel={t('Next month')}
                  onPrev={() => setFrom(from - 1)}
                  onNext={() => setFrom(from + 1)}
                  nextDisabled={from >= to}
                />
              </View>
            </View>
            <View style={styles.rangeRow}>
              <Text style={styles.rangeLabel}>{t('To')}</Text>
              <View style={styles.rangeStepper}>
                <Stepper
                  label={shortMonthLabel(to)}
                  prevLabel={t('Previous month')}
                  nextLabel={t('Next month')}
                  onPrev={() => setTo(to - 1)}
                  onNext={() => setTo(to + 1)}
                  prevDisabled={to <= from}
                  nextDisabled={to >= nowIndex}
                />
              </View>
            </View>
          </View>
        )}

        <PressableScale
          pressScale="button"
          haptic="light"
          accessibilityRole="button"
          disabled={exporting}
          onPress={handleExport}
          style={[styles.exportButton, exporting && styles.dimmed]}>
          {exporting ? (
            <ActivityIndicator size="small" color={AppColors.buttonPrimaryText} />
          ) : (
            <Text style={styles.exportText}>{t('Export CSV')}</Text>
          )}
        </PressableScale>
      </View>
    </BottomSheet>
  );
}

type StepperProps = {
  label: string;
  prevLabel: string;
  nextLabel: string;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
};

/** ‹ label › row used for the month, the year and each end of the range. */
function Stepper({ label, prevLabel, nextLabel, onPrev, onNext, prevDisabled, nextDisabled }: StepperProps) {
  const AppColors = useAppColors();
  const styles = useStyles();
  const press = (fn: () => void) => () => {
    haptic('selection');
    fn();
  };
  return (
    <View style={styles.monthRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={prevLabel}
        disabled={prevDisabled}
        hitSlop={8}
        onPress={press(onPrev)}
        style={({ pressed }) => [styles.arrow, (pressed || prevDisabled) && styles.dimmed]}>
        <Ionicons name="chevron-back" size={18} color={AppColors.textPrimary} />
      </Pressable>
      <Text style={styles.monthLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={nextLabel}
        disabled={nextDisabled}
        hitSlop={8}
        onPress={press(onNext)}
        style={({ pressed }) => [styles.arrow, (pressed || nextDisabled) && styles.dimmed]}>
        <Ionicons name="chevron-forward" size={18} color={AppColors.textPrimary} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: AppColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  rangeRows: {
    gap: 10,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rangeLabel: {
    width: 44,
    color: AppColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  rangeStepper: {
    flex: 1,
  },
  exportButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: AppColors.buttonPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  dimmed: {
    opacity: 0.5,
  },
}));
