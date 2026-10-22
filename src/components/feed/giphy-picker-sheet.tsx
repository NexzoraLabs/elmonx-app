import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/app-colors';
import {
  GIPHY_PAGE_SIZE,
  getTrendingGifs,
  isGiphyConfigured,
  searchGifs,
  trendingStartOffset,
  type GiphyGif,
} from '@/services/giphy-api';

const SEARCH_DEBOUNCE_MS = 350;
const COLUMNS = 3;
const GAP = 6;

type GiphyPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (gif: GiphyGif) => void;
};

/**
 * Website `GiphyPicker` for the app: channel "trending" on open, debounced search, load more.
 *
 * An in-screen overlay, not a RN `Modal` (a Modal opened from a modal screen didn't show on iOS).
 * Render it as the last child of a full-size container — inside the screen's KeyboardAvoidingView,
 * so the sheet sits above the keyboard while searching.
 */
export function GiphyPickerSheet({ visible, onClose, onSelect }: GiphyPickerSheetProps) {
  const insets = useSafeAreaInsets();
  // Mounted only while open, so every open starts fresh with new trending GIFs.
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.grabber} />
        <GiphyPickerBody onClose={onClose} onSelect={onSelect} />
      </View>
    </View>
  );
}

function GiphyPickerBody({ onClose, onSelect }: Omit<GiphyPickerSheetProps, 'visible'>) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const trendingBase = useRef(0);
  const activeTerm = useRef('');
  const requestId = useRef(0);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sheet has 20px side padding (BottomSheet).
  const tileSize = (width - 40 - GAP * (COLUMNS - 1)) / COLUMNS;

  const loadFirstPage = async (term: string) => {
    const id = ++requestId.current;
    activeTerm.current = term;
    setLoading(true);
    setGifs([]);
    let rows: GiphyGif[];
    if (term) {
      rows = await searchGifs(term, 0);
    } else {
      trendingBase.current = trendingStartOffset();
      rows = await getTrendingGifs(trendingBase.current);
    }
    if (id !== requestId.current) return; // a newer search replaced this one
    setGifs(rows);
    setHasMore(rows.length === GIPHY_PAGE_SIZE);
    setLoading(false);
  };

  useEffect(() => {
    if (!isGiphyConfigured) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    void loadFirstPage('');
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      void loadFirstPage(value.trim());
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleLoadMore = async () => {
    if (loading || loadingMore || !hasMore) return;
    const id = requestId.current;
    const term = activeTerm.current;
    setLoadingMore(true);
    const rows = term
      ? await searchGifs(term, gifs.length)
      : await getTrendingGifs(trendingBase.current + gifs.length);
    if (id !== requestId.current) return;
    setGifs((prev) => {
      const seen = new Set(prev.map((gif) => gif.id));
      return [...prev, ...rows.filter((gif) => !seen.has(gif.id))];
    });
    setHasMore(rows.length === GIPHY_PAGE_SIZE);
    setLoadingMore(false);
  };

  const renderEmpty = () => {
    if (!isGiphyConfigured) return <Text style={styles.message}>GIF search is unavailable right now.</Text>;
    if (loading) return <ActivityIndicator style={styles.message} color={AppColors.textSecondary} />;
    const term = query.trim();
    return <Text style={styles.message}>{term ? `No GIFs found for “${term}”.` : 'No GIFs found.'}</Text>;
  };

  return (
    <View style={styles.body}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={AppColors.textPlaceholder} />
          <TextInput
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Search GIFs"
            placeholderTextColor={AppColors.textPlaceholder}
            autoCorrect={false}
            returnKeyType="search"
            style={styles.searchInput}
            accessibilityLabel="Search GIFs"
          />
          {query ? (
            <Pressable hitSlop={8} onPress={() => handleQueryChange('')} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={16} color={AppColors.textPlaceholder} />
            </Pressable>
          ) : null}
        </View>
        <Pressable hitSlop={8} onPress={onClose} accessibilityLabel="Close GIF picker" style={styles.closeButton}>
          <Ionicons name="close" size={22} color={AppColors.textPrimary} />
        </Pressable>
      </View>

      <FlatList
        data={loading ? [] : gifs}
        keyExtractor={(gif) => gif.id}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={styles.footerSpinner} color={AppColors.textSecondary} /> : null
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Select GIF: ${item.title}`}
            onPress={() => onSelect(item)}
            style={({ pressed }) => [styles.tile, { width: tileSize, height: tileSize }, pressed && styles.pressed]}>
            <Image source={{ uri: item.previewUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </Pressable>
        )}
      />

      {/* Required by the GIPHY API terms wherever GIPHY content is shown. */}
      <View style={styles.attribution}>
        <Text style={styles.poweredBy}>POWERED BY</Text>
        <Text style={styles.giphy}>GIPHY</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-end',
    backgroundColor: AppColors.overlay,
    zIndex: 10,
  },
  sheet: {
    height: '75%',
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.border,
    marginBottom: 16,
  },
  body: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: AppColors.background,
  },
  searchInput: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 15,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    gap: GAP,
    paddingBottom: 8,
  },
  column: {
    gap: GAP,
  },
  tile: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: AppColors.background,
  },
  pressed: {
    opacity: 0.7,
  },
  message: {
    color: AppColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
  footerSpinner: {
    paddingVertical: 12,
  },
  attribution: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.border,
  },
  poweredBy: {
    color: AppColors.textPlaceholder,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  giphy: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
});
