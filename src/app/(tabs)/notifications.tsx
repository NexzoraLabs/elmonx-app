import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import * as notifApi from '@/services/notifications-api';
import type { AppNotification } from '@/services/notifications-api';

const ITEMS_PER_PAGE = 10;
// Fallback for notifications without an NFT/drop image: the white ELMONX header wordmark on a dark
// tile. Bundled locally — the old assets.elmonx.com logo URL returns 403.
const ELMONX_WORDMARK = require('@/assets/images/elmonx-wordmark.png');
const WORDMARK_RATIO = 644 / 83;

function ElmonxLogoTile({ size }: { size: number }) {
  const width = size * 0.8;
  return (
    <View style={[styles.logoTile, { width: size, height: size }]}>
      <Image
        source={ELMONX_WORDMARK}
        style={{ width, height: width / WORDMARK_RATIO }}
        contentFit="contain"
        accessibilityLabel="ElmonX"
      />
    </View>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function dayBucket(dateStr: string, now: number): string {
  const diff = Math.floor((now - new Date(dateStr).getTime()) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff <= 7) return 'This Week';
  return 'Older';
}

export default function NotificationsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AppNotification | null>(null);
  const [now] = useState(() => Date.now());

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const load = useCallback(async (p: number, append = false) => {
    if (!token) return;
    if (!append) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const res = await notifApi.getNotifications(token, p, ITEMS_PER_PAGE);
      // Mark all as seen locally (backend marks them on fetch)
      const seen = res.items.map((n) => ({ ...n, is_seen: true }));
      setItems((prev) => (append ? [...prev, ...seen] : seen));
      setTotal(res.total);
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load(1);
  }, [load]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={AppColors.link} />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => load(1)}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="notifications-off-outline" size={48} color={AppColors.textSecondary} />
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptySubtitle}>You don&apos;t have any notifications at the moment</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={() => { if (!loadingMore && page < totalPages) load(page + 1, true); }}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ paddingVertical: 16 }} color={AppColors.link} /> : null}
          renderItem={({ item, index }) => {
            const bucket = dayBucket(item.created_at, now);
            const prev = index > 0 ? items[index - 1] : null;
            const groupHeader = !prev || dayBucket(prev.created_at, now) !== bucket ? bucket : null;
            return (
              <>
                {groupHeader ? <GroupLabel label={groupHeader} /> : null}
                <NotifRow item={item} onPress={() => setSelected(item)} />
              </>
            );
          }}
        />
      )}

      {/* Detail Modal */}
      <NotifDetailModal
        notification={selected}
        onClose={() => setSelected(null)}
      />
    </SafeAreaView>
  );
}

function GroupLabel({ label }: { label: string }) {
  return <Text style={styles.groupLabel}>{label}</Text>;
}

function NotifRow({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const img = item.users_nft?.nft_image ?? item.drop_info?.image_url;
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}>
      <View style={styles.thumb}>
        {img ? (
          <Image source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="contain" transition={100} />
        ) : (
          <ElmonxLogoTile size={44} />
        )}
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.rowMessage} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.rowTime}>{timeAgo(item.created_at)}</Text>
      </View>
      {!item.is_seen && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

function NotifDetailModal({
  notification,
  onClose,
}: {
  notification: AppNotification | null;
  onClose: () => void;
}) {
  if (!notification) return null;
  const img = notification.users_nft?.nft_image ?? notification.drop_info?.image_url;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={() => {}}>
          {/* Title bar */}
          <View style={styles.dialogHeader}>
            <Text style={styles.dialogTitle} numberOfLines={2}>{notification.title}</Text>
            <Pressable hitSlop={8} onPress={onClose}>
              <Ionicons name="close" size={22} color={AppColors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Image */}
            <View style={styles.dialogImgWrap}>
              {img ? (
                <Image source={{ uri: img }} style={styles.dialogImg} contentFit="contain" />
              ) : (
                <ElmonxLogoTile size={80} />
              )}
            </View>

            {/* Details rows */}
            {notification.drop_info ? (
              <DetailRow label="Drop" value={notification.drop_info.title} />
            ) : null}
            {notification.users_nft ? (
              <DetailRow label="NFT" value={notification.users_nft.nft_name} />
            ) : null}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Message</Text>
              <Text style={styles.detailMessage}>{notification.message}</Text>
            </View>

            <DetailRow label="Status" value={notification.is_seen ? 'Read' : 'Unread'} valueStyle={notification.is_seen ? styles.seenText : styles.unseenText} />

            {notification.is_seen && notification.seen_at ? (
              <DetailRow
                label="Seen at"
                value={new Date(notification.seen_at).toLocaleString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              />
            ) : null}

            <DetailRow
              label="Received"
              value={new Date(notification.created_at).toLocaleString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            />
          </ScrollView>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DetailRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueStyle]} numberOfLines={3}>{value}</Text>
    </View>
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  headerTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  loader: { paddingVertical: 48 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: AppColors.danger,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: AppColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },

  /* List */
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },
  groupLabel: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 8,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: AppColors.background,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoTile: {
    borderRadius: 10,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  rowMessage: {
    color: AppColors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  rowTime: {
    color: AppColors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.link,
    flexShrink: 0,
  },

  /* Detail Modal */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 20,
    maxHeight: '85%',
    gap: 16,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  dialogTitle: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  dialogImgWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  dialogImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  detailRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
    gap: 4,
  },
  detailLabel: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  detailMessage: {
    color: AppColors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  seenText: {
    color: AppColors.success,
    fontWeight: '600',
  },
  unseenText: {
    color: '#F97316',
    fontWeight: '600',
  },
  closeBtn: {
    backgroundColor: AppColors.textPrimary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  closeBtnText: {
    color: AppColors.background,
    fontSize: 14,
    fontWeight: '700',
  },
});
