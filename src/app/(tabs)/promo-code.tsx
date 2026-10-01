import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import * as promoApi from '@/services/promo-api';

export default function PromoCodeScreen() {
  const { token } = useAuth();
  const [walletAddress, setWalletAddress] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canSubmit = walletAddress.trim().length > 0 && promoCode.trim().length > 0 && !isSubmitting;

  const handleSend = async () => {
    if (!token || !canSubmit) return;
    setIsSubmitting(true);
    setResult(null);
    try {
      const outcome = await promoApi.applyPromoCode(token, promoCode.trim(), walletAddress.trim());
      setResult({ type: outcome.success ? 'success' : 'error', message: outcome.message });
      if (outcome.success) {
        setPromoCode('');
      }
    } catch (e) {
      setResult({ type: 'error', message: e instanceof Error ? e.message : 'Something went wrong!' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>

        <View style={styles.content}>
          <Text style={styles.title}>Redeem Promo Code</Text>
          <Text style={styles.subtitle}>
            Enter your wallet address and promo code below to redeem your rewards or exclusive benefits.
          </Text>

          <Text style={styles.label}>Enter Wallet Address</Text>
          <View style={styles.inputRow}>
            <Ionicons name="wallet-outline" size={18} color={AppColors.textSecondary} />
            <TextInput
              value={walletAddress}
              onChangeText={setWalletAddress}
              placeholder="Enter your wallet address"
              placeholderTextColor={AppColors.textPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <Text style={[styles.label, styles.labelSpaced]}>Enter PromoCode</Text>
          <View style={styles.inputRow}>
            <Ionicons name="pricetag-outline" size={18} color={AppColors.textSecondary} />
            <TextInput
              value={promoCode}
              onChangeText={setPromoCode}
              placeholder="Enter PromoCode"
              placeholderTextColor={AppColors.textPlaceholder}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          {result ? (
            <View style={[styles.resultBanner, result.type === 'error' ? styles.resultError : styles.resultSuccess]}>
              <Text style={styles.resultText}>{result.message}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <AuthButton label="Send" onPress={handleSend} disabled={!canSubmit} loading={isSubmitting} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  flex: {
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: AppColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 28,
  },
  label: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  labelSpaced: {
    marginTop: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  resultBanner: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 20,
  },
  resultSuccess: {
    backgroundColor: 'rgba(52,199,89,0.12)',
  },
  resultError: {
    backgroundColor: 'rgba(255,69,58,0.12)',
  },
  resultText: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
});
