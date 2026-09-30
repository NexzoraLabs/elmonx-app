import { NativeModules, Platform } from 'react-native';

import type { UnityAssetEntry, UnityAssetFile } from '@/services/drops-api';

type UnityBridgeNativeModule = {
  presentUnityViewer: (modelJson: string) => void;
  dismissUnityViewer: () => void;
};

const { UnityBridgeModule } = NativeModules as { UnityBridgeModule?: UnityBridgeNativeModule };

export function isUnityViewerAvailable(): boolean {
  return Platform.OS === 'ios' && UnityBridgeModule != null;
}

export function presentUnityViewer(entry: UnityAssetEntry, asset: UnityAssetFile): void {
  if (!UnityBridgeModule) return;

  const modelAsset = {
    name: asset.original_name,
    type: '',
    url: asset.original_url,
    ar: true,
    isface: entry.face !== null,
    ismultiframe: entry.multiframe === 'true',
    iswide: false,
    isOwned: true,
    isArAvailableToAll: true,
    isMonaMetaCustomDrop: false,
  };

  UnityBridgeModule.presentUnityViewer(JSON.stringify(modelAsset));
}

export function dismissUnityViewer(): void {
  UnityBridgeModule?.dismissUnityViewer();
}
