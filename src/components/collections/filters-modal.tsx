import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { SelectPill } from '@/components/collections/select-pill';
import { AppColors } from '@/constants/app-colors';
import { ARTISTS } from '@/data/artists-mock';
import { RARITY_FILTERS, STATUS_FILTERS } from '@/data/filters-mock';

export type CollectionFilters = {
  status: string | null;
  artistId: string | null;
  priceMin: string;
  priceMax: string;
  rarity: string | null;
};

export const DEFAULT_FILTERS: CollectionFilters = {
  status: null,
  artistId: null,
  priceMin: '',
  priceMax: '',
  rarity: null,
};

type FiltersModalProps = {
  visible: boolean;
  onClose: () => void;
  filters: CollectionFilters;
  onApply: (filters: CollectionFilters) => void;
};

export function FiltersModal({ visible, onClose, filters, onApply }: FiltersModalProps) {
  const [draft, setDraft] = useState(filters);
  const [artistPickerOpen, setArtistPickerOpen] = useState(false);

  const selectedArtist = ARTISTS.find((artist) => artist.id === draft.artistId);

  const handleClear = () => setDraft(DEFAULT_FILTERS);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={() => setDraft(filters)}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={onClose}>
            <View style={styles.closeButton}>
              <Ionicons name="close" size={20} color={AppColors.textPrimary} />
            </View>
          </Pressable>
          <Text style={styles.headerTitle}>Filters</Text>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={handleClear}>
            <Text style={styles.clearLabel}>Clear Filter</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.pillRow}>
            {STATUS_FILTERS.map((status) => (
              <SelectPill
                key={status}
                label={status}
                selected={draft.status === status}
                onPress={() =>
                  setDraft((prev) => ({ ...prev, status: prev.status === status ? null : status }))
                }
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Artist</Text>
          <Pressable
            style={styles.dropdown}
            onPress={() => setArtistPickerOpen((prev) => !prev)}>
            <Text style={selectedArtist ? styles.dropdownValue : styles.dropdownPlaceholder}>
              {selectedArtist?.name ?? 'Select Artist'}
            </Text>
            <Ionicons
              name={artistPickerOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={AppColors.textSecondary}
            />
          </Pressable>
          {artistPickerOpen ? (
            <View style={styles.dropdownList}>
              {ARTISTS.map((artist) => (
                <Pressable
                  key={artist.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setDraft((prev) => ({ ...prev, artistId: artist.id }));
                    setArtistPickerOpen(false);
                  }}>
                  <Text style={styles.dropdownItemLabel}>{artist.name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Price</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceField}>
              <Text style={styles.priceLabel}>Min</Text>
              <View style={styles.priceInputRow}>
                <Ionicons name="logo-bitcoin" size={18} color={AppColors.gold} />
                <TextInput
                  value={draft.priceMin}
                  onChangeText={(value) => setDraft((prev) => ({ ...prev, priceMin: value }))}
                  placeholder="0.00"
                  placeholderTextColor={AppColors.textPlaceholder}
                  keyboardType="decimal-pad"
                  style={styles.priceInput}
                />
              </View>
            </View>
            <Text style={styles.priceDash}>-</Text>
            <View style={styles.priceField}>
              <Text style={styles.priceLabel}>Max</Text>
              <View style={styles.priceInputRow}>
                <Ionicons name="logo-bitcoin" size={18} color={AppColors.gold} />
                <TextInput
                  value={draft.priceMax}
                  onChangeText={(value) => setDraft((prev) => ({ ...prev, priceMax: value }))}
                  placeholder="10,000"
                  placeholderTextColor={AppColors.textPlaceholder}
                  keyboardType="decimal-pad"
                  style={styles.priceInput}
                />
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Rarity</Text>
          <View style={styles.pillRow}>
            {RARITY_FILTERS.map((rarity) => (
              <SelectPill
                key={rarity}
                label={rarity}
                selected={draft.rarity === rarity}
                onPress={() =>
                  setDraft((prev) => ({ ...prev, rarity: prev.rarity === rarity ? null : rarity }))
                }
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Drop Date</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Ionicons name="calendar-outline" size={16} color={AppColors.textSecondary} />
              <Text style={styles.datePlaceholder}>Any date</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AuthButton label="Apply" onPress={handleApply} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: AppColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  clearLabel: {
    color: AppColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    color: AppColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 16,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  dropdownValue: {
    color: AppColors.textPrimary,
    fontSize: 14,
  },
  dropdownPlaceholder: {
    color: AppColors.textPlaceholder,
    fontSize: 14,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  dropdownItemLabel: {
    color: AppColors.textPrimary,
    fontSize: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceField: {
    flex: 1,
    gap: 6,
  },
  priceLabel: {
    color: AppColors.textSecondary,
    fontSize: 13,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  priceInput: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  priceDash: {
    color: AppColors.textSecondary,
    fontSize: 16,
    marginTop: 18,
  },
  dateRow: {
    flexDirection: 'row',
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  datePlaceholder: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
});
