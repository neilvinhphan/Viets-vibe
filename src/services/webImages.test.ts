import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeHtml, parseBingImageResults, readSearchHtml } from './webImageSearch.server';
import { fetchPublicImage, imageMime, isPublicAddress, validateImageUrl } from './imageProxy.server';

test('Bing m attributes decode entities and retain original, thumbnail and source URLs', () => {
  const metadata = { murl: 'https://photos.example.com/outfit.jpg?a=1&b=2', turl: 'https://ts1.mm.bing.net/thumb?id=123', purl: 'https://example.com/article', t: 'Áo ngũ thân xanh lam & jeans' };
  const encoded = JSON.stringify(metadata).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  const parsed = parseBingImageResults(`<a class="iusc" m="${encoded}"></a><a m='broken'></a><a m="${encoded}"></a>`);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].originalImageUrl, metadata.murl);
  assert.equal(parsed[0].sourceName, 'example.com');
  assert.equal(parsed[0].garmentId, 'ngu_than');
  assert.equal(parsed[0].category, 'remix');
  assert.equal(parsed[0].imageUrl, '/api/image-proxy?url=' + encodeURIComponent(metadata.murl));
  assert.ok(parsed[0].thumbnailUrl?.startsWith('/api/image-proxy?url='));
  assert.equal(decodeHtml('&#34;&#x22;&amp;&apos;'), '""&\'');
});

test('parser rejects executable/credential URLs and never invents missing image URLs', () => {
  const html = [{ murl: 'javascript:alert(1)', purl: 'https://example.com' }, { murl: 'https://u:p@example.com/a.jpg', purl: 'https://example.com' }, { t: 'not an image' }].map(m => `<a m='${JSON.stringify(m)}'></a>`).join('');
  assert.deepEqual(parseBingImageResults(html), []);
});

test('Bing HTTP errors and oversized HTML fail explicitly', async () => {
  await assert.rejects(readSearchHtml(new Response('blocked', { status: 429 })), /429/);
  await assert.rejects(readSearchHtml(new Response('x'.repeat(6 * 1024 * 1024 + 1), { headers: { 'Content-Type': 'text/html' } })), /too large/);
});

test('proxy blocks loopback, private, metadata, mapped and reserved IPs', async () => {
  for (const address of ['127.0.0.1', '10.1.2.3', '169.254.169.254', '192.168.1.2', '172.20.0.1', '100.100.100.200', '0.0.0.0', '::1', '::ffff:127.0.0.1', 'fc00::1', 'fe80::1', '2001:db8::1', '2002:7f00:1::']) assert.equal(isPublicAddress(address), false, address);
  for (const url of ['http://127.1/a.jpg', 'http://2130706433/a.jpg', 'http://0x7f000001/a.jpg', 'http://[::ffff:127.0.0.1]/a.jpg', 'http://localhost/a.jpg', 'file:///secret', 'http://example.com:3000/a.jpg', 'https://user:secret@example.com/a.jpg']) assert.throws(() => validateImageUrl(url), url);
  assert.equal(isPublicAddress('8.8.8.8'), true);
  assert.equal(isPublicAddress('2606:4700:4700::1111'), true);
  await assert.rejects(fetchPublicImage('http://127.0.0.1/a.jpg'), /Private/);
});

test('proxy validates raster signatures instead of trusting Content-Type', () => {
  assert.equal(imageMime(Buffer.from('<svg onload="alert(1)"></svg>')), undefined);
  assert.equal(imageMime(Buffer.from('<html>Access denied</html>')), undefined);
  assert.equal(imageMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg');
  assert.equal(imageMime(Buffer.from('RIFF0000WEBP')), 'image/webp');
});
