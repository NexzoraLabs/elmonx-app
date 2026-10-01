import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { SelectPill } from '@/components/collections/select-pill';
import { AppColors } from '@/constants/app-colors';
import {
  BLOCKCHAIN_OPTIONS,
  DEFAULT_CATALOG_FILTERS,
  DESTINATION_OPTIONS,
  EDITION_OPTIONS,
  isValidDate,
  type CatalogFilters,
  type CatalogTab,
  type FilterOption,
} from '@/services/catalog-filters';

type FiltersModalProps = {
  visible: boolean;
  onClose: () => void;
  tab: CatalogTab;
  filters: CatalogFilters;
  onApply: (filters: CatalogFilters) => void;
  brands: FilterOption[];
  categories: FilterOption[];
};

/** Website filter-modal: edits a draft; nothing applies until "Apply Filters". */
export function FiltersModal({ visible, onClose, tab, filters, onApply, brands, categories }: FiltersModalProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {visible ? (
        <FiltersContent
          tab={tab}
          filters={filters}
          onClose={onClose}
          onApply={onApply}
          brands={brands}
          categories={categories}
        />
      ) : null}
    </Modal>
  );
}

function FiltersContent({
  tab,
  filters,
  onClose,
  onApply,
  brands,
  categories,
}: Omit<FiltersModalProps, 'visible'>) {
  const [draft, setDraft] = useState<CatalogFilters>(filters);
  const [artistOpen, setArtistOpen] = useState(false);
  const [artistQuery, setArtistQuery] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isPartners = tab === 'Partners';

  const set = <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const toggleBrand = (id: string) =>
    setDraft((prev) => ({
      ...prev,
      brandIds: prev.brandIds.includes(id) ? prev.brandIds.filter((b) => b !== id) : [...prev.brandIds, id],
    }));

  const handleApply = () => {
    if ((draft.dateFrom && !isValidDate(draft.dateFrom)) || (draft.dateTo && !isValidDate(draft.dateTo))) {
      setError('Dates must be in YYYY-MM-DD format.');
      return;
    }
    onApply(draft);
    onClose();
  };

  const artistMatches = brands.filter((b) => b.title.toLowerCase().includes(artistQuery.trim().toLowerCase()));
  const categoryMatches = categories.filter((c) =>
    c.title.toLowerCase().includes(categoryQuery.trim().toLowerCase())
  );
  const selectedCategory = categories.find((c) => c._id === draft.categoryId);
  const artistLabel =
    draft.brandIds.length === 0
      ? 'All Artists'
      : draft.brandIds.length === 1
        ? (brands.find((b) => b._id === draft.brandIds[0])?.title ?? '1 selected')
        : `${draft.brandIds.length} artists selected`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={onClose}>
          <View style={styles.closeButton}>
            <Ionicons name="close" size={20} color={AppColors.textPrimary} />
          </View>
        </Pressable>
        <Text style={styles.headerTitle}>Filters</Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setDraft(DEFAULT_CATALOG_FILTERS)}>
          <Text style={styles.clearLabel}>Clear filters</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!isPartners ? (
          <>
            <Section title="Blockchain">
              <View style={styles.pillRow}>
                {BLOCKCHAIN_OPTIONS.map((option) => (
                  <SelectPill key={option} label={option} selected={draft.blockchain === option} onPress={() => set('blockchain', option)} />
                ))}
              </View>
            </Section>

            <Section title="Where it goes">
              <View style={styles.pillRow}>
                {DESTINATION_OPTIONS.map((option) => (
                  <SelectPill key={option} label={option} selected={draft.destination === option} onPress={() => set('destination', option)} />
                ))}
              </View>
            </Section>

            <Section title="Edition Type">
              <View style={styles.pillRow}>
                {EDITION_OPTIONS.map((option) => (
                  <SelectPill
                    key={option}
                    label={option === 'all' ? 'All' : option}
                    selected={draft.edition === option}
                    onPress={() => set('edition', option)}
                  />
                ))}
              </View>
            </Section>
          </>
        ) : null}

        <Section title="Artist">
          <Pressable style={styles.dropdown} onPress={() => setArtistOpen((prev) => !prev)}>
            <Text style={draft.brandIds.length ? styles.dropdownValue : styles.dropdownPlaceholder} numberOfLines={1}>
              {artistLabel}
            </Text>
            <Ionicons name={artistOpen ? 'chevron-up' : 'chevron-down'} size={18} color={AppColors.textSecondary} />
          </Pressable>
          {artistOpen ? (
            <View style={styles.dropdownList}>
              <SearchField value={artistQuery} onChangeText={setArtistQuery} placeholder="Search artists..." />
              <ScrollView style={styles.optionScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {artistMatches.map((brand) => {
                  const checked = draft.brandIds.includes(brand._id);
                  return (
                    <Pressable key={brand._id} style={styles.optionRow} onPress={() => toggleBrand(brand._id)}>
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked ? <Ionicons name="checkmark" size={13} color={AppColors.buttonPrimaryText} /> : null}
                      </View>
                      <Text style={styles.optionLabel} numberOfLines={1}>
                        {brand.title}
                      </Text>
                    </Pressable>
                  );
                })}
                {artistMatches.length === 0 ? <Text style={styles.noOptions}>No artists found.</Text> : null}
              </ScrollView>
            </View>
          ) : null}
        </Section>

        {!isPartners ? (
          <Section title="Category">
            <Pressable style={styles.dropdown} onPress={() => setCategoryOpen((prev) => !prev)}>
              <Text style={selectedCategory ? styles.dropdownValue : styles.dropdownPlaceholder} numberOfLines={1}>
                {selectedCategory?.title.trim() ?? 'All Categories'}
              </Text>
              <Ionicons name={categoryOpen ? 'chevron-up' : 'chevron-down'} size={18} color={AppColors.textSecondary} />
            </Pressable>
            {categoryOpen ? (
              <View style={styles.dropdownList}>
                <SearchField value={categoryQuery} onChangeText={setCategoryQuery} placeholder="Search categories..." />
                <ScrollView style={styles.optionScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  <Pressable
                    style={styles.optionRow}
                    onPress={() => {
                      set('categoryId', null);
                      setCategoryOpen(false);
                    }}>
                    <Text style={[styles.optionLabel, !draft.categoryId && styles.optionSelected]}>All Categories</Text>
                  </Pressable>
                  {categoryMatches.map((category) => (
                    <Pressable
                      key={category._id}
                      style={styles.optionRow}
                      onPress={() => {
                        set('categoryId', category._id);
                        setCategoryOpen(false);
                      }}>
                      <Text
                        style={[styles.optionLabel, draft.categoryId === category._id && styles.optionSelected]}
                        numberOfLines={1}>
                        {category.title.trim()}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </Section>
        ) : null}

        <Section title="Date Range">
          <View style={styles.rangeRow}>
            <RangeInput label="From" value={draft.dateFrom} onChangeText={(v) => set('dateFrom', v)} placeholder="YYYY-MM-DD" />
            <Text style={styles.rangeDash}>-</Text>
            <RangeInput label="To" value={draft.dateTo} onChangeText={(v) => set('dateTo', v)} placeholder="YYYY-MM-DD" />
          </View>
        </Section>

        <Section title="Price Range">
          <View style={styles.rangeRow}>
            <RangeInput
              label="Min"
              value={draft.priceMin}
              onChangeText={(v) => set('priceMin', v.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              numeric
            />
            <Text style={styles.rangeDash}>-</Text>
            <RangeInput
              label="Max"
              value={draft.priceMax}
              onChangeText={(v) => set('priceMax', v.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              numeric
            />
          </View>
        </Section>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <AuthButton label="Apply Filters" onPress={handleApply} />
      </View>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.searchField}>
      <Ionicons name="search-outline" size={16} color={AppColors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={AppColors.textPlaceholder}
        autoCorrect={false}
        style={styles.searchInput}
      />
    </View>
  );
}

function RangeInput({
  label,
  value,
  onChangeText,
  placeholder,
  numeric,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  numeric?: boolean;
}) {
  return (
    <View style={styles.rangeField}>
      <Text style={styles.rangeLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={AppColors.textPlaceholder}
        keyboardType={numeric ? 'decimal-pad' : 'numbers-and-punctuation'}
        maxLength={numeric ? 12 : 10}
        style={styles.rangeInput}
      />
    </View>
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
  },
  section: {
    marginTop: 20,
    gap: 10,
  },
  sectionTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
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
    gap: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  dropdownValue: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 14,
  },
  dropdownPlaceholder: {
    flex: 1,
    color: AppColors.textPlaceholder,
    fontSize: 14,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  searchInput: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  optionScroll: {
    maxHeight: 240,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  optionLabel: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 14,
  },
  optionSelected: {
    fontWeight: '700',
    color: AppColors.link,
  },
  noOptions: {
    color: AppColors.textSecondary,
    fontSize: 13,
    padding: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: AppColors.buttonPrimaryBg,
    borderColor: AppColors.buttonPrimaryBg,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rangeField: {
    flex: 1,
    gap: 6,
  },
  rangeLabel: {
    color: AppColors.textSecondary,
    fontSize: 13,
  },
  rangeInput: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: AppColors.textPrimary,
    fontSize: 14,
  },
  rangeDash: {
    color: AppColors.textSecondary,
    fontSize: 16,
    marginTop: 18,
  },
  error: {
    color: AppColors.danger,
    fontSize: 13,
    marginTop: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
});
