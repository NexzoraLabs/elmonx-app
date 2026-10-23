import { Dimensions, StyleSheet } from 'react-native';

import { makeStyles } from '@/context/theme-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

/** Shared by the Connections screen and its lists. */
export const useConnectionsStyles = makeStyles((AppColors) => ({
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabLabel: {
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    paddingBottom: 10,
  },
  tabLabelActive: {
    color: AppColors.textPrimary,
    fontWeight: '600',
  },
  tabIndicator: {
    alignSelf: 'stretch',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: {
    backgroundColor: AppColors.textPrimary,
  },
  pager: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  centeredLoader: {
    paddingVertical: 48,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  requestsSection: {
    marginBottom: 8,
  },
  subHeader: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginVertical: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.surface,
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: AppColors.textPrimary,
  },
  btnPrimaryText: {
    color: AppColors.background,
    fontSize: 12,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  btnSecondaryText: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  btnDanger: {
    backgroundColor: 'rgba(255,69,58,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.3)',
  },
  btnDangerText: {
    color: AppColors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
}));
