import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';
import { BROWSER_USER_AGENT, webUrl } from './webImageSearch.server';

const blocked = new BlockList();
for (const [ip, prefix] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4]] as const) blocked.addSubnet(ip, prefix, 'ipv4');
const globalV6 = new BlockList();
globalV6.addSubnet('2000::', 3, 'ipv6');
blocked.addSubnet('2001::', 23, 'ipv6');
blocked.addSubnet('2001:db8::', 32, 'ipv6');
blocked.addSubnet('2002::', 16, 'ipv6');
blocked.addSubnet('3fff::', 20, 'ipv6');

export function isPublicAddress(address: string) {
  const family = isIP(address);
  if (family === 4) return !blocked.check(address, 'ipv4');
  return family === 6 && globalV6.check(address, 'ipv6') && !blocked.check(address, 'ipv6');
}

export function validateImageUrl(value: string) {
  const canonical = webUrl(value);
  if (!canonical) throw new Error('Invalid image URL');
  const url = new URL(canonical);
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || (isIP(host) && !isPublicAddress(host))) throw new Error('Private image URL');
  return url;
}

export function imageMime(bytes: Buffer): string | undefined {
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString())) return 'image/gif';
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (bytes.subarray(4, 8).toString() === 'ftyp' && ['avif', 'avis'].includes(bytes.subarray(8, 12).toString())) return 'image/avif';
}

export async function fetchPublicImage(value: string, signal: AbortSignal = AbortSignal.timeout(12000)): Promise<{ bytes: Buffer; mime: string }> {
  let url = validateImageUrl(value);
  for (let redirects = 0; redirects <= 3; redirects++) {
    signal.throwIfAborted();
    const host = url.hostname.replace(/^\[|\]$/g, '');
    // Pin the validated DNS result to the actual socket to prevent DNS rebinding.
    const addresses = isIP(host) ? [{ address: host, family: isIP(host) }] : await new Promise<Array<{ address: string; family: number }>>((resolve, reject) => {
      const onAbort = () => reject(new Error('Image DNS timeout'));
      signal.addEventListener('abort', onAbort, { once: true });
      lookup(host, { all: true, verbatim: true }).then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
    });
    if (!Array.isArray(addresses) || !addresses.length || addresses.some(item => !isPublicAddress(item.address))) throw new Error('Private image host');
    signal.throwIfAborted();
    const pinned = addresses.find(item => item.family === 4) || addresses[0];
    const response = await new Promise<{ redirect?: string; bytes?: Buffer }>((resolve, reject) => {
      const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, {
        agent: false, signal, maxHeaderSize: 16384,
        lookup: ((_host: string, options: any, callback: any) => options.all ? callback(null, [pinned]) : callback(null, pinned.address, pinned.family)) as any,
        headers: { 'User-Agent': BROWSER_USER_AGENT, Accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif', 'Accept-Encoding': 'identity' },
      }, res => {
        const status = res.statusCode || 0;
        if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
          res.destroy(); resolve({ redirect: res.headers.location }); return;
        }
        if (status !== 200 || !/^image\//i.test(res.headers['content-type'] || '') || Number(res.headers['content-length'] || 0) > 8 * 1024 * 1024) {
          res.destroy(); reject(new Error('Image source unavailable or unsupported')); return;
        }
        const chunks: Buffer[] = [];
        let total = 0;
        res.on('data', (chunk: Buffer) => {
          total += chunk.length;
          if (total > 8 * 1024 * 1024) { res.destroy(new Error('Image exceeds 8 MB')); return; }
          chunks.push(chunk);
        });
        res.on('end', () => resolve({ bytes: Buffer.concat(chunks) }));
        res.on('error', reject);
        res.on('aborted', () => reject(new Error('Image download interrupted')));
      });
      request.on('error', reject);
      request.end();
    });
    if (response.redirect) { url = validateImageUrl(new URL(response.redirect, url).href); continue; }
    const mime = imageMime(response.bytes!);
    if (!mime) throw new Error('Not a supported raster image');
    return { bytes: response.bytes!, mime };
  }
  throw new Error('Too many image redirects');
}
