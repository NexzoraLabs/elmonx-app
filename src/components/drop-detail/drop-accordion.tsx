import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { BURNED_EDITIONS } from '@/data/burned-editions';
import { isSpecialDrop, type Drop } from '@/services/drops-api';
import { useTranslation } from 'react-i18next';
import { appLocale } from '@/i18n';
import { SHARE_URL } from '@/config/env';
import { rich, slots } from '@/i18n/rich';

const XP_ARTICLE_URL = `${SHARE_URL}/articles/69cffe439d809e19546d7bc7`;

function isNA(value?: string | null): boolean {
  return !value || value.toLowerCase().includes('n/a');
}

function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
}

function formatDetailDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(appLocale('en-GB'), { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString(appLocale('en-US'), { hour: 'numeric', minute: '2-digit' });
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
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const [open, setOpen] = useState<string | null>(null);
  const [license, setLicense] = useState<{ title: string; description?: string } | null>(null);
  const toggle = (key: string) => setOpen((prev) => (prev === key ? null : key));

  const blindBoxItems = Array.isArray(drop.blind_box_items_data) ? drop.blind_box_items_data : [];
  const contract = drop.contract_address;
  const hideRarity = isSpecialDrop(drop._id);
  const burnedEditions = BURNED_EDITIONS[drop._id] ?? [];
  // Total after the burn: previous total minus the burned editions (website postBurnTotal).
  const postBurnTotal = Math.max(0, (drop.total_editions || 0) - burnedEditions.length);
  const editionsBreakdown = drop.editions_breakdown ?? [];

  return (
    <View style={styles.container}>
      <Section title={t('Description')} open={open === 'description'} onToggle={() => toggle('description')}>
        <Text style={styles.text}>{drop.description || t('No description available.')}</Text>
      </Section>

      <Section title={t('Editions')} open={open === 'editions'} onToggle={() => toggle('editions')}>
        {burnedEditions.length > 0 ? (
          <>
            {/* Drop with burned editions: previous total, remaining, burned, post-burn total, then the list. */}
            <Row label={t('Previous Total Editions')} value={String(drop.total_editions || 0)} />
            <Row label={t('Remaining Editions')} value={String(remaining)} />
            <Row label={t('Burned Editions')} value={String(burnedEditions.length)} />
            <Row label={t('Post Total Editions')} value={String(postBurnTotal)} />
            <View style={styles.burnedList}>
              <Text style={styles.text}>{t('These editions have been permanently burned and are no longer in circulation.')}</Text>
              {burnedEditions.map((edition) => (
                <Row key={edition.tokenId} label={edition.name} value={`#${edition.tokenId}`} />
              ))}
            </View>
          </>
        ) : (
          <>
            <Row label={t('Total Editions')} value={String(drop.total_editions || 0)} />
            <Row label={t('Remaining Editions')} value={String(remaining)} />
          </>
        )}
        {blindBoxItems.length > 0
          ? blindBoxItems.map((item) => {
              const itemRemaining = (item.total_editions || 0) - (item.consumed_editions || 0);
              return (
                <Row
                  key={item._id}
                  label={`${item.title || t('Item')}${item.rarity && !hideRarity ? ` - ${item.rarity}` : ''}`}
                  value={`${itemRemaining} / ${item.total_editions || 0}`}
                />
              );
            })
          : !hideRarity
            ? editionsBreakdown.map((edition, index) => (
                <Row key={`${edition.rarity}-${index}`} label={edition.rarity} value={String(edition.count)} />
              ))
            : null}
      </Section>

      <Section title={t('Details')} open={open === 'details'} onToggle={() => toggle('details')}>
        {drop.drop_edition ? <Row label={t('Drop Edition')} value={drop.drop_edition} /> : null}
        {drop.brands_data ? (
          <Row
            label={t('Artist')}
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
            label={t('Collection')}
            value={truncateWords(drop.collections_data.title, 2)}
            onPress={() => router.push({ pathname: '/collection/[id]', params: { id: drop.collections_data!._id } })}
          />
        ) : null}
        {drop.release_date ? (
          <Row
            label={drop.public_sale_date ? t('Private Release Date') : t('Release Date')}
            value={formatDetailDate(drop.release_date)}
          />
        ) : null}
        {drop.public_sale_date ? <Row label={t('Public Release Date')} value={formatDetailDate(drop.public_sale_date)} /> : null}
        {drop.royalty_percentage !== null && drop.royalty_percentage !== undefined && drop.royalty_percentage !== '' ? (
          <Row label={t('Secondary Fee')} value={`${drop.royalty_percentage}%`} />
        ) : null}
        {drop.licenses_data?.length ? (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('License')}</Text>
            <View style={styles.licenseList}>
              {drop.licenses_data.map((license) => (
                <Pressable
                  key={license._id}
                  hitSlop={4}
                  onPress={() => setLicense(license)}>
                  <Text style={styles.link}>{license.title}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : drop.license ? (
          <Row label={t('License')} value={drop.license} />
        ) : null}
        {!isNA(contract) ? (
          <Row
            label={t('Contract Address')}
            value={shortAddress(contract)}
            trailing={<Ionicons name="copy-outline" size={14} color={AppColors.link} />}
            onPress={async () => {
              await Clipboard.setStringAsync(contract);
              Alert.alert(t('Copied'), t('Contract address copied to clipboard.'));
            }}
          />
        ) : (
          <Row label={t('Contract Address')} value="N/A" />
        )}
        {drop.opensea_link && !isNA(drop.opensea_link) ? (
          <Row
            label={t('Secondary Market')}
            value={drop.maket_view_btn || t('View on OpenSea')}
            onPress={() => WebBrowser.openBrowserAsync(drop.opensea_link!)}
          />
        ) : null}
        {drop.edition_type && !isNA(drop.edition_type) ? (
          <Row
            label={t('Drop Information')}
            value={
              drop.drop_info_btn || (drop.drop_edition === 'Collaborations' ? t('Release Info') : t('View Medium Article'))
            }
            onPress={() => WebBrowser.openBrowserAsync(drop.edition_type!)}
          />
        ) : null}
      </Section>

      {drop.is_physical ? (
        <Section title={t('Physical Print')} open={open === 'physical'} onToggle={() => toggle('physical')}>
          <Text style={styles.text}>
            {rich(
              t('This drop includes a physical print. To receive it, you must have a {{address}} saved on your account before purchasing.', slots('address')),
              {
                address: (
                  <Text style={styles.link} accessibilityRole="link" onPress={() => router.push('/shipping-address')}>
                    {t('shipping address')}
                  </Text>
                ),
              }
            )}
          </Text>
        </Section>
      ) : null}

      {drop.type === 'Layer_2' && drop.sale_title === 'Private' ? (
        <Section title={t('Allowlist')} open={open === 'allowlist'} onToggle={() => toggle('allowlist')}>
          <Text style={styles.text}>
            {t('Private releases begin with an exclusive window for holders of qualifying works. When it closes, the release opens to everyone.')}
          </Text>
          <Pressable onPress={onCheckAllowlist} style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}>
            <Text style={styles.smallButtonText}>{t('Check Eligibility')}</Text>
          </Pressable>
        </Section>
      ) : null}

      {drop.type === 'Layer_2' && drop.is_blind_box === true ? (
        <Section title={t('Blind Box')} open={open === 'blindbox'} onToggle={() => toggle('blindbox')}>
          <Text style={styles.text}>
            {t('When you purchase from a Blind Box, you will receive a RANDOM collectible from this series, and you won\'t know which collectible you get until after payment.')}
          </Text>
        </Section>
      ) : null}

      <Section title={t('Earn XP with this purchase')} open={open === 'xp'} onToggle={() => toggle('xp')}>
        <Text style={styles.text}>{t('+50 XP · +550 XP on your first collectible')}</Text>
        <Pressable onPress={() => WebBrowser.openBrowserAsync(XP_ARTICLE_URL)} hitSlop={4}>
          <Text style={[styles.link, styles.linkSpaced]}>{t('How XP works')}</Text>
        </Pressable>
      </Section>

      {/* Website LicenseDetailModal ("License Details") as a bottom sheet. */}
      <BottomSheet visible={license !== null} onClose={() => setLicense(null)}>
        {license ? (
          <View style={styles.licenseSheet}>
            <Text style={styles.licenseSheetLabel}>{t('License Details')}</Text>
            <Text style={styles.licenseSheetTitle}>{license.title}</Text>
            <Text style={styles.text}>{license.description}</Text>
          </View>
        ) : null}
      </BottomSheet>
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
  const AppColors = useAppColors();
  const styles = useStyles();
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
  const styles = useStyles();
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

const useStyles = makeStyles((AppColors) => ({
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
  // Burned list under the totals, separated by a line.
  burnedList: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.border,
  },
  licenseSheet: {
    gap: 8,
    paddingBottom: 8,
  },
  licenseSheetLabel: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  licenseSheetTitle: {
    color: AppColors.textPrimary,
    fontSize: 18,
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
}));
