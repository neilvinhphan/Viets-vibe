import test from 'node:test';
import assert from 'node:assert/strict';
import { GARMENTS } from '../data/garments';
import { REFERENCE_OUTFITS_CATALOG } from '../data/referenceOutfits';
import { parseBingImageResults } from './webImageSearch.server';
import { findSimilarImages, selectModerateCandidates, VTON_MODERATE_SYSTEM_PROMPT } from './findSimilarImages.server';
import { buildHybridSearchQueries, vtonModifiers } from './referenceImageMatching';
const outfit = GARMENTS.filter(g => ['ao_ngu_than_tay_chen_nam', 'quan_jeans_y2k'].includes(g.id));
const live = parseBingImageResults(Array.from({ length: 10 }, (_, i) => `<a m='{"murl":"https://example.com/${i}.jpg","purl":"https://example.com/article","t":"Áo ngũ thân xanh lam jeans"}'></a>`).join(''));
const loadImage = async () => ({ bytes: Buffer.from([0xff, 0xd8, 0xff]), mime: 'image/jpeg' });
const queries = buildHybridSearchQueries(outfit);

test('queries preserve streetstyle and use moderate modifier within length limit', () => {
  for (const query of Object.values(queries)) {
    assert.ok(query.endsWith(vtonModifiers)); assert.ok(query.length <= 220);
    assert.doesNotMatch(query, /studio|đứng thẳng|mặt trước/);
  }
  assert.match(queries.remixSearchQuery, /Ngũ Thân xanh lam.*Jeans/);
  assert.match(queries.styleSearchQuery, /streetstyle/);
});
test('traditional outfit does not auto-append jeans or modern keywords', () => {
  const tradOutfit = GARMENTS.filter(g => ['ao_nhat_binh_cong_chua', 'quan_bach_quy'].includes(g.id));
  const tradQueries = buildHybridSearchQueries(tradOutfit);
  assert.doesNotMatch(tradQueries.remixSearchQuery, /jeans|sneaker|chân váy|streetstyle/i);
  assert.match(tradQueries.remixSearchQuery, /Áo Nhật Bình đỏ cổ phục Việt Nam/);
});
test('inclusive 65 threshold, descending top six, safe URLs and no old score caps', () => {
  const scores = [100, 99, 90, 88, 80, 65, 64.9, 59, 101, NaN];
  const candidates = live.map((img, i) => ({ imageUrl: img.imageUrl, matchScore: scores[i], matchReason: 'Toàn thân, nghiêng nhẹ 3/4.' }));
  candidates.push({ imageUrl: 'https://invented.example/image.jpg', matchScore: 100, matchReason: 'fake' }); candidates.push(candidates[0]);
  const selected = selectModerateCandidates({ candidates }, live);
  assert.deepEqual(selected.map(img => img.matchScore), [100, 99, 90, 88, 80, 65]);
  assert.equal(new Set(selected.map(img => img.id)).size, 6);
  assert.equal(selectModerateCandidates({ candidates: live.map(img => ({ imageUrl: img.imageUrl, matchScore: 90, matchReason: 'Tốt' })) }, live).length, 6);
});
test('direct heuristic scoring pipeline returns qualifying web images rapidly without vision', async () => {
  assert.ok(VTON_MODERATE_SYSTEM_PROMPT.includes('VTON'));
  const result = await findSimilarImages(outfit, { search: async () => live }, queries);
  assert.equal(result.searchMode, 'web');
  assert.equal(result.rankingMode, 'fallback');
  assert.ok(result.images.length > 0 && result.images.length <= 6);
  assert.ok(result.images.every(img => img.matchScore >= 65));
  assert.equal(result.warning, undefined);
});
test('empty or below-threshold search results return four distinct catalog references', async () => {
  const before = JSON.stringify(REFERENCE_OUTFITS_CATALOG);
  const lowScoreImages = parseBingImageResults(Array.from({ length: 5 }, (_, i) => `<a m='{"murl":"https://example.com/unrelated${i}.jpg","purl":"https://example.com","t":"áo khoác dạ"}'></a>`).join(''));
  for (const emptyOrLow of [[], lowScoreImages]) {
    const result = await findSimilarImages(outfit, { search: async () => emptyOrLow }, queries);
    assert.equal(result.searchMode, 'catalog');
    assert.equal(result.rankingMode, 'fallback');
    assert.equal(result.images.length, 4);
    assert.equal(new Set(result.images.map(img => img.id)).size, 4);
    assert.ok(result.images.every(img => REFERENCE_OUTFITS_CATALOG.some(ref => ref.id === img.id)));
    assert.ok(result.images.every(img => img.matchReason.includes('chưa giám định VTON')));
  }
  assert.equal(JSON.stringify(REFERENCE_OUTFITS_CATALOG), before);
});
test('empty search falls back, custom queries are unchanged', async () => {
  const searched: string[] = [];
  const result = await findSimilarImages(outfit, { search: async q => { searched.push(q); return []; }, generate: async () => { throw new Error('must not be called'); } }, queries);
  assert.deepEqual(searched, Object.values(queries)); assert.equal(result.images.length, 4); assert.equal(result.searchMode, 'catalog');
});
test('heuristic search returns qualifying images without warning banner', async () => {
  const result = await findSimilarImages(outfit, { search: async () => live });
  assert.equal(result.rankingMode, 'fallback');
  assert.equal(result.searchMode, 'web');
  assert.ok(result.images.length <= 6 && result.images.every(img => img.matchScore >= 65));
  assert.equal(result.warning, undefined);
});
test('total search failure still supplies catalog with a search warning', async () => {
  const result = await findSimilarImages(outfit, { search: async () => { throw new Error('Bing 429'); }, generate: async () => { throw new Error('quota'); } });
  assert.equal(result.searchMode, 'catalog');
  assert.equal(result.images.length, 4);
  assert.match(result.warning!, /truy vấn Web chưa hoàn tất/);
});
