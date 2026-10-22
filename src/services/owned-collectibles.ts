import { getAllVaultNfts, getAllWalletNfts, type VaultNft, type WalletNft } from '@/services/collectibles-api';

export type OwnedCollectibles = { vault: VaultNft[]; wallet: WalletNft[] };

// Loading a wallet goes through OpenSea and can take a few seconds, so keep the result briefly:
// "View in 3D" on several drops in a row (and the Multi-Viewer) reuse one lookup.
const TTL_MS = 2 * 60 * 1000;
let cached: { key: string; at: number; promise: Promise<OwnedCollectibles> } | null = null;

/**
 * Everything the user owns: the ElmonX Vault (Layer 2) and, when a wallet is connected, its ElmonX
 * NFTs (L1). A failing wallet lookup counts as an empty wallet rather than failing the vault too.
 */
export function loadOwnedCollectibles(token: string, walletAddress?: string): Promise<OwnedCollectibles> {
  const key = `${token}|${walletAddress?.toLowerCase() ?? ''}`;
  if (cached && cached.key === key && Date.now() - cached.at < TTL_MS) return cached.promise;
  const promise = Promise.all([
    getAllVaultNfts(token),
    walletAddress ? getAllWalletNfts(token, walletAddress).catch(() => [] as WalletNft[]) : Promise.resolve([] as WalletNft[]),
  ]).then(([vault, wallet]) => ({ vault, wallet }));
  cached = { key, at: Date.now(), promise };
  promise.catch(() => {
    if (cached?.promise === promise) cached = null;
  });
  return promise;
}

/** Call after a purchase so the new item counts as owned right away. */
export function clearOwnedCollectiblesCache(): void {
  cached = null;
}

/**
 * Old app ownership lists (DataSaver.ownedNft_IDs_Eth / _Layer2): a drop id for normal drops, the
 * revealed blind box item id (`matched[0]._id`) for blind boxes.
 */
export function ownedIds({ vault, wallet }: OwnedCollectibles): { dropIds: Set<string>; blindBoxItemIds: Set<string> } {
  const dropIds = new Set<string>();
  const blindBoxItemIds = new Set<string>();
  // Vault rows (Market_MyCollectablesPanel): the matched blind box item when there is one, else the drop.
  for (const nft of vault) {
    if (nft.matched?.[0]?._id) blindBoxItemIds.add(nft.matched[0]._id);
    else if (nft.drop_id) dropIds.add(nft.drop_id);
  }
  for (const nft of wallet) {
    if (nft.is_blind_box) {
      if (nft.matched?.[0]?._id) blindBoxItemIds.add(nft.matched[0]._id);
    } else if (nft.drop_id) dropIds.add(nft.drop_id);
  }
  return { dropIds, blindBoxItemIds };
}
