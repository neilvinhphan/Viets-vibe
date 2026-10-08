import test from 'node:test';
import assert from 'node:assert/strict';
import { GARMENTS } from '../data/garments';
import { HISTORICAL_SCENES } from '../data/historicalScenes';
import { createLookbookSnapshot } from './lookbookSnapshot';
import { decodeLookbookCollection, commitLookbookCollection, loadLookbookCollection,
  LOOKBOOK_STORAGE_KEY, LOOKBOOK_BACKUP_PREFIX, type LookbookEntry } from './lookbookStorage';

function entry(): LookbookEntry {
  const snapshot = createLookbookSnapshot({
    title: 'Outfit', garments: [GARMENTS[0]], scene: HISTORICAL_SCENES[0],
    sceneOpacity: 'subtle', gender: 'female', skinTone: '#f6d8be',
    eventType: 'cafe', weatherType: 'mat_24', validationMode: 'genz_remix',
  });
  return { ...snapshot, favorite: false, updatedAt: snapshot.createdAt };
}
function storage(raw: string | null) {
  const values = new Map<string, string>();
  if (raw !== null) values.set(LOOKBOOK_STORAGE_KEY, raw);
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    localStorage: { getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value) },
  } });
  return values;
}
const encode = (snapshots: unknown[]) => JSON.stringify({ version: 1, snapshots });

test('new saves survive JSON round trip with PNG previews', () => {
  const saved = entry();
  saved.previewImage = 'data:image/png;base64,iVBORw0KGgo=';
  const loaded = decodeLookbookCollection(encode([saved]));
  assert.equal(loaded.notice, '');
  assert.equal(loaded.snapshots[0].previewImage, saved.previewImage);
  assert.deepEqual(loaded.snapshots[0].garments, saved.garments);
});
test('old metadata and missing fields hydrate without blocking saves', () => {
  const old: any = JSON.parse(JSON.stringify(entry()));
  old.garments[0].dynasty = 'old-dynasty';
  old.garments[0].layerSlot = 99;
  old.garments[0].colorHex = '#123456';
  delete old.garments[0].citations;
  delete old.garments[0].secondaryColorHex;
  delete old.updatedAt;
  delete old.favorite;
  const loaded = decodeLookbookCollection(encode([old]));
  assert.equal(loaded.notice, '');
  assert.equal(loaded.snapshots[0].garments[0].dynasty, GARMENTS[0].dynasty);
  assert.equal(loaded.snapshots[0].garments[0].colorHex, '#123456');
  assert.equal(loaded.snapshots[0].favorite, false);
});
test('legacy garment IDs are recovered', () => {
  const saved = entry();
  const old = { id: saved.id, title: saved.title, timestamp: saved.createdAt,
    garmentIds: [GARMENTS[0].id], sceneId: HISTORICAL_SCENES[0].id };
  assert.equal(decodeLookbookCollection(encode([old])).snapshots.length, 1);
});
test('bad entries no longer block saves; backup, rename, favorite and delete work', () => {
  const existing = entry();
  const raw = encode([existing, { id: 'broken' }]);
  const values = storage(raw);
  const added = entry();
  commitLookbookCollection(current => [added, ...current]);
  assert.equal(loadLookbookCollection().snapshots.length, 2);
  assert.equal(loadLookbookCollection().notice, '');
  assert.ok([...values.entries()].some(([key, value]) => key.startsWith(LOOKBOOK_BACKUP_PREFIX) && value === raw));
  commitLookbookCollection(current => current.map(item => item.id === added.id ? { ...item, title: 'Renamed', favorite: true } : item));
  assert.equal(loadLookbookCollection().snapshots.find(item => item.id === added.id)?.title, 'Renamed');
  assert.equal(loadLookbookCollection().snapshots.find(item => item.id === added.id)?.favorite, true);
  commitLookbookCollection(current => current.filter(item => item.id !== added.id));
  assert.equal(loadLookbookCollection().snapshots[0].id, existing.id);
});
test('malformed JSON is backed up before recovery', () => {
  const raw = '{broken';
  const values = storage(raw);
  commitLookbookCollection(() => [entry()]);
  assert.equal(loadLookbookCollection().snapshots.length, 1);
  assert.ok([...values.entries()].some(([key, value]) => key.startsWith(LOOKBOOK_BACKUP_PREFIX) && value === raw));
});
test('newer versions remain untouched', () => {
  const raw = JSON.stringify({ version: 2, snapshots: [] });
  const values = storage(raw);
  assert.throws(() => commitLookbookCollection(() => [entry()]));
  assert.equal(values.get(LOOKBOOK_STORAGE_KEY), raw);
});
test('failed backups preserve the original', () => {
  const raw = encode([{ id: 'broken' }]);
  const values = storage(raw);
  window.localStorage.setItem = () => { throw new Error('QuotaExceeded'); };
  assert.throws(() => commitLookbookCollection(() => [entry()]));
  assert.equal(values.get(LOOKBOOK_STORAGE_KEY), raw);
});
test('unsafe previews are discarded while valid outfits remain', () => {
  const saved = entry();
  saved.previewImage = 'data:image/svg+xml,<svg onload=alert(1) />';
  const loaded = decodeLookbookCollection(encode([saved]));
  assert.equal(loaded.snapshots.length, 1);
  assert.equal(loaded.snapshots[0].previewImage, undefined);
});
