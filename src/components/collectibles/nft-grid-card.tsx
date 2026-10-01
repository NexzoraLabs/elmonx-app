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
    <View style={{ width }}>
      <View style={[styles.imageBox, { height: width }]}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} contentFit="cover" transition={150} />
        ) : (
          <Ionicons name="image-outline" size={28} color={AppColors.textSecondary} />
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <View style={styles.fieldsRow}>
        {fields.map((field) => (
          <View key={field.label} style={styles.field}>
            <Text style={styles.fieldLabel} numberOfLines={1}>
              {field.label}
            </Text>
            {field.custom ?? (
              <Text style={styles.fieldValue} numberOfLines={1}>
                {field.value || '----'}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageBox: {
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  field: {
    flex: 1,
    gap: 2,
  },
  fieldLabel: {
    color: AppColors.textSecondary,
    fontSize: 9,
  },
  fieldValue: {
    color: AppColors.textPrimary,
    fontSize: 11,
  },
});
