import { Garment, DynastyId } from '../types';

export type EraId = 'ly_tran' | 'hau_le' | 'nguyen' | 'modern' | 'neutral';

export interface EraLightingTheme {
  eraId: EraId;
  name: string;
  dynastyPeriod: string;
  toneTitle: string;
  colorName: string;
  description: string;
  primaryGlow: string;
  secondaryGlow: string;
  ambientMist: string;
  backgroundColor: string;
  accentBorder: string;
  badgeBg: string;
  badgeText: string;
  badgeDot: string;
  badgeBorder: string;
}

export const ERA_LIGHTING_THEMES: Record<EraId, EraLightingTheme> = {
  ly_tran: {
    eraId: 'ly_tran',
    name: 'Thời Lý - Trần',
    dynastyPeriod: '1009 - 1400',
    toneTitle: 'Thanh Từ (Cool Celadon)',
    colorName: 'Men Ngọc Bích',
    description: 'Sắc ngọc bích thanh khiết lấy cảm hứng từ gốm men ngọc (Celadon) thời Lý - Trần và hào khí Đông A.',
    primaryGlow: 'rgba(64, 168, 138, 0.22)',
    secondaryGlow: 'rgba(38, 130, 105, 0.10)',
    ambientMist: 'rgba(95, 195, 165, 0.06)',
    backgroundColor: '#f2f8f5',
    accentBorder: 'rgba(64, 168, 138, 0.4)',
    badgeBg: 'bg-emerald-50/95',
    badgeText: 'text-emerald-900',
    badgeDot: 'bg-emerald-500',
    badgeBorder: 'border-emerald-300/80',
  },
  hau_le: {
    eraId: 'hau_le',
    name: 'Thời Hậu Lê',
    dynastyPeriod: '1428 - 1789',
    toneTitle: 'Chu Sa (Vermilion Crimson)',
    colorName: 'Đỏ Chu Sa Cổ Điển',
    description: 'Sắc đỏ chu sa và hồng điều trầm mặc của kinh thành Thăng Long văn hiến thời Lê sơ và Lê Trung Hưng.',
    primaryGlow: 'rgba(195, 52, 62, 0.18)',
    secondaryGlow: 'rgba(155, 30, 42, 0.08)',
    ambientMist: 'rgba(225, 85, 95, 0.05)',
    backgroundColor: '#faf4f4',
    accentBorder: 'rgba(195, 52, 62, 0.35)',
    badgeBg: 'bg-rose-50/95',
    badgeText: 'text-rose-900',
    badgeDot: 'bg-rose-500',
    badgeBorder: 'border-rose-300/80',
  },
  nguyen: {
    eraId: 'nguyen',
    name: 'Thời Nguyễn',
    dynastyPeriod: '1802 - 1945',
    toneTitle: 'Hoàng Kim (Warm Golden)',
    colorName: 'Hoàng Kim Sa Cung Đình',
    description: 'Sắc hoàng kim ấm áp mang hơi thở Cố Đô Huế, cung đình lầu son gác tía và lụa sa hạt chanh.',
    primaryGlow: 'rgba(217, 160, 36, 0.22)',
    secondaryGlow: 'rgba(195, 135, 20, 0.09)',
    ambientMist: 'rgba(245, 200, 75, 0.06)',
    backgroundColor: '#faf6f0',
    accentBorder: 'rgba(217, 160, 36, 0.4)',
    badgeBg: 'bg-amber-50/95',
    badgeText: 'text-amber-900',
    badgeDot: 'bg-amber-500',
    badgeBorder: 'border-amber-300/80',
  },
  modern: {
    eraId: 'modern',
    name: 'Tân Thời & Hiện Đại',
    dynastyPeriod: '1945 - Nay',
    toneTitle: 'Lam Ngọc (Cerulean Silk)',
    colorName: 'Xanh Lam Ngọc Thanh Tân',
    description: 'Sắc lam ngọc thanh tân hiện đại của phong trào canh tân áo dài và y phục thế kỷ 20.',
    primaryGlow: 'rgba(59, 130, 246, 0.16)',
    secondaryGlow: 'rgba(37, 99, 235, 0.07)',
    ambientMist: 'rgba(96, 165, 250, 0.05)',
    backgroundColor: '#f4f7fc',
    accentBorder: 'rgba(59, 130, 246, 0.35)',
    badgeBg: 'bg-sky-50/95',
    badgeText: 'text-sky-900',
    badgeDot: 'bg-sky-500',
    badgeBorder: 'border-sky-300/80',
  },
  neutral: {
    eraId: 'neutral',
    name: 'Lụa Sa Truyền Thống',
    dynastyPeriod: 'Đại Việt Cổ Phục',
    toneTitle: 'Bạch Sa (Warm Silk Parchment)',
    colorName: 'Ngà Tơ Tằm Cổ Điển',
    description: 'Ánh sáng dịu nhẹ tự nhiên của lụa tơ tằm dệt thủ công Hà Đông, hài hòa và tĩnh tại.',
    primaryGlow: 'rgba(217, 178, 110, 0.12)',
    secondaryGlow: 'rgba(190, 150, 90, 0.05)',
    ambientMist: 'rgba(230, 195, 130, 0.04)',
    backgroundColor: '#faf8f5',
    accentBorder: 'rgba(217, 178, 110, 0.3)',
    badgeBg: 'bg-stone-100/95',
    badgeText: 'text-stone-700',
    badgeDot: 'bg-stone-400',
    badgeBorder: 'border-stone-200/90',
  },
};

/**
 * Determines the dominant historical era of the equipped outfit
 * Priority: Outerwear (Layer 3) -> Robe (Layer 2) -> Majority of all equipped garments -> Neutral
 */
export function getOutfitEra(equippedGarments: Garment[]): EraId {
  if (!equippedGarments || equippedGarments.length === 0) {
    return 'neutral';
  }

  // 1. Primary visible outerwear (e.g. Nhật Bình, Đối Khâm)
  const outerwear = equippedGarments.find(g => g.category === 'outerwear');
  if (outerwear?.dynasty && outerwear.dynasty in ERA_LIGHTING_THEMES) {
    return outerwear.dynasty as EraId;
  }

  // 2. Primary visible robe (e.g. Viên Lĩnh, Giao Lĩnh, Áo Tấc, Ngũ Thân)
  const robe = equippedGarments.find(g => g.category === 'robe');
  if (robe?.dynasty && robe.dynasty in ERA_LIGHTING_THEMES) {
    return robe.dynasty as EraId;
  }

  // 3. Count frequencies among all equipped garments
  const counts: Partial<Record<EraId, number>> = {};
  for (const g of equippedGarments) {
    if (g.dynasty && g.dynasty in ERA_LIGHTING_THEMES) {
      const era = g.dynasty as EraId;
      counts[era] = (counts[era] || 0) + 1;
    }
  }

  let maxCount = 0;
  let dominantEra: EraId = 'neutral';
  for (const [dynasty, count] of Object.entries(counts)) {
    if (count && count > maxCount) {
      maxCount = count;
      dominantEra = dynasty as EraId;
    }
  }

  return dominantEra;
}
