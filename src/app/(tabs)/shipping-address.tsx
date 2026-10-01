import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddressCard } from '@/components/address/address-card';
import { AddressFormSheet } from '@/components/address/address-form-sheet';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import * as addressApi from '@/services/address-api';
import type { ShippingAddress } from '@/services/address-api';

export default function ShippingAddressScreen() {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editing, setEditing] = useState<ShippingAddress | null>(null);
  const [sheetKey, setSheetKey] = useState(0);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await addressApi.getShippingAddresses(token);
      setAddresses(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load addresses.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setSheetKey((k) => k + 1);
    setSheetVisible(true);
  };

  const openEdit = (address: ShippingAddress) => {
    setEditing(address);
    setSheetKey((k) => k + 1);
    setSheetVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Shipping Address</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add address"
          hitSlop={8}
          onPress={openAdd}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <Ionicons name="add" size={22} color={AppColors.buttonPrimaryText} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {isLoading ? (
          <ActivityIndicator style={styles.loading} color={AppColors.link} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : addresses.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={32} color={AppColors.textSecondary} />
            <Text style={styles.emptyText}>No shipping addresses yet</Text>
            <Pressable onPress={openAdd} style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
              <Text style={styles.emptyButtonText}>Add Address</Text>
            </Pressable>
          </View>
        ) : (
          addresses.map((address, index) => (
            <AddressCard key={address._id ?? index} address={address} onEdit={() => openEdit(address)} />
          ))
        )}
      </ScrollView>

      <AddressFormSheet
        key={sheetKey}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        editing={editing}
        onSaved={load}
      />
    </SafeAreaView>
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.buttonPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  headerTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  loading: {
    paddingVertical: 40,
  },
  error: {
    color: AppColors.danger,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 13,
  },
  emptyButton: {
    marginTop: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: AppColors.buttonPrimaryBg,
  },
  emptyButtonText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 13,
    fontWeight: '700',
  },
});
