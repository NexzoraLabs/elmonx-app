import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { AppColors } from '@/constants/app-colors';

const MIN_SCALE = 0.4;
const MAX_SCALE = 4.5;
const ZOOM_STEP = 0.4;
const ROTATION_DURATION_MS = 15000;

type Viewer3DModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  imageUrl?: string;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unsupported';

export function Viewer3DModal({ visible, onClose, title, imageUrl }: Viewer3DModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const viewShotRef = useRef<View>(null);

  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  // Reset the viewer every time it opens, computed during render (not an effect)
  // so shared-value resets and state resets land in the same commit.
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      rotation.set(0);
      scale.set(1);
      savedScale.set(1);
      setIsPlaying(true);
      setSaveStatus('idle');
    }
  }

  useEffect(() => {
    if (!visible || !isPlaying) {
      cancelAnimation(rotation);
      return;
    }
    rotation.set(
      withRepeat(
        withTiming(rotation.get() + 360, { duration: ROTATION_DURATION_MS, easing: Easing.linear }),
        -1,
        false,
      ),
    );
  }, [visible, isPlaying, rotation]);

  useEffect(() => {
    if (saveStatus === 'idle' || saveStatus === 'saving') return;
    const timer = setTimeout(() => setSaveStatus('idle'), 2200);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const next = savedScale.get() * event.scale;
      scale.set(Math.min(Math.max(next, MIN_SCALE), MAX_SCALE));
    })
    .onEnd(() => {
      savedScale.set(scale.get());
    });

  const zoomBy = (delta: number) => {
    const next = Math.min(Math.max(scale.get() + delta, MIN_SCALE), MAX_SCALE);
    scale.set(withTiming(next, { duration: 200 }));
    savedScale.set(next);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { scale: scale.get() }, { rotateY: `${rotation.get() % 360}deg` }],
  }));

  const handleCapture = async () => {
    if (!viewShotRef.current || saveStatus === 'saving') return;
    try {
      setSaveStatus('saving');
      const uri = await captureRef(viewShotRef, { format: 'png', quality: 1, result: 'tmpfile' });
      // Deferred: expo-media-library's native module isn't in every installed
      // build (e.g. Expo Go without a matching dev client), so only touch it
      // once the user actually taps capture, and fail gracefully if missing.
      const MediaLibrary = await import('expo-media-library');
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setSaveStatus('error');
        return;
      }
      await MediaLibrary.Asset.create(uri);
      setSaveStatus('saved');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setSaveStatus(/native module/i.test(message) ? 'unsupported' : 'error');
    }
  };

  const statusLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'saved'
        ? 'Saved to Photos'
        : saveStatus === 'unsupported'
          ? 'Saving needs a dev build (not available in Expo Go)'
          : saveStatus === 'error'
            ? "Couldn't save"
            : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      {/* Modal renders in its own native surface, so gestures need their own root here too. */}
      <GestureHandlerRootView style={styles.safeArea}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={AppColors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.stage}>
            <GestureDetector gesture={pinchGesture}>
              <View ref={viewShotRef} collapsable={false} style={styles.captureArea}>
                <Animated.View style={[styles.objectWrapper, animatedStyle]}>
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.objectImage} contentFit="contain" />
                  ) : null}
                </Animated.View>
              </View>
            </GestureDetector>
          </View>

          <View style={styles.footer}>
            {statusLabel ? <Text style={styles.statusText}>{statusLabel}</Text> : null}
            <View style={styles.controls}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Zoom out"
                style={styles.controlButton}
                onPress={() => zoomBy(-ZOOM_STEP)}>
                <Ionicons name="remove" size={20} color={AppColors.textPrimary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause rotation' : 'Resume rotation'}
                style={styles.controlButton}
                onPress={() => setIsPlaying((prev) => !prev)}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={AppColors.textPrimary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Zoom in"
                style={styles.controlButton}
                onPress={() => zoomBy(ZOOM_STEP)}>
                <Ionicons name="add" size={20} color={AppColors.textPrimary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Capture image"
                style={styles.controlButton}
                onPress={handleCapture}>
                <Ionicons name="camera-outline" size={20} color={AppColors.textPrimary} />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureArea: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectWrapper: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 8,
    gap: 12,
  },
  statusText: {
    color: AppColors.textSecondary,
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
