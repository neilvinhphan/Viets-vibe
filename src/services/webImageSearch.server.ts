import { createHash } from 'node:crypto';
import type { ReferenceOutfitImage } from '../data/referenceOutfits';
import { garmentFamily, normalize, tagsIn } from './referenceImageMatching';

export const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

export function decodeHtml(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|quot|apos|amp|lt|gt);/gi, (whole, entity: string) => {
    if (entity[0] === '#') {
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return ({ quot: '"', apos: "'", amp: '&', lt: '<', gt: '>' } as Record<string, string>)[entity.toLowerCase()] || whole;
  });
}

export function webUrl(value: unknown): string {
  if (typeof value !== 'string' || value.length > 4096) return '';
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return '';
    url.hash = '';
    return url.href;
  } catch { return ''; }
}

export function parseBingImageResults(html: string): ReferenceOutfitImage[] {
  const unique = new Map<string, ReferenceOutfitImage>();
  // Bing's iusc anchors carry JSON in an HTML-escaped m attribute, not image src.
  for (const anchor of html.matchAll(/<a\b[^>]*>/gi)) {
    const encoded = anchor[0].match(/\sm\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (!encoded) continue;
    try {
      const data = JSON.parse(decodeHtml(encoded[1] ?? encoded[2]));
      const originalImageUrl = webUrl(data.murl);
      const sourceUrl = webUrl(data.purl);
      if (!originalImageUrl || !sourceUrl || unique.has(originalImageUrl)) continue;
      const title = decodeHtml(String(data.t || data.desc || new URL(sourceUrl).hostname)).replace(/<[^>]*>|[\uE000-\uF8FF]/g, '').trim().slice(0, 240);
      const metadata = `${title} ${typeof data.desc === 'string' ? data.desc : ''}`;
      const thumbnail = webUrl(data.turl);
      unique.set(originalImageUrl, {
        id: `web-${createHash('sha256').update(originalImageUrl).digest('hex').slice(0, 20)}`,
        title, originalImageUrl, imageUrl: `/api/image-proxy?url=${encodeURIComponent(originalImageUrl)}`,
        thumbnailUrl: thumbnail ? `/api/image-proxy?url=${encodeURIComponent(thumbnail)}` : undefined,
        sourceName: new URL(sourceUrl).hostname.replace(/^www\./, ''), sourceUrl,
        category: /jeans|sneaker|streetstyle|streetwear|cach tan|hien dai/.test(normalize(metadata)) ? 'remix' : 'traditional',
        garmentId: garmentFamily(metadata), tags: tagsIn(metadata), matchScore: 0, matchReason: '',
      });
      if (unique.size >= 24) break;
    } catch { /* Skip malformed entries without discarding the rest of the page. */ }
  }
  return [...unique.values()];
}

export async function readSearchHtml(response: Response): Promise<string> {
  if (!response.ok) throw new Error(`Bing HTTP ${response.status}`);
  if (!response.headers.get('content-type')?.includes('text/html')) throw new Error('Bing did not return HTML');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty Bing response');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 6 * 1024 * 1024) throw new Error('Search response too large');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  return Buffer.concat(chunks).toString('utf8');
}
