import { useAccount } from '@reown/appkit-react-native';

import { isArTestAccount } from '@/config/test-accounts';
import { useAuth } from '@/context/auth-context';
import { fetchUserId } from '@/hooks/use-current-user-id';
import { loadOwnedCollectibles, ownedIds } from '@/services/owned-collectibles';
import type { ViewerAccess } from '@/services/unity-bridge';

type Target = {
  /** Normal drop: owned when any Vault / wallet NFT belongs to this drop. */
  dropId?: string;
  /** Blind box item: owned when a Vault / wallet NFT revealed this item. */
  blindBoxItemId?: string;
  /** The drop's admin flag `is_ar_available_to_all` (for a blind box item: its parent drop's). */
  arAvailableToAll?: boolean;
};

/**
 * Resolves AR access for the Unity viewer the way the old app did: AR only for owners, unless the
 * drop is open to everyone or this is the test account. Ownership = the user's Vault (Layer 2) plus
 * the connected wallet (L1), cached for a couple of minutes.
 */
export function useViewerAccess(): (target: Target) => Promise<ViewerAccess> {
  const { token } = useAuth();
  const { address, isConnected } = useAccount();

  return async ({ dropId, blindBoxItemId, arAvailableToAll }) => {
    const userId = token ? await fetchUserId(token) : null;
    const isArAvailableToAll = arAvailableToAll === true || isArTestAccount(userId);
    if (__DEV__) console.log('[AR access]', { userId, arAvailableToAll, isTestAccount: isArTestAccount(userId), dropId, blindBoxItemId });
    // Unity ignores `isOwned` once AR is open to all, so skip the (slow) ownership lookup then.
    if (!token || isArAvailableToAll) return { isOwned: false, isArAvailableToAll };
    try {
      const ids = ownedIds(await loadOwnedCollectibles(token, isConnected ? address : undefined));
      const isOwned = blindBoxItemId ? ids.blindBoxItemIds.has(blindBoxItemId) : !!dropId && ids.dropIds.has(dropId);
      if (__DEV__) console.log('[AR access] owned =', isOwned);
      return { isOwned, isArAvailableToAll };
    } catch {
      // Can't tell → no AR (3D still works).
      return { isOwned: false, isArAvailableToAll };
    }
  };
}
