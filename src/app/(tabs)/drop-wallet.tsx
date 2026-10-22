import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import { getSavedWallet, saveWallet, WALLET_ADDRESS_RE } from '@/services/purchase-api';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

/**
 * Drop Wallet (old Unity app "Save Wallet"): one Ethereum address the user saves once and can
 * pick as "Saved wallet" at checkout. Backed by `user-app-wallet/get-wallet` + `save-wallet`.
 */
export default function DropWalletScreen() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { token } = useAuth();
  const [savedWallet, setSavedWallet] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newWallet, setNewWallet] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    getSavedWallet(token)
      .then((wallet) => active && setSavedWallet(wallet))
      .catch((e) => active && setLoadError(e instanceof Error ? e.message : i18n.t('Unable to load your saved wallet.')))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  const handleSave = async () => {
    if (!token || isSaving) return;
    const address = newWallet.trim();
    if (!address) {
      setError(t('Please enter a Wallet Address.'));
      return;
    }
    if (!WALLET_ADDRESS_RE.test(address)) {
      setError(t('Please enter a Valid Ethereum Wallet Address.'));
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await saveWallet(token, address);
      const wasSaved = savedWallet !== null;
      setSavedWallet(address);
      setNewWallet('');
      Alert.alert(wasSaved ? t('Wallet Address updated successfully.') : t('Wallet Address saved successfully.'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Unable to Save User Wallet Address!'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!savedWallet) return;
    await Clipboard.setStringAsync(savedWallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Go back')}
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('Drop Wallet')}</Text>
          <Text style={styles.subtitle}>
            {t('Save the Ethereum wallet your drops should go to. At checkout, choose “Saved wallet” instead of typing the address every time.')}
          </Text>

          <View style={styles.savedCard}>
            <Text style={styles.cardLabel}>{t('Saved Wallet Address')}</Text>
            {isLoading ? (
              <ActivityIndicator style={styles.cardLoading} color={AppColors.textSecondary} />
            ) : loadError ? (
              <Text style={styles.errorText}>{loadError}</Text>
            ) : savedWallet ? (
              <View style={styles.savedRow}>
                <Ionicons name="wallet-outline" size={18} color={AppColors.textSecondary} />
                <Text style={styles.savedAddress} selectable>
                  {savedWallet}
                </Text>
                <Pressable accessibilityRole="button" accessibilityLabel={t('Copy wallet address')} hitSlop={8} onPress={handleCopy}>
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={18}
                    color={copied ? AppColors.success : AppColors.textSecondary}
                  />
                </Pressable>
              </View>
            ) : (
              <Text style={styles.emptyText}>{t('No Wallet Saved Yet!')}</Text>
            )}
          </View>

          <Text style={styles.label}>{savedWallet ? t('New Wallet Address') : t('Wallet Address')}</Text>
          <View style={styles.inputRow}>
            <Ionicons name="wallet-outline" size={18} color={AppColors.textSecondary} />
            <TextInput
              value={newWallet}
              onChangeText={(text) => {
                setNewWallet(text);
                if (error) setError(null);
              }}
              placeholder={t('0x...')}
              placeholderTextColor={AppColors.textPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSaving}
              style={styles.input}
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <AuthButton
            label={savedWallet ? t('Update Wallet') : t('Save Wallet')}
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving || isLoading || newWallet.trim().length === 0}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((AppColors) => ({
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
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
    marginBottom: 24,
  },
  savedCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 14,
    gap: 10,
    marginBottom: 24,
  },
  cardLabel: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  cardLoading: {
    alignSelf: 'flex-start',
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  savedAddress: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 14,
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 13,
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
}));
