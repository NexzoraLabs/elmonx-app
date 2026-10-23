import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { makeStyles, useAppColors } from '@/context/theme-context';

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
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <View style={[styles.card, { width }]}>
      {/* Image area — portrait ratio matching 660×870 NFT images */}
      <View style={styles.imageOuter}>
        {image ? (
          <Image cachePolicy="memory-disk"
            source={{ uri: image }}
            style={styles.artInset}
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

const useStyles = makeStyles((AppColors) => ({
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
  },
  // Edge-to-edge well across the top of the card (the card's radius rounds its top corners).
  imageOuter: {
    aspectRatio: 660 / 870,
    overflow: 'hidden',
    backgroundColor: AppColors.imageWell,
  },
  /** Artwork sits inset in the edge-to-edge well, so it never touches the card edges. */
  artInset: {
    position: 'absolute',
    top: 12,
    right: 12,
    bottom: 12,
    left: 12,
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
  fieldsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: AppColors.subtleFill,
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
}));
