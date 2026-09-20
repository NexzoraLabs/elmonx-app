import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

export type CollectionsPage = {
  key: string;
  element: ReactNode;
};

type CollectionsPagerProps = {
  pages: CollectionsPage[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
};

// Web build: react-native-pager-view has no web target, so this falls back
// to showing just the selected page (no swipe gesture).
export function CollectionsPager({ pages, selectedIndex }: CollectionsPagerProps) {
  const current = pages[selectedIndex];
  // The `key` forces a remount on tab change — without it, React reuses the
  // same PaginatedGridPage instance across tabs (same component type in the
  // same slot) and its internal fetched data from the previous tab persists.
  return <View style={styles.page}>{current ? <View key={current.key} style={styles.page}>{current.element}</View> : null}</View>;
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
});
