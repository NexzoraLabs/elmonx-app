import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type AccordionSectionProps = {
  title: string;
  content?: string;
  children?: ReactNode;
};

export function AccordionSection({ title, content, children }: AccordionSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={() => setExpanded((prev) => !prev)}>
        <Text style={styles.title}>{title}</Text>
        <Ionicons
          name={expanded ? 'remove' : 'add'}
          size={20}
          color={AppColors.textPrimary}
        />
      </Pressable>
      {expanded ? (
        <View style={styles.body}>
          {content ? <Text style={styles.content}>{content}</Text> : null}
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  body: {
    marginTop: 12,
  },
  content: {
    color: AppColors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});
