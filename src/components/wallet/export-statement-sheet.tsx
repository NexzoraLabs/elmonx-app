import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Share, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { haptic, PressableScale } from '@/components/motion';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useAuth } from '@/context/auth-context';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { appLocale } from '@/i18n';
import { buildStatementCsv, getCaratHistoryBetween } from '@/services/wallet-api';

type Props = { visible: boolean; onClose: () => void };

const monthStart = (year: number, month: number) => new Date(year, month, 1);

/**
 * "Export statement": pick a month, share that month's X-Coin transactions as a CSV (website parity).
 * iOS shares the file itself (Save to Files, Mail, AirDrop…); Android's share sheet only carries text,
 * so there the CSV goes as text.
 */
export function ExportStatementSheet({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { token } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [exporting, setExporting] = useState(false);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const label = monthStart(year, month).toLocaleDateString(appLocale('en-GB'), { month: 'long', year: 'numeric' });

  const shift = (delta: number) => {
    haptic('selection');
    const next = monthStart(year, month + delta);
    if (next > monthStart(now.getFullYear(), now.getMonth())) return;
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const handleExport = async () => {
    if (!token || exporting) return;
    setExporting(true);
    try {
      const rows = await getCaratHistoryBetween(token, monthStart(year, month), monthStart(year, month + 1));
      if (rows.length === 0) {
        Alert.alert(t('Export statement'), t('No transactions in that month.'));
        return;
      }
      const csv = buildStatementCsv(rows);
      const fileName = `elmonx-xcoin-transactions-${year}-${String(month + 1).padStart(2, '0')}.csv`;
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
        <Text style={styles.subtitle}>{t('Choose a month to export your X-Coin transactions as a spreadsheet (CSV).')}</Text>

        <View style={styles.monthRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Previous month')}
            hitSlop={8}
            onPress={() => shift(-1)}
            style={({ pressed }) => [styles.arrow, pressed && styles.dimmed]}>
            <Ionicons name="chevron-back" size={18} color={AppColors.textPrimary} />
          </Pressable>
          <Text style={styles.monthLabel}>{label}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Next month')}
            disabled={isCurrentMonth}
            hitSlop={8}
            onPress={() => shift(1)}
            style={({ pressed }) => [styles.arrow, (pressed || isCurrentMonth) && styles.dimmed]}>
            <Ionicons name="chevron-forward" size={18} color={AppColors.textPrimary} />
          </Pressable>
        </View>

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
