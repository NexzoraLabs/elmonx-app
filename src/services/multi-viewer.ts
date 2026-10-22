import { Platform } from 'react-native';

import type { VaultNft, WalletNft, WalletUnityAsset } from '@/services/collectibles-api';
import { fetchDropById, fetchFeaturedDrops } from '@/services/drops-api';
import { loadOwnedCollectibles } from '@/services/owned-collectibles';
import type { MultiViewerItem } from '@/services/unity-bridge';

// Doodles blind boxes have no 3D assets on the backend (old app AppData.DOODLE_DROP_*_ID).
const DOODLE_DROP_IDS = new Set(['6a1d70414f018acfe0e7b66e', '6a1d6f654f018acfe0e7b66d', '6a1d70674f018acfe0e7b66f']);

/** "Bedlam Insanity #1/25" → "Bedlam Insanity" (old app Helper.ExtractName). */
function displayNameOf(name: string): string {
  return name.match(/^(.+?)\s*#/)?.[1]?.trim() ?? name.trim();
}

function toItem(name: string | undefined, dropId: string | undefined, asset: WalletUnityAsset | undefined, imageUrl: string | undefined): MultiViewerItem | null {
  const displayName = displayNameOf(name ?? '');
  // Skip items whose model wasn't uploaded for this platform — Unity would fail to load them.
  const platformFile = Platform.OS === 'ios' ? asset?.IOS_assets : asset?.Android_assets;
  if (!asset || !displayName || !platformFile?.original_url) return null;
  return {
    displayName,
    dropId: dropId ?? '',
    ar: true,
    isface: asset.face === 'true',
    ismultiframe: asset.multiframe === 'true',
    assetName_android: asset.Android_assets?.original_name ?? '',
    assetName_ios: asset.IOS_assets?.original_name ?? '',
    url_android: asset.Android_assets?.original_url ?? '',
    url_ios: asset.IOS_assets?.original_url ?? '',
    type: 'bundle',
    iswide: asset.isWide === true,
    imageUrl: imageUrl ?? '',
  };
}

/**
 * Wallet (L1) collectibles, as the old Unity app built them (`Profile_MyL1CollectiblesPanel`):
 * the drop's first Unity asset, or for a blind box the revealed item (`matched[0]`).
 */
function walletItem(nft: WalletNft): MultiViewerItem | null {
  if (nft.is_blind_box) {
    if (DOODLE_DROP_IDS.has(nft.drop_id ?? '')) return null;
    const revealed = nft.matched?.[0];
    return toItem(nft.name, nft.drop_id, revealed?.unity_assets?.[0], revealed?.image?.[0]?.url);
  }
  return toItem(nft.name, nft.drop_id, nft.unity_assets?.[0], nft.image_url);
}

/** Vault (Layer 2) collectibles. `user_nfts` doesn't carry the drop's Unity assets, so those come per drop. */
async function vaultItems(token: string, nfts: VaultNft[]): Promise<MultiViewerItem[]> {
  const plainDropIds = [
    ...new Set(nfts.filter((nft) => !nft.drop_data?.is_blind_box && nft.drop_id).map((nft) => nft.drop_id as string)),
  ];
  const dropAssets = new Map<string, WalletUnityAsset | undefined>();
  await Promise.all(
    plainDropIds.map(async (dropId) => {
      const drop = await fetchDropById(dropId, token).catch(() => undefined);
      dropAssets.set(dropId, drop?.unity_assets?.[0]);
    })
  );

  const name = (nft: VaultNft) => nft.meta_data?.meta_data?.name || nft.title;
  return nfts
    .map((nft) => {
      if (nft.drop_data?.is_blind_box) {
        if (DOODLE_DROP_IDS.has(nft.drop_id ?? '')) return null;
        const revealed = nft.matched?.[0];
        return toItem(name(nft), nft.drop_id, revealed?.unity_assets?.[0], revealed?.image?.[0]?.url);
      }
      const image = nft.meta_data?.meta_data?.image || nft.image_url;
      return toItem(name(nft), nft.drop_id, dropAssets.get(nft.drop_id ?? ''), image);
    })
    .filter((item): item is MultiViewerItem => item !== null);
}

/** Test account only: featured drops with a 3D model for this platform, not already in the list. */
async function extraTestItems(count: number, skipNames: Set<string>): Promise<MultiViewerItem[]> {
  const extra: MultiViewerItem[] = [];
  for (let page = 1; page <= 3 && extra.length < count; page++) {
    const { items } = await fetchFeaturedDrops(page).catch(() => ({ items: [] }));
    if (items.length === 0) break;
    for (const drop of items) {
      if (extra.length >= count || drop.is_blind_box) continue;
      const item = toItem(drop.title, drop._id, drop.unity_assets?.[0], drop.images?.[0]?.original_url);
      if (item && !skipNames.has(item.displayName)) {
        skipNames.add(item.displayName);
        extra.push(item);
      }
    }
  }
  return extra;
}

/**
 * Everything the user owns that has a 3D model: the ElmonX Vault (Layer 2) plus the connected
 * wallet (L1) when there is one (shared, cached lookup — see owned-collectibles.ts). One entry per
 * artwork name (Unity keys the list by name). `extraTestItems` adds that many not-owned models
 * (test account only).
 */
export async function loadMultiViewerItems(
  token: string,
  walletAddress?: string,
  extraForTesting = 0
): Promise<MultiViewerItem[]> {
  const owned = await loadOwnedCollectibles(token, walletAddress);
  const vault = await vaultItems(token, owned.vault);
  const wallet = owned.wallet.map(walletItem).filter((item): item is MultiViewerItem => item !== null);
  const byName = new Map<string, MultiViewerItem>();
  for (const item of [...vault, ...wallet]) if (!byName.has(item.displayName)) byName.set(item.displayName, item);
  const items = [...byName.values()];
  if (extraForTesting > 0) items.push(...(await extraTestItems(extraForTesting, new Set(byName.keys()))));
  return items;
}
