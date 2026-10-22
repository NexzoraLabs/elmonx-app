/**
 * ElmonX's internal test account (Ateeb-123), same hardcode as the old Unity app
 * (`BlindBoxItemDetails.SetModelData`): AR on every 3D model, owned or not, and a few extra
 * models in the Multi-Viewer so it can be tested without owning anything.
 */
const AR_TEST_USER_IDS = new Set(['63f0be72f3c584a51324e10f']);

export function isArTestAccount(userId: string | null | undefined): boolean {
  return !!userId && AR_TEST_USER_IDS.has(userId);
}

/** How many not-owned models the test account gets in the Multi-Viewer. */
export const TEST_ACCOUNT_EXTRA_MULTI_VIEWER_ITEMS = 5;
