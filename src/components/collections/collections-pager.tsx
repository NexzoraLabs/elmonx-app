import { type ReactNode, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';

export type CollectionsPage = {
  key: string;
  element: ReactNode;
};

type CollectionsPagerProps = {
  pages: CollectionsPage[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
};

export function CollectionsPager({ pages, selectedIndex, onIndexChange }: CollectionsPagerProps) {
  const pagerRef = useRef<PagerView>(null);

  useEffect(() => {
    pagerRef.current?.setPage(selectedIndex);
  }, [selectedIndex]);

  return (
    <PagerView
      ref={pagerRef}
      style={styles.pager}
      initialPage={selectedIndex}
      onPageSelected={(event) => onIndexChange(event.nativeEvent.position)}>
      {pages.map((page) => (
        // collapsable={false}: without it Android can flatten this view away,
        // which breaks how the FlatList child inside gets measured.
        <View key={page.key} style={styles.page} collapsable={false}>
          {page.element}
        </View>
      ))}
    </PagerView>
  );
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
