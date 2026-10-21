import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

export type NftGridField = {
  label: string;
  value?: string;
  /** Renders in place of the text value (e.g. a status badge). */
  custom?: ReactNode;
};

type Props = {
  width: number;
  name: string;
  image?: string;
  fields: NftGridField[];
};

export function NftGridCard({ width, name, image, fields }: Props) {
  return (
    <View style={[styles.card, { width }]}>
      {/* Image area — portrait ratio matching 660×870 NFT images */}
      <View style={styles.imageOuter}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={28} color={AppColors.textSecondary} />
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name.toUpperCase()}
          </Text>
          <View style={styles.arrowCircle}>
            <Ionicons
              name="arrow-forward-outline"
              size={11}
              color={AppColors.textPrimary}
              style={styles.arrowIcon}
            />
          </View>
        </View>

        {fields.length > 0 && (
          <View style={styles.fieldsRow}>
            {fields.map((field) => (
              <View key={field.label} style={styles.field}>
                <Text style={styles.fieldLabel} numberOfLines={1}>
                  {field.label}
                </Text>
                {field.custom ?? (
                  <Text style={styles.fieldValue} numberOfLines={1}>
                    {field.value || '—'}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
  },
  imageOuter: {
    margin: 8,
    aspectRatio: 660 / 870,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: AppColors.surface,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  name: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  arrowIcon: {
    transform: [{ rotate: '-45deg' }],
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  field: {
    flex: 1,
    gap: 2,
  },
  fieldLabel: {
    color: AppColors.textSecondary,
    fontSize: 9,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldValue: {
    color: AppColors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
});
