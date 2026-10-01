import { useAccount, useAppKit } from '@reown/appkit-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import { checkWhitelist } from '@/services/drops-api';
import { shortenAddress } from '@/services/collectibles-api';

type Props = {
  dropId: string | null;
  onClose: () => void;
};

export function AllowlistSheet({ dropId, onClose }: Props) {
  return (
    <BottomSheet visible={dropId !== null} onClose={onClose}>
      {dropId ? <AllowlistContent key={dropId} dropId={dropId} /> : null}
    </BottomSheet>
  );
}

function AllowlistContent({ dropId }: { dropId: string }) {
  const { token } = useAuth();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; lines: string[] } | null>(null);

  const handleCheck = async () => {
    if (!address) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await checkWhitelist(token, dropId, address);
      // Website whitelist-modal messages, verbatim.
      if (response.status === 200) {
        const remaining = (response.allocated ?? 0) - (response.consumed ?? 0);
        setResult({
          ok: true,
          lines: [
            "You're on the allowlist!",
            'You have access to this drop.',
            `You can purchase up to ${remaining} more editions.`,
          ],
        });
      } else if (response.status === 201) {
        setResult({
          ok: false,
          lines: ['Not Eligible', "You're not on the allowlist for this drop.", 'Stay tuned for future releases!'],
        });
      } else {
        setResult({ ok: false, lines: ['List is not updated yet, Please wait'] });
      }
    } catch {
      setResult({ ok: false, lines: ['Failed to check status'] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check Allowlist Eligibility</Text>
      <Text style={styles.text}>
        Private releases begin with an exclusive window for holders of qualifying works.
      </Text>

      {isConnected && address ? (
        <>
          <View style={styles.walletRow}>
            <Text style={styles.walletLabel}>Wallet</Text>
            <Text style={styles.walletValue}>{shortenAddress(address)}</Text>
          </View>
          <Pressable
            disabled={loading}
            onPress={handleCheck}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            {loading ? (
              <ActivityIndicator color={AppColors.buttonPrimaryText} />
            ) : (
              <Text style={styles.buttonText}>Check Eligibility</Text>
            )}
          </Pressable>
        </>
      ) : (
        <Pressable onPress={() => open()} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>Connect Wallet</Text>
        </Pressable>
      )}

      {result ? (
        <View style={[styles.result, result.ok ? styles.resultOk : styles.resultBad]}>
          {result.lines.map((line, index) => (
            <Text key={line} style={[styles.resultText, index === 0 && styles.resultTitle]}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 8,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  text: {
    color: AppColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: AppColors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  walletLabel: {
    color: AppColors.textSecondary,
    fontSize: 13,
  },
  walletValue: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.buttonPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  result: {
    borderRadius: 12,
    padding: 14,
    gap: 2,
  },
  resultOk: {
    backgroundColor: 'rgba(52,199,89,0.12)',
  },
  resultBad: {
    backgroundColor: 'rgba(255,69,58,0.12)',
  },
  resultText: {
    color: AppColors.textPrimary,
    fontSize: 13,
    textAlign: 'center',
  },
  resultTitle: {
    fontWeight: '700',
    fontSize: 15,
  },
});
