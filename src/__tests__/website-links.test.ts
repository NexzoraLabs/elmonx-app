import { describe, expect, it } from '@jest/globals';
import { redirectSystemPath } from '@/app/+native-intent';
import { appRouteForWebsiteUrl } from '@/services/website-links';

const redirect = (path: string) => redirectSystemPath({ path, initial: true });

describe('website / deep links', () => {
  it('maps website drop, collection, auction and profile URLs', () => {
    expect(redirect('https://elmonx.com/drop/nympheas_en_fleur/abc123')).toBe('/drop/abc123');
    expect(redirect('https://elmonx.com/collection/monet/c1')).toBe('/collection/c1');
    expect(redirect('https://elmonx.com/auction/some_title/a1')).toBe('/auction/a1');
    expect(redirect('https://elmonx.com/profile/ateeb')).toBe('/profile/ateeb');
    expect(redirect('https://elmonx.com/blindbox-item/item_name/d1/i1')).toBe('/blindbox-item/d1/i1');
  });

  it('maps post and repost pages (the app’s own share links)', () => {
    expect(redirect('https://elmonx.com/post/p1')).toBe('/post/p1');
    expect(redirect('https://elmonx.com/post/repost/r1')).toBe('/post/repost/r1');
  });

  it('accepts the custom scheme in both website and app form', () => {
    expect(redirect('elmonxapp://drop/slug/d9')).toBe('/drop/d9');
    expect(redirect('elmonxapp://drop/d9')).toBe('/drop/d9');
  });

  it('ignores the sign-in callback and sends unknown website pages home', () => {
    expect(redirect('elmonxapp://auth?code=x&state=y')).toBeNull();
    expect(redirect('https://elmonx.com/some-unknown-page')).toBe('/');
  });

  it('resolves banner "internal" links, or null when the app has no screen', () => {
    expect(appRouteForWebsiteUrl('/collections')).toBe('/collections');
    expect(appRouteForWebsiteUrl('https://elmonx.com/drop/x/d1')).toBe('/drop/d1');
    expect(appRouteForWebsiteUrl('/pietmondrian-doodles')).toBeNull();
  });
});
