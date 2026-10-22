// Giphy REST API v1 — mirrors the website's `src/services/giphy.ts` so both clients pick the same
// renditions and apply the same rating rules. https://developers.giphy.com/docs/api/endpoint
import { GIPHY_API_KEY, GIPHY_CHANNEL } from '@/config/env';

const GIPHY_BASE = 'https://api.giphy.com/v1/gifs';
// Giphy's content rating. Applied to every open search; the @elmonx channel is our own content.
const RATING = 'g';

export const GIPHY_PAGE_SIZE = 24;
export const isGiphyConfigured = GIPHY_API_KEY.length > 0;
const channel = GIPHY_CHANNEL.trim();

type GiphyRendition = { url: string; width: string; height: string };

type GiphyGifRaw = {
  id: string;
  title: string;
  images: {
    fixed_width_downsampled?: GiphyRendition;
    fixed_width?: GiphyRendition;
    downsized?: GiphyRendition;
    downsized_medium?: GiphyRendition;
    original: GiphyRendition;
  };
};

/** Flattened GIF the picker emits and the composer stores. */
export type GiphyGif = {
  id: string;
  title: string;
  /** Small looping preview for the picker grid. */
  previewUrl: string;
  /** Rendition attached to the post (`downsized` is capped ~2MB by Giphy). */
  url: string;
  width: number;
  height: number;
};

function toGif(row: GiphyGifRaw): GiphyGif {
  const images = row.images ?? ({} as GiphyGifRaw['images']);
  const preview = images.fixed_width_downsampled ?? images.fixed_width ?? images.downsized ?? images.original;
  const full = images.downsized ?? images.downsized_medium ?? images.original;
  return {
    id: row.id,
    title: row.title?.trim() || 'GIF',
    previewUrl: preview?.url ?? '',
    url: full?.url ?? '',
    width: Number(preview?.width) || 0,
    height: Number(preview?.height) || 0,
  };
}

async function fetchGifs(
  endpoint: 'search' | 'trending',
  params: Record<string, string>,
  offset: number,
  applyRating: boolean,
): Promise<GiphyGif[]> {
  if (!isGiphyConfigured) return [];
  const query = new URLSearchParams({
    ...params,
    api_key: GIPHY_API_KEY,
    limit: String(GIPHY_PAGE_SIZE),
    offset: String(offset),
    bundle: 'messaging_non_clips',
    ...(applyRating ? { rating: RATING } : {}),
  });
  try {
    const res = await fetch(`${GIPHY_BASE}/${endpoint}?${query.toString()}`);
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: GiphyGifRaw[] };
    return Array.isArray(body.data) ? body.data.map(toGif).filter((gif) => gif.url) : [];
  } catch {
    return [];
  }
}

/** Website behaviour: with a channel set, "trending" = the channel's own GIFs from a random offset. */
export function trendingStartOffset(span = 200): number {
  return channel ? Math.floor(Math.random() * span) : 0;
}

export function getTrendingGifs(offset = 0): Promise<GiphyGif[]> {
  if (channel) return fetchGifs('search', { q: `@${channel}` }, offset, false);
  return fetchGifs('trending', {}, offset, true);
}

export function searchGifs(query: string, offset = 0): Promise<GiphyGif[]> {
  const term = query.trim();
  if (!term) return Promise.resolve([]);
  return fetchGifs('search', { q: term }, offset, true);
}

/** Same rule as the website's `isGif` (`src/utils/post.utils.ts`): a Giphy pick is stored in `images`. */
export function isGifUrl(url: string | undefined | null): boolean {
  return !!url && (/(^|\/\/)media\d*\.giphy\.com/i.test(url) || /\.gif(\?|#|$)/i.test(url));
}
