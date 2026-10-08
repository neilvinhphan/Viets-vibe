import { GARMENTS } from '../data/garments';
import { HISTORICAL_SCENES } from '../data/historicalScenes';
import type { Garment } from '../types';
import type { LookbookSnapshot } from './lookbookSnapshot';

export interface LookbookEntry extends LookbookSnapshot {
  favorite: boolean;
  updatedAt: number;
}
export interface CollectionLoad {
  snapshots: LookbookEntry[];
  notice: string;
  blocked: boolean;
}
export const LOOKBOOK_STORAGE_KEY = 'viet-phuc-remix.lookbook.v1';
export const LOOKBOOK_BACKUP_PREFIX = LOOKBOOK_STORAGE_KEY + '.backup.';
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isTime = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 8.64e15;
const isHex = (value: unknown): value is string =>
  typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);
const isPreview = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 600000 &&
  /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);

function readGarment(value: unknown): Garment | null {
  const saved = typeof value === 'string' ? { id: value } : value;
  if (!isObject(saved)) return null;
  const base = GARMENTS.find(item => item.id === saved.id);
  if (!base) return null;
  // Structural catalog fields evolve; recover by ID and preserve saved styling.
  const result: Garment = { ...base, citations: [...base.citations] };
  for (const key of ['colorHex', 'secondaryColorHex', 'accentColorHex'] as const) {
    if (saved[key] === undefined) continue;
    if (!isHex(saved[key])) return null;
    result[key] = saved[key];
  }
  for (const key of ['name', 'nameEn', 'colorName'] as const) {
    if (typeof saved[key] === 'string' && saved[key].trim() && saved[key].length <= 20000) result[key] = saved[key];
  }
  const patterns = ['phuong_hoang', 'long_van', 'hoa_sen', 'thuy_ba', 'ngu_hanh', 'plain', 'dam_may', 'modern_minimal'];
  if (typeof saved.patternType === 'string' && patterns.includes(saved.patternType)) {
    result.patternType = saved.patternType as Garment['patternType'];
  }
  return result;
}
function readEntry(value: unknown): LookbookEntry | null {
  if (!isObject(value) || (value.version !== undefined && value.version !== 1) ||
      typeof value.id !== 'string' || !value.id.trim() || value.id.length > 120 ||
      typeof value.title !== 'string' || !value.title.trim() || value.title.length > 60) return null;
  const createdAt = value.createdAt ?? value.timestamp;
  if (!isTime(createdAt)) return null;
  const savedGarments = Array.isArray(value.garments) ? value.garments : value.garmentIds;
  if (!Array.isArray(savedGarments) || !savedGarments.length) return null;
  const garments = savedGarments.map(readGarment);
  if (garments.some(item => !item) || new Set(garments.map(item => item!.id)).size !== garments.length) return null;
  const sceneId = isObject(value.scene) ? value.scene.id : value.sceneId;
  const scene = HISTORICAL_SCENES.find(item => item.id === sceneId);
  if (!scene) return null;
  const gender = value.gender ?? (garments.every(item => item!.gender === 'male') ? 'male' : 'female');
  const skinTone = value.skinTone ?? '#f6d8be';
  const sceneOpacity = value.sceneOpacity ?? 'subtle';
  const eventType = value.eventType ?? 'cafe';
  const weatherType = value.weatherType ?? 'mat_24';
  const validationMode = value.validationMode ?? 'genz_remix';
  if (!['female', 'male'].includes(String(gender)) || !isHex(skinTone) ||
      !['subtle', 'ultra_faint'].includes(String(sceneOpacity)) ||
      !['le_chua', 'concert', 'ky_yeu', 'cafe'].includes(String(eventType)) ||
      !['nang_35', 'mat_24', 'lanh_16'].includes(String(weatherType)) ||
      !['genz_remix', 'strict_historical'].includes(String(validationMode))) return null;
  return {
    version: 1, id: value.id, title: value.title.trim(), createdAt,
    updatedAt: isTime(value.updatedAt) ? value.updatedAt : createdAt,
    favorite: value.favorite === true, garments: garments as Garment[],
    scene: {
      id: scene.id,
      name: isObject(value.scene) && typeof value.scene.name === 'string' ? value.scene.name : scene.name,
      era: isObject(value.scene) && typeof value.scene.era === 'string' ? value.scene.era : scene.era,
    },
    gender: gender as LookbookEntry['gender'], skinTone,
    sceneOpacity: sceneOpacity as LookbookEntry['sceneOpacity'],
    eventType: eventType as LookbookEntry['eventType'],
    weatherType: weatherType as LookbookEntry['weatherType'],
    validationMode: validationMode as LookbookEntry['validationMode'],
    ...(isPreview(value.previewImage) ? { previewImage: value.previewImage } : {}),
  };
}
export function decodeLookbookCollection(raw: string | null): CollectionLoad {
  if (raw === null) return { snapshots: [], notice: '', blocked: false };
  try {
    const data: unknown = JSON.parse(raw);
    if (isObject(data) && data.version !== undefined && data.version !== 1) {
      return { snapshots: [], notice: 'Bộ sưu tập dùng phiên bản khác. Chưa ghi thay đổi để giữ dữ liệu.', blocked: true };
    }
    const items = Array.isArray(data) ? data : isObject(data) ? data.snapshots : undefined;
    if (!Array.isArray(items)) {
      return { snapshots: [], notice: 'Dữ liệu cũ chưa đọc được. Bản gốc sẽ được sao lưu khi bạn lưu bản phối mới.', blocked: false };
    }
    const snapshots: LookbookEntry[] = [];
    const ids = new Set<string>();
    for (const value of items) {
      const entry = readEntry(value);
      if (entry && !ids.has(entry.id)) { snapshots.push(entry); ids.add(entry.id); }
    }
    snapshots.sort((a, b) => b.createdAt - a.createdAt);
    const skipped = items.length - snapshots.length;
    return {
      snapshots, blocked: false,
      notice: skipped ? 'Có ' + skipped + ' bản cũ chưa đọc được. Bản gốc sẽ được sao lưu khi bạn lưu thay đổi.' : '',
    };
  } catch {
    return { snapshots: [], notice: 'Dữ liệu cũ chưa đọc được. Bản gốc sẽ được sao lưu khi bạn lưu bản phối mới.', blocked: false };
  }
}
export function loadLookbookCollection(): CollectionLoad {
  if (typeof window === 'undefined') return { snapshots: [], notice: '', blocked: false };
  try { return decodeLookbookCollection(window.localStorage.getItem(LOOKBOOK_STORAGE_KEY)); }
  catch { return { snapshots: [], notice: 'Trình duyệt đang chặn truy cập bộ sưu tập.', blocked: true }; }
}
export function writeLookbookCollection(snapshots: LookbookEntry[]): void {
  const raw = JSON.stringify({ version: 1, snapshots });
  const checked = decodeLookbookCollection(raw);
  if (checked.blocked || checked.notice) throw new Error('Bản phối chưa đủ dữ liệu để lưu. Hãy chọn lại trang phục.');
  try { window.localStorage.setItem(LOOKBOOK_STORAGE_KEY, raw); }
  catch { throw new Error('Chưa lưu được thay đổi. Bộ nhớ trình duyệt có thể đã đầy hoặc đang bị chặn.'); }
}
export function commitLookbookCollection(change: (current: LookbookEntry[]) => LookbookEntry[]): CollectionLoad {
  const latest = loadLookbookCollection();
  if (latest.blocked) throw new Error(latest.notice);
  const next = change(latest.snapshots);
  if (latest.notice) {
    try {
      const raw = window.localStorage.getItem(LOOKBOOK_STORAGE_KEY);
      if (raw !== null) {
        const id = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
        window.localStorage.setItem(LOOKBOOK_BACKUP_PREFIX + Date.now() + '.' + id, raw);
      }
    } catch { throw new Error('Chưa sao lưu được dữ liệu cũ. Hãy kiểm tra dung lượng bộ nhớ trình duyệt và thử lại.'); }
  }
  writeLookbookCollection(next);
  return { snapshots: next, notice: '', blocked: false };
}
export function validateLookbookTitle(value: string): string {
  const title = value.trim().replace(/\s+/g, ' ');
  if (!title) throw new Error('Hãy nhập tên bản phối.');
  if (title.length > 60) throw new Error('Tên bản phối tối đa 60 ký tự.');
  return title;
}
