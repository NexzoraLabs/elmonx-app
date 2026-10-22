import { NativeModules, Platform } from 'react-native';

import type { UnityAssetEntry, UnityAssetFile } from '@/services/drops-api';

type UnityBridgeNativeModule = {
  presentUnityViewer: (modelJson: string) => void;
  presentUnityMultiViewer: (itemsJson: string) => void;
  dismissUnityViewer: () => void;
};

const { UnityBridgeModule } = NativeModules as { UnityBridgeModule?: UnityBridgeNativeModule };

export function isUnityViewerAvailable(): boolean {
  return (Platform.OS === 'ios' || Platform.OS === 'android') && UnityBridgeModule != null;
}

/**
 * Who may switch the viewer to AR (Unity: `isArAvailableToAll ? true : isOwned`), as in the old app:
 * owners, every user on drops the admin opened up (`is_ar_available_to_all`), and the test account.
 */
export type ViewerAccess = { isOwned: boolean; isArAvailableToAll: boolean };

export function presentUnityViewer(entry: UnityAssetEntry, asset: UnityAssetFile, access: ViewerAccess): void {
  if (!UnityBridgeModule) return;

  const modelAsset = {
    name: asset.original_name,
    type: '',
    url: asset.original_url,
    ar: true,
    isface: entry.face !== null,
    ismultiframe: entry.multiframe === 'true',
    iswide: false,
    isOwned: access.isOwned,
    isArAvailableToAll: access.isArAvailableToAll,
    isMonaMetaCustomDrop: false,
  };

  UnityBridgeModule.presentUnityViewer(JSON.stringify(modelAsset));
}

/**
 * One collectible in the Unity Multi-Viewer — Unity's `MultipleModelItem`, field names must match
 * exactly (JsonUtility). Unity keeps one entry per `displayName`.
 */
export type MultiViewerItem = {
  displayName: string;
  dropId: string;
  ar: boolean;
  isface: boolean;
  ismultiframe: boolean;
  assetName_android: string;
  assetName_ios: string;
  url_android: string;
  url_ios: string;
  type: string;
  iswide: boolean;
  imageUrl: string;
};

/** Opens Unity's `6_MultiViewer` scene with these items (`Loader.OpenMultiViewer`, export 08+). */
export function presentUnityMultiViewer(items: MultiViewerItem[]): void {
  UnityBridgeModule?.presentUnityMultiViewer(JSON.stringify({ items }));
}

export function dismissUnityViewer(): void {
  UnityBridgeModule?.dismissUnityViewer();
}
