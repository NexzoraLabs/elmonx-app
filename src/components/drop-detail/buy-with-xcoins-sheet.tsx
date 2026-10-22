import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { WEB_URL } from '@/config/env';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import type { Drop } from '@/services/drops-api';
import { clearOwnedCollectiblesCache } from '@/services/owned-collectibles';
import {
  buyLayer2Nft,
  getSavedWallet,
  getXCoinBalance,
  MAX_PURCHASE_QUANTITY,
  WALLET_ADDRESS_RE,
} from '@/services/purchase-api';
import { useTranslation } from 'react-i18next';

type WalletSource = 'enter' | 'saved';

const COIN_ICON = require('../../../assets/coin_icon.webp');

type Props = {
  drop: Drop | null;
  remaining: number;
  onClose: () => void;
  /** Called after a successful purchase so the screen can refresh editions left. */
  onPurchased: () => void;
};

/** Website "Buy With X-Coins" checkout (buy-nft-with-coin-modal) as a bottom sheet. */
export function BuyWithXCoinsSheet({ drop, remaining, onClose, onPurchased }: Props) {
  return (
    <BottomSheet visible={drop !== null} onClose={onClose}>
      {/* Remounted per open so the form always starts fresh. */}
      {drop ? <Checkout key={drop._id} drop={drop} remaining={remaining} onClose={onClose} onPurchased={onPurchased} /> : null}
    </BottomSheet>
  );
}

function Checkout({ drop, remaining, onClose, onPurchased }: Props & { drop: Drop }) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { token } = useAuth();
  // "Saved wallet" = the Drop Wallet from Settings. When one exists it's preselected and filled in
  // on open; with none saved there are no tabs, just the address field.
  const [walletSource, setWalletSource] = useState<WalletSource>('enter');
  const [walletAddress, setWalletAddress] = useState('');
  const [savedWallet, setSavedWallet] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [balance, setBalance] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxQuantity = Math.max(1, Math.min(MAX_PURCHASE_QUANTITY, remaining));
  const price = drop.price || 0;
  const total = price * quantity;
  const image = drop.images?.[0]?.original_url;
  const addressValid = WALLET_ADDRESS_RE.test(walletAddress.trim());

  const loadBalance = () => {
    if (!token) return;
    getXCoinBalance(token)
      .then(setBalance)
      .catch(() => setBalance(0));
  };

  useEffect(() => {
    loadBalance();
    if (!token) return;
    getSavedWallet(token)
      .then((wallet) => {
        if (!wallet) return;
        setSavedWallet(wallet);
        setWalletSource('saved');
        setWalletAddress(wallet);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per open
  }, []);

  const chooseWalletSource = (source: WalletSource) => {
    if (source === walletSource || submitting) return;
    setWalletSource(source);
    setError(null);
    setWalletAddress(source === 'saved' && savedWallet ? savedWallet : '');
  };

  const handleBuy = async () => {
    if (!token || submitting) return;
    if (!walletAddress.trim()) {
      setError(t('Wallet Address is required.'));
      return;
    }
    if (!addressValid) {
      setError(t('Invalid Wallet Address'));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await buyLayer2Nft(token, {
        drop_id: drop._id,
        wallet_address: walletAddress.trim(),
        quantity,
      });
      if (result.ok) {
        onClose();
        // The new NFT is in the Vault now; the next View in 3D / Multi-Viewer must see it as owned.
        clearOwnedCollectiblesCache();
        onPurchased();
        Alert.alert(t('Successful Purchase!'), t('{{name}} has been assigned to you.', { name: result.nftName || drop.title }));
        return;
      }
      showFailure(result.message);
    } catch {
      Alert.alert(t('Unable To Buy!'), t('Something went wrong. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Same wording/branches as the website modal.
  const showFailure = (message: string) => {
    if (message.toLowerCase().includes('insufficient balance')) loadBalance();
    if (message === 'UK user verification required') {
      Alert.alert(
        t('Complete UK Verification'),
        t('To proceed with your purchase, please verify your UK identity.'),
        [
          { text: t('Not now'), style: 'cancel' },
          { text: t('Go to Verification'), onPress: () => void WebBrowser.openBrowserAsync(`${WEB_URL}/account/uk-verification`) },
        ],
      );
      return;
    }
    if (message === 'Buy Limit Reached') {
      Alert.alert(t('Buy Limit Reached!'), t('You can\'t purchase more of this item.'));
      return;
    }
    if (message === "You're not whitelisted!") {
      Alert.alert(t('Unable To Buy!'), t('You\'re not whitelisted for this drop.\n\nStay tuned for future releases!'));
      return;
    }
    Alert.alert(t('Unable To Buy!'), message);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {image ? <Image source={{ uri: image }} style={styles.thumb} contentFit="contain" /> : <View style={styles.thumb} />}
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('Checkout')}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {drop.title}
          </Text>
        </View>
      </View>

      {savedWallet ? (
      <View style={styles.tabs}>
        {(['enter', 'saved'] as const).map((source) => (
          <Pressable
            key={source}
            accessibilityRole="button"
            accessibilityState={{ selected: walletSource === source }}
            onPress={() => chooseWalletSource(source)}
            style={[styles.tab, walletSource === source && styles.tabActive]}>
            <Text style={[styles.tabText, walletSource === source && styles.tabTextActive]}>
              {source === 'enter' ? t('Enter wallet') : t('Saved wallet')}
            </Text>
          </Pressable>
        ))}
      </View>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>
          {t('Wallet Address')}<Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          value={walletAddress}
          onChangeText={(text) => {
            setWalletAddress(text);
            if (error) setError(null);
          }}
          placeholder={t('0x...')}
          placeholderTextColor={AppColors.textPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!submitting && walletSource === 'enter'}
          style={[styles.input, walletSource === 'saved' && styles.inputLocked]}
        />
      </View>

      <View style={styles.quantityRow}>
        <Text style={styles.label}>{t('Quantity')}</Text>
        <View style={styles.stepper}>
          <StepButton icon="remove" disabled={quantity <= 1 || submitting} onPress={() => setQuantity((q) => Math.max(1, q - 1))} />
          <Text style={styles.quantity}>{quantity}</Text>
          <StepButton
            icon="add"
            disabled={quantity >= maxQuantity || submitting}
            onPress={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
          />
        </View>
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={16} color={AppColors.link} />
        <Text style={styles.noteText}>
          {t('This NFT is minted on Ethereum and kept in the ElmonX Vault contract. View it in 3D/AR in the app, or withdraw anytime to your L1 Ethereum wallet.')}
        </Text>
      </View>

      <View style={styles.details}>
        <DetailRow label={t('Account Balance')}>
          {balance === null ? <ActivityIndicator size="small" color={AppColors.textSecondary} /> : <Coins value={balance} />}
        </DetailRow>
        <DetailRow label={t('Price per item')}>
          <Coins value={price} />
        </DetailRow>
        <DetailRow label={t('Total')} strong>
          <Coins value={total} strong />
        </DetailRow>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AuthButton label={t('Buy Now')} onPress={handleBuy} loading={submitting} disabled={submitting} />
    </View>
  );
}

function StepButton({ icon, disabled, onPress }: { icon: 'add' | 'remove'; disabled: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={icon === 'add' ? t('Increase quantity') : t('Decrease quantity')}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={[styles.stepButton, disabled && styles.stepButtonDisabled]}>
      <Ionicons name={icon} size={18} color={AppColors.textPrimary} />
    </Pressable>
  );
}

function DetailRow({ label, strong, children }: { label: string; strong?: boolean; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, strong && styles.detailLabelStrong]}>{label}</Text>
      {children}
    </View>
  );
}

function Coins({ value, strong }: { value: number; strong?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.coins}>
      <Image source={COIN_ICON} style={styles.coinIcon} contentFit="contain" />
      <Text style={[styles.coinValue, strong && styles.coinValueStrong]}>{value.toLocaleString()}</Text>
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  container: {
    gap: 16,
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: AppColors.textSecondary,
    fontSize: 13,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    borderColor: AppColors.textPrimary,
    backgroundColor: AppColors.subtleFill,
  },
  tabText: {
    color: AppColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: AppColors.textPrimary,
  },
  field: {
    gap: 6,
  },
  inputLocked: {
    color: AppColors.textSecondary,
  },
  label: {
    color: AppColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  required: {
    color: AppColors.danger,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.background,
    paddingHorizontal: 14,
    color: AppColors.textPrimary,
    fontSize: 14,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonDisabled: {
    opacity: 0.4,
  },
  quantity: {
    minWidth: 20,
    textAlign: 'center',
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  note: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: AppColors.subtleFill,
  },
  noteText: {
    flex: 1,
    color: AppColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  details: {
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: AppColors.textSecondary,
    fontSize: 13,
  },
  detailLabelStrong: {
    color: AppColors.textPrimary,
    fontWeight: '700',
  },
  coins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinIcon: {
    width: 16,
    height: 16,
  },
  coinValue: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  coinValueStrong: {
    fontSize: 16,
    fontWeight: '800',
  },
  error: {
    color: AppColors.danger,
    fontSize: 13,
  },
}));
