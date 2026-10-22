import { useState, type ReactNode } from 'react';

import { Viewer3DModal } from '@/components/collection-detail/viewer-3d-modal';
import { useViewerAccess } from '@/hooks/use-viewer-access';
import { getPlatformUnityAsset, type Drop } from '@/services/drops-api';
import { isUnityViewerAvailable, presentUnityViewer } from '@/services/unity-bridge';

/**
 * "View in 3D" for one drop: the Unity viewer when this build has it, otherwise the image modal.
 * AR inside the viewer only for owners (see useViewerAccess). `viewer` is the fallback modal —
 * render it wherever the hook is used.
 */
export function useDropViewer3D(drop: Drop | undefined): {
  canView: boolean;
  open: () => void;
  loading: boolean;
  viewer: ReactNode;
} {
  const [fallbackVisible, setFallbackVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const resolveAccess = useViewerAccess();
  const platformAsset = drop ? getPlatformUnityAsset(drop) : undefined;
  const unityEntry = drop?.unity_assets?.[0];

  const open = async () => {
    if (!drop || loading) return;
    if (!unityEntry || !platformAsset || !isUnityViewerAvailable()) {
      setFallbackVisible(true);
      return;
    }
    setLoading(true);
    try {
      const access = await resolveAccess({ dropId: drop._id, arAvailableToAll: drop.is_ar_available_to_all });
      presentUnityViewer(unityEntry, platformAsset, access);
    } finally {
      setLoading(false);
    }
  };

  const viewer = drop ? (
    <Viewer3DModal
      visible={fallbackVisible}
      onClose={() => setFallbackVisible(false)}
      title={drop.title}
      imageUrl={drop.images?.[0]?.original_url}
    />
  ) : null;

  return { canView: Boolean(platformAsset), open: () => void open(), loading, viewer };
}
