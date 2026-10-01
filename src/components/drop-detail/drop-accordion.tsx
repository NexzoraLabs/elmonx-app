import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';
import { isSpecialDrop, type Drop } from '@/services/drops-api';

const XP_ARTICLE_URL = 'https://elmonx.com/articles/69cffe439d809e19546d7bc7';

function isNA(value?: string | null): boolean {
  return !value || value.toLowerCase().includes('n/a');
}

function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
}

function formatDetailDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date} ${time}`;
}

/** Website truncates the collection title to its first 2 words + "...". */
function truncateWords(text: string, count: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  return words.length > count ? `${words.slice(0, count).join(' ')}...` : text;
}

type Props = {
  drop: Drop;
  remaining: number;
  onCheckAllowlist: () => void;
};

export function DropAccordion({ drop, remaining, onCheckAllowlist }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (key: string) => setOpen((prev) => (prev === key ? null : key));

  const blindBoxItems = drop.blind_box_items_data ?? [];
  const contract = drop.contract_address;
  const hideRarity = isSpecialDrop(drop._id);

  return (
    <View style={styles.container}>
      <Section title="Description" open={open === 'description'} onToggle={() => toggle('description')}>
        <Text style={styles.text}>{drop.description || 'No description available.'}</Text>
      </Section>

      <Section title="Editions" open={open === 'editions'} onToggle={() => toggle('editions')}>
        <Row label="Total Editions" value={String(drop.total_editions || 0)} />
        <Row label="Remaining Editions" value={String(remaining)} />
        {blindBoxItems.map((item) => {
          const itemRemaining = (item.total_editions || 0) - (item.consumed_editions || 0);
          return (
            <Row
              key={item._id}
              label={`${item.title || 'Item'}${item.rarity && !hideRarity ? ` - ${item.rarity}` : ''}`}
              value={`${itemRemaining} / ${item.total_editions || 0}`}
            />
          );
        })}
      </Section>

      <Section title="Details" open={open === 'details'} onToggle={() => toggle('details')}>
        {drop.drop_edition ? <Row label="Drop Edition" value={drop.drop_edition} /> : null}
        {drop.brands_data ? (
          <Row
            label="Artist"
            value={drop.brands_data.title}
            onPress={() =>
              router.push({
                pathname: '/artist/[id]',
                params: {
                  id: drop.brands_data!._id,
                  name: drop.brands_data!.title,
                  image: drop.brands_data!.image_url ?? '',
                  description: drop.brands_data!.description ?? '',
                },
              })
            }
          />
        ) : null}
        {drop.collections_data ? (
          <Row
            label="Collection"
            value={truncateWords(drop.collections_data.title, 2)}
            onPress={() => router.push({ pathname: '/collection/[id]', params: { id: drop.collections_data!._id } })}
          />
        ) : null}
        {drop.release_date ? (
          <Row
            label={drop.public_sale_date ? 'Private Release Date' : 'Release Date'}
            value={formatDetailDate(drop.release_date)}
          />
        ) : null}
        {drop.public_sale_date ? <Row label="Public Release Date" value={formatDetailDate(drop.public_sale_date)} /> : null}
        {drop.royalty_percentage !== null && drop.royalty_percentage !== undefined && drop.royalty_percentage !== '' ? (
          <Row label="Secondary Fee" value={`${drop.royalty_percentage}%`} />
        ) : null}
        {drop.licenses_data?.length ? (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>License</Text>
            <View style={styles.licenseList}>
              {drop.licenses_data.map((license) => (
                <Pressable
                  key={license._id}
                  hitSlop={4}
                  onPress={() => Alert.alert(license.title, license.description || '')}>
                  <Text style={styles.link}>{license.title}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : drop.license ? (
          <Row label="License" value={drop.license} />
        ) : null}
        {!isNA(contract) ? (
          <Row
            label="Contract Address"
            value={shortAddress(contract)}
            trailing={<Ionicons name="copy-outline" size={14} color={AppColors.link} />}
            onPress={async () => {
              await Clipboard.setStringAsync(contract);
              Alert.alert('Copied', 'Contract address copied to clipboard.');
            }}
          />
        ) : (
          <Row label="Contract Address" value="N/A" />
        )}
        {drop.opensea_link && !isNA(drop.opensea_link) ? (
          <Row
            label="Secondary Market"
            value={drop.maket_view_btn || 'View on OpenSea'}
            onPress={() => WebBrowser.openBrowserAsync(drop.opensea_link!)}
          />
        ) : null}
        {drop.edition_type && !isNA(drop.edition_type) ? (
          <Row
            label="Drop Information"
            value={
              drop.drop_info_btn || (drop.drop_edition === 'Collaborations' ? 'Release Info' : 'View Medium Article')
            }
            onPress={() => WebBrowser.openBrowserAsync(drop.edition_type!)}
          />
        ) : null}
      </Section>

      {drop.is_physical ? (
        <Section title="Physical Print" open={open === 'physical'} onToggle={() => toggle('physical')}>
          <Text style={styles.text}>
            This drop includes a physical print. Please make sure you have added a shipping address so we can deliver
            it to you.
          </Text>
          <Pressable onPress={() => router.push('/shipping-address')} hitSlop={4}>
            <Text style={[styles.link, styles.linkSpaced]}>Manage shipping address</Text>
          </Pressable>
        </Section>
      ) : null}

      {drop.type === 'Layer_2' && drop.sale_title === 'Private' ? (
        <Section title="Allowlist" open={open === 'allowlist'} onToggle={() => toggle('allowlist')}>
          <Text style={styles.text}>
            Private releases begin with an exclusive window for holders of qualifying works. When it closes, the
            release opens to everyone.
          </Text>
          <Pressable onPress={onCheckAllowlist} style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}>
            <Text style={styles.smallButtonText}>Check Eligibility</Text>
          </Pressable>
        </Section>
      ) : null}

      {drop.type === 'Layer_2' && drop.is_blind_box === true ? (
        <Section title="Blind Box" open={open === 'blindbox'} onToggle={() => toggle('blindbox')}>
          <Text style={styles.text}>
            When you purchase from a Blind Box, you will receive a RANDOM collectible from this series, and you
            won&apos;t know which collectible you get until after payment.
          </Text>
        </Section>
      ) : null}

      <Section title="Earn XP" open={open === 'xp'} onToggle={() => toggle('xp')}>
        <Text style={styles.text}>+50 XP · +550 XP on your first collectible</Text>
        <Pressable onPress={() => WebBrowser.openBrowserAsync(XP_ARTICLE_URL)} hitSlop={4}>
          <Text style={[styles.link, styles.linkSpaced]}>Learn more</Text>
        </Pressable>
      </Section>
    </View>
  );
}

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Pressable style={styles.header} onPress={onToggle}>
        <Text style={styles.title}>{title}</Text>
        <Ionicons name={open ? 'remove' : 'add'} size={20} color={AppColors.textPrimary} />
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

function Row({
  label,
  value,
  onPress,
  trailing,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {onPress ? (
        <Pressable onPress={onPress} hitSlop={4} style={styles.rowValueTouch}>
          <Text style={[styles.rowValue, styles.link]} numberOfLines={1}>
            {value}
          </Text>
          {trailing}
        </Pressable>
      ) : (
        <Text style={styles.rowValue} numberOfLines={2}>
          {value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  section: {
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
    gap: 2,
  },
  text: {
    color: AppColors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 7,
  },
  rowLabel: {
    color: AppColors.textSecondary,
    fontSize: 13,
  },
  rowValueTouch: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    flexShrink: 1,
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  licenseList: {
    flexShrink: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  link: {
    color: AppColors.link,
    fontSize: 13,
    fontWeight: '600',
  },
  linkSpaced: {
    marginTop: 8,
  },
  smallButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: AppColors.buttonPrimaryBg,
  },
  smallButtonText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
