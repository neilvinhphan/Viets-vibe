import type { Garment } from '../types';
import { REFERENCE_OUTFITS_CATALOG, type ReferenceOutfitImage, type SimilarImagesResult } from '../data/referenceOutfits';

export const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
export const GARMENT_FAMILIES: Record<string, string> = {
  nhat_binh: 'Áo Nhật Bình', ao_tac: 'Áo Tấc', ngu_than: 'Áo Ngũ Thân',
  giao_linh: 'Áo Giao Lĩnh', tu_than: 'Áo Tứ Thân', ao_dai: 'Áo Dài',
  doi_kham: 'Áo Đối Khâm', vien_linh: 'Áo Viên Lĩnh',
};
export function garmentFamily(text: string) {
  const value = normalize(text);
  return Object.keys(GARMENT_FAMILIES).find(key => value.includes(normalize(key))) || '';
}
export function mainGarment(garments: Garment[]) {
  // The visible outer layer (notably Nhật Bình) takes precedence over the inner robe.
  return garments.find(g => g.category === 'outerwear') || garments.find(g => g.category === 'robe');
}
export const vtonModifiers = 'chụp toàn thân rõ trang phục';
export function buildHybridSearchQueries(garments: Garment[]) {
  const main = mainGarment(garments);
  const name = main ? GARMENT_FAMILIES[garmentFamily(main.id)] || main.name : 'Việt phục';
  const color = main ? tagsIn(main.colorName)[0] || main.colorName.split('(')[0].trim() : '';
  const modernGarments = garments.filter(g => g.dynasty === 'modern' && g.id !== main?.id);
  const hasModern = modernGarments.length > 0;

  let remixBase: string;
  if (hasModern) {
    const modern = modernGarments.map(g => g.name).join(' ');
    remixBase = `${name} ${color} ${modern} phối đồ`.trim();
  } else {
    // Nếu người dùng đang mặc toàn bộ đồ truyền thống, câu truy vấn phản ánh đúng trang phục truyền thống đang mặc (ngắn gọn 5 - 8 từ, ví dụ: "Áo Nhật Bình đỏ cổ phục Việt Nam")
    remixBase = `${name} ${color} cổ phục Việt Nam`.trim();
  }

  const queries = {
    remixSearchQuery: remixBase.slice(0, 220),
    styleSearchQuery: hasModern ? `${name} cách tân streetstyle Việt phục` : `${name} ${color} Việt phục truyền thống`.trim(),
    traditionalSearchQuery: `${name} ${color} cổ phục Việt Nam`.trim(),
  };
  return Object.fromEntries(Object.entries(queries).map(([key, query]) => [key, `${query.slice(0, 219 - vtonModifiers.length).trim()} ${vtonModifiers}`])) as typeof queries;
}
export const fallbackQueries = buildHybridSearchQueries;

const concepts = [
  ['xanh lam', 'lam', 'indigo', 'denim', 'blue'], ['xanh lá', 'luc', 'ngoc bich', 'emerald', 'mint'],
  ['đỏ', 'do', 'chu sa', 'crimson', 'scarlet'], ['vàng', 'vang', 'hoang', 'gold', 'saffron'],
  ['trắng', 'trang', 'bach', 'white', 'ivory'], ['đen', 'den', 'huyen', 'hac', 'black'],
  ['tím', 'tim', 'purple'], ['hồng', 'hong', 'rose', 'pink'], ['nâu', 'nau', 'brown'],
  ['quần jeans', 'jeans', 'denim'], ['sneaker', 'sneaker', 'giay the thao'], ['boots', 'boots'],
  ['túi', 'tui', 'bag'], ['kính râm', 'kinh ram', 'sunglasses'], ['váy', 'vay', 'skirt', 'thuong xep'],
  ['quần lụa', 'quan lua', 'quan bach', 'silk trousers'], ['khăn đóng', 'khan dong'],
  ['khăn vấn', 'khan van'], ['thắt lưng', 'that lung'], ['nón lá', 'non la'],
];
function tagsIn(text: string) {
  const value = ` ${normalize(text)} `;
  return concepts.filter(([, ...aliases]) => aliases.some(alias => value.includes(` ${alias} `))).map(([tag]) => tag);
}
export function rankReferences(garments: Garment[], images = REFERENCE_OUTFITS_CATALOG): ReferenceOutfitImage[] {
  const main = mainGarment(garments);
  if (!main) return [];
  const family = garmentFamily(main.id);
  const colors = tagsIn(main.colorName).slice(0, 3);
  const accessories = tagsIn(garments.filter(g => g.id !== main.id).map(g => g.name).join(' '));
  const remix = garments.some(g => g.dynasty === 'modern');
  return images.map(img => {
    const same = Boolean(family && family === img.garmentId);
    const matchedColors = colors.filter(tag => img.tags.includes(tag));
    const matchedItems = accessories.filter(tag => img.tags.includes(tag));
    const style = img.category === (remix ? 'remix' : 'traditional');
    const matchScore = Math.min(98, 12 + (same ? 48 : 0) + Math.min(18, matchedColors.length * 9) + Math.min(14, matchedItems.length * 7) + (style ? 8 : 0));
    const reasons = [same ? `Cùng ${GARMENT_FAMILIES[family]}` : 'Tham khảo kiểu Việt phục khác',
      matchedColors.length ? `gần màu ${matchedColors.join(', ')}` : '',
      matchedItems.length ? `có ${matchedItems.join(', ')}` : '',
      style ? (remix ? 'phối hiện đại' : 'phong cách truyền thống') : 'khác phong cách phối'];
    return { ...img, matchScore, matchReason: reasons.filter(Boolean).join('; ') + '.' };
  }).sort((a, b) => b.matchScore - a.matchScore);
}
export function localReferenceResult(garments: Garment[]): SimilarImagesResult {
  return { ...fallbackQueries(garments), images: rankReferences(garments), queryMode: 'fallback', rankingMode: 'fallback', searchMode: 'offline' };
}
export { tagsIn };
