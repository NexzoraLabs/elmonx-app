import { useAccount } from '@reown/appkit-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { isArTestAccount, TEST_ACCOUNT_EXTRA_MULTI_VIEWER_ITEMS } from '@/config/test-accounts';
import { useAuth } from '@/context/auth-context';
import { fetchUserId } from '@/hooks/use-current-user-id';
import { loadMultiViewerItems } from '@/services/multi-viewer';
import { isUnityViewerAvailable, presentUnityMultiViewer } from '@/services/unity-bridge';

/**
 * My Account → Multi-Viewer: every owned collectible with a 3D model — Vault (Layer 2) plus the
 * connected wallet — side by side in Unity's 6_MultiViewer scene.
 */
export function useMultiViewer(): { open: () => void; loading: boolean } {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);

  const open = async () => {
    if (!token || loading) return;
    if (!isUnityViewerAvailable()) {
      Alert.alert(t('Multi-Viewer'), t('The 3D viewer is not available in this build.'));
      return;
    }
    setLoading(true);
    try {
      // Only the user's own collectibles; the test account also gets a few featured models to test with.
      const extra = isArTestAccount(await fetchUserId(token)) ? TEST_ACCOUNT_EXTRA_MULTI_VIEWER_ITEMS : 0;
      const items = await loadMultiViewerItems(token, isConnected ? address : undefined, extra);
      if (items.length === 0) {
        Alert.alert(
          t('Multi-Viewer'),
          isConnected
            ? t("None of your collectibles have a 3D model yet.")
            : t("None of your Vault collectibles have a 3D model yet. Connect your wallet in My Collectables → Wallet to include your wallet collectibles too.")
        );
        return;
      }
      presentUnityMultiViewer(items);
    } catch (e) {
      Alert.alert(t('Error'), e instanceof Error ? e.message : t('Unable to load your collectibles.'));
    } finally {
      setLoading(false);
    }
  };

  return { open: () => void open(), loading };
}
