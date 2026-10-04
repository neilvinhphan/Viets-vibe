import { Garment, ValidationResult, ValidationIssue, ValidationMode, EventType, WeatherType, RemixBalance } from '../types';
import { GARMENTS } from '../data/garments';

// Helper to convert HEX to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = Math.round(h * 60);
  }

  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Compute Color Harmony between equipped garments
export function calculateColorHarmony(garments: Garment[]): number {
  if (garments.length <= 1) return 100;

  const hslList = garments
    .map(g => (g.colorHex ? hexToHsl(g.colorHex) : null))
    .filter((c): c is { h: number; s: number; l: number } => c !== null);

  if (hslList.length <= 1) return 95;

  let harmonyScore = 92;

  // Check contrast between outermost layers and bottoms
  const hues = hslList.map(c => c.h);
  const lightnesses = hslList.map(c => c.l);

  // Measure hue differences
  let totalDelta = 0;
  let comparisons = 0;
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      let diff = Math.abs(hues[i] - hues[j]);
      if (diff > 180) diff = 360 - diff;
      totalDelta += diff;
      comparisons++;
    }
  }

  const avgHueDiff = comparisons > 0 ? totalDelta / comparisons : 0;

  // Good traditional palettes:
  // 1. Analogous / Tone-sur-tone (avgDiff < 45) -> Elegant, calm
  // 2. Complementary (avgDiff between 140 and 180) -> Rich royal contrast
  // 3. Neutrals (lightness very high or low, saturation < 25) paired with vibrant colors -> Highly harmonious
  const neutralsCount = hslList.filter(c => c.s < 25 || c.l > 85 || c.l < 18).length;
  if (neutralsCount >= 1) {
    harmonyScore += 6; // Neutrals like Bach Quy (white) or Jet Black harmonize everything
  }

  if (avgHueDiff < 40 || (avgHueDiff > 140 && avgHueDiff < 180)) {
    harmonyScore += 5;
  } else if (avgHueDiff >= 70 && avgHueDiff <= 110) {
    // Unresolved triadic clash without enough neutrals
    if (neutralsCount === 0) {
      harmonyScore -= 8;
    }
  }

  // Check lightness contrast (avoiding muddy outfits where everything is medium gray)
  const maxL = Math.max(...lightnesses);
  const minL = Math.min(...lightnesses);
  if (maxL - minL > 35) {
    harmonyScore += 4; // Clear depth separation
  }

  return Math.max(65, Math.min(100, harmonyScore));
}

export interface ValidationOptions {
  validationMode?: ValidationMode;
  sceneId?: string;
  eventType?: EventType;
  weatherType?: WeatherType;
}

export function validateOutfit(
  equippedGarmentIds: string[],
  options: ValidationOptions = {}
): ValidationResult {
  const mode = options.validationMode || 'genz_remix';
  const sceneId = options.sceneId || 'hue_citadel';
  const eventType = options.eventType || 'concert';
  const weatherType = options.weatherType || 'mat_24';

  const equipped = equippedGarmentIds
    .map(id => GARMENTS.find(g => g.id === id))
    .filter((g): g is Garment => g !== undefined);

  const issues: ValidationIssue[] = [];
  const garmentCount = equipped.length;

  // Calculate Remix Balance
  const modernGarments = equipped.filter(g => g.dynasty === 'modern');
  const traditionalGarments = equipped.filter(g => g.dynasty !== 'modern');

  let traditionalPercent = 100;
  let modernPercent = 0;
  if (garmentCount > 0) {
    traditionalPercent = Math.round((traditionalGarments.length / garmentCount) * 100);
    modernPercent = 100 - traditionalPercent;
  }

  const remixBalance: RemixBalance = {
    traditionalPercent,
    modernPercent,
    label:
      modernPercent === 0
        ? '100% Cổ Điển Thuần Khiết'
        : traditionalPercent === 0
        ? '100% Thời Trang Hiện Đại'
        : `${traditionalPercent}% Cổ Điển • ${modernPercent}% Gen Z Remix`,
  };

  const colorHarmonyScore = calculateColorHarmony(equipped);

  if (garmentCount === 0) {
    return {
      isValid: false,
      validationMode: mode,
      metrics: {
        overallScore: 0,
        dynastyPurity: 100,
        layerIntegrity: 0,
        formalityHarmony: 100,
        status: 'historically_invalid',
      },
      remixBalance,
      colorHarmonyScore: 0,
      contextFitScore: 0,
      issues: [
        {
          id: 'empty_outfit',
          ruleCode: 'RULE_EMPTY',
          type: 'missing_essential_layer',
          severity: 'error',
          title: 'Chưa có trang phục nào được mặc',
          message: 'Hãy chọn các lớp y phục truyền thống từ Tủ Đồ hoặc thử các mẫu phối Gen Z Remix.',
          historicalExplanation:
            'Trang phục Việt Cổ đòi hỏi cấu trúc phân tầng trang nhã từ lớp lót, áo chính, quần/thường đến đai khăn phụ kiện.',
          garmentIds: [],
        },
      ],
      eraSummary: 'Chưa xác định niên đại',
      garmentCount: 0,
      recommendations: ['Hãy bắt đầu bằng việc chọn Áo chính (Áo Ngũ Thân, Áo Dài Tân Thời hoặc Giao Lĩnh) và Quần/Thường.'],
    };
  }

  // Categories presence
  const hasBottom = equipped.some(g => g.category === 'bottom');
  const hasRobe = equipped.some(g => g.category === 'robe');
  const hasOuterwear = equipped.some(g => g.category === 'outerwear');
  const hasUndergarment = equipped.some(g => g.category === 'undergarment');
  const hasHeadwear = equipped.some(g => g.category === 'headwear');
  const hasFootwear = equipped.some(g => g.category === 'footwear');

  // --- RULE 1: STRUCTURAL INTEGRITY & ESSENTIAL LAYERS ---
  // 1.1 Missing bottom layer
  if (!hasBottom && (hasRobe || hasOuterwear)) {
    issues.push({
      id: 'missing_bottom',
      ruleCode: 'RULE_LAYER_NO_BOTTOM',
      type: 'missing_essential_layer',
      severity: 'error',
      title: 'Thiếu y phục hạ thân (Quần, Thường hoặc Váy)',
      message: 'Trong văn hóa trang phục Việt Nam, vạt áo dài hoặc áo thụng luôn phải mặc kèm quần hai ống hoặc váy thường.',
      historicalExplanation:
        'Từ cải cách y phục Đàng Trong năm 1744 của Chúa Nguyễn Phúc Khoát cho đến chỉ dụ thống nhất y phục năm 1827 của Vua Minh Mạng, mặc áo dài mà không có quần hạ thân bị coi là đại nghịch bất đạo và vi phạm nghiêm trọng thuần phong mỹ tục.',
      citation: 'Đại Nam Thực Lục - Tiền Biên & Chính Biên',
      garmentIds: equipped.filter(g => g.category === 'robe' || g.category === 'outerwear').map(g => g.id),
      suggestedFix: 'Bổ sung thêm Quần Bạch Quy, Quần Jeans Y2K hoặc Thường Xếp Li.',
    });
  }

  // 1.2 Outerwear without inner robe (Áo Nhật Bình / Đối Khâm without main robe)
  // CRITICAL CULTURAL RULE: Must have inner robe AND Collar Lapel Rule "Hữu Nhậm"
  if (hasOuterwear && !hasRobe) {
    const outerItems = equipped.filter(g => g.category === 'outerwear');
    issues.push({
      id: 'outerwear_without_robe',
      ruleCode: 'RULE_LAYER_OUTER_WITHOUT_ROBE',
      type: 'layer_order',
      severity: 'error',
      title: 'Áo khoác ngoài (Áo Nhật Bình / Đối Khâm) thiếu lớp áo chính bên trong',
      message: 'Áo Nhật Bình và Áo Đối Khâm là áo khoác ngoài nghi lễ, bắt buộc phải có áo chính (Áo Tấc, Áo Ngũ Thân) bên trong cài kín cổ.',
      historicalExplanation:
        'Theo "Khâm Định Đại Nam Hội Điển Sự Lệ", Nhật Bình là "Thường triều phục". Phía trong áo Nhật Bình bắt buộc phải mặc một chiếc áo ngũ thân hoặc áo tấc đóng kín cổ rồi mới khoác Nhật Bình ra ngoài. Đồng thời, cổ áo truyền thống luôn tuân thủ nghiêm ngặt quy tắc "Hữu nhậm" (vạt trái đè vạt phải, tuyệt đối không mặc ngược thành Tả nhậm - vốn là tục mặc cho người đã khuất).',
      citation: 'Khâm Định Đại Nam Hội Điển Sự Lệ - Quy chế Mũ Áo Cung Đình',
      garmentIds: outerItems.map(g => g.id),
      suggestedFix: 'Mặc thêm Áo Tấc Lễ Phục hoặc Áo Ngũ Thân bên trong trước khi khoác Áo Nhật Bình.',
    });
  }

  // 1.3 Undergarment (Yếm) exposed without main robe when accessorized
  if (hasUndergarment && !hasRobe && !hasOuterwear && (hasHeadwear || hasFootwear)) {
    issues.push({
      id: 'bare_undergarment',
      ruleCode: 'RULE_LAYER_EXPOSED_UNDERWEAR',
      type: 'layer_order',
      severity: 'warning',
      title: 'Lớp nội y (Áo Yếm) chưa có áo thân che phủ bên ngoài',
      message: 'Áo Yếm là lớp y phục lót thân mật. Khi ra ngoài hoặc đội mũ khăn chỉnh tề, cần có áo chính khoác ngoài.',
      historicalExplanation:
        'Trong xã hội truyền thống, phụ nữ chỉ mặc yếm trần khi lao động đồng áng hoặc trong khuê phòng. Khi xuất hiện nơi công cộng, yếm luôn được che phủ kín đáo bởi áo tứ thân, ngũ thân hoặc giao lĩnh.',
      citation: 'Việt Nam Phong Tục (Phan Kế Bính)',
      garmentIds: equipped.filter(g => g.category === 'undergarment').map(g => g.id),
      suggestedFix: 'Mặc thêm Áo Ngũ Thân hoặc Áo Giao Lĩnh phủ ngoài Áo Yếm.',
    });
  }

  // --- RULE 2: CULTURAL CONTEXT & EVENT SACREDNESS VIOLATIONS (RED ERROR) ---
  const hasMiniSkirt = equipped.some(g => g.id === 'chan_vay_ngan_genz');
  const isSacredPlace =
    sceneId === 'chua_mot_cot' ||
    sceneId === 'van_mieu' ||
    eventType === 'le_chua';

  if (hasMiniSkirt && isSacredPlace) {
    const skirtItem = equipped.find(g => g.id === 'chan_vay_ngan_genz');
    issues.push({
      id: 'sacred_context_short_skirt',
      ruleCode: 'RULE_SACRED_CONTEXT_SHORT_BOTTOM',
      type: 'cultural_context_violation',
      severity: 'error',
      title: 'Phạm quy cách tôn nghiêm: Mặc chân váy ngắn nơi Chùa / Di tích lịch sử',
      message:
        eventType === 'le_chua'
          ? 'Sự kiện "Đi Lễ Chùa / Di Tích" yêu cầu trang phục kín đáo qua đầu gối, không được mặc chân váy ngắn Y2K.'
          : `Bối cảnh không gian linh thiêng (${sceneId === 'chua_mot_cot' ? 'Chùa Một Cột' : 'Văn Miếu'}) tuyệt đối cấm mặc váy ngắn trên gối.`,
      historicalExplanation:
        'Văn hóa Đại Việt từ xưa đến nay coi chốn Phật đài và Miếu mạo Nho gia là không gian tôn nghiêm thanh tịnh bậc nhất. Người xưa đi lễ luôn mặc áo ngũ thân, áo dài che kín đầu gối và bước đi tề chỉnh. Việc diện chân váy ngắn hoặc quần short vào di tích tôn giáo bị coi là bất kính, vi phạm thuần phong mỹ tục và nội quy di tích.',
      citation: 'Nội quy bảo tồn Di tích Lịch sử Quốc gia & Sổ tay Văn hóa Đi Lễ Chùa',
      garmentIds: skirtItem ? [skirtItem.id] : [],
      suggestedFix: 'Thay thế bằng Quần Bạch Quy lụa trắng hoặc Quần Jeans ống suông Y2K dài phủ gót.',
    });
  }

  // --- RULE 3: WEATHER & STRUCTURAL WARNINGS (YELLOW WARNING) ---
  // 3.1 Extreme hot weather (35°C) with excessive heavy layers
  if (weatherType === 'nang_35' && hasOuterwear && hasRobe) {
    const heavyLayers = equipped.filter(g => g.category === 'outerwear' || g.category === 'robe');
    issues.push({
      id: 'weather_heat_overlayering',
      ruleCode: 'RULE_WEATHER_HEAT_HEAVY_LAYERS',
      type: 'weather_clash',
      severity: 'warning',
      title: 'Trang phục quá nhiều tầng lớp dày dưới thời tiết Nắng gắt 35°C',
      message: 'Khoác cả Áo Nhật Bình / Đối Khâm bên ngoài Áo Tấc trong tiết trời 35°C sẽ rất nóng, ngột ngạt và dễ đổ mồ hôi làm ố vải gấm lụa quý.',
      historicalExplanation:
        'Vào mùa hè nóng bức xứ nhiệt đới, tiền nhân thường chuộng lối mặc "Sa kép" - tức áo ngũ thân bằng chất liệu sa, the hoặc đũi tơ tằm thông thoáng, và chỉ khoác thêm áo lễ dày khi tế lễ triều đình vào sáng sớm mát mẻ.',
      citation: 'Khâm Định Đại Nam Hội Điển Sự Lệ - Quy định y phục theo mùa',
      garmentIds: heavyLayers.map(g => g.id),
      suggestedFix: 'Cởi bớt áo khoác ngoài (Nhật Bình / Đối Khâm), chỉ giữ lại Áo Ngũ Thân hoặc Áo Dài Tân Thời mỏng nhẹ.',
    });
  }

  // 3.2 Metal brooch pin potentially damaging traditional silk fabric
  const hasBroochPin = equipped.some(g => g.id === 'ghim_cai_vat_ao');
  if (hasBroochPin && hasRobe) {
    const delicateRobes = equipped.filter(
      g => g.category === 'robe' && g.dynasty !== 'modern'
    );
    if (delicateRobes.length > 0) {
      issues.push({
        id: 'structural_pin_fabric_risk',
        ruleCode: 'RULE_FABRIC_BROOCH_PIN_STRAIN',
        type: 'structural_flaw',
        severity: 'warning',
        title: 'Lưu ý bảo quản: Ghim cài kim loại có thể làm xệ nếp lụa truyền thống',
        message: 'Ghim cài kim loại hiện đại đính trực tiếp trên vạt áo tơ tằm có thể gây kéo giãn nếp vạt và để lại lỗ châm kim trên vải cổ.',
        historicalExplanation:
          'Vạt áo ngũ thân thời Nguyễn dùng 5 khuy cài tượng trưng cho Ngũ Thường (Nhân, Lễ, Nghĩa, Trí, Tín) đính nẹp chắc chắn. Vải sa, lụa truyền thống rất nhạy cảm với vật kim loại sắc nhọn.',
        citation: 'Sổ tay bảo quản cổ phục tơ lụa & di sản dệt may',
        garmentIds: ['ghim_cai_vat_ao', ...delicateRobes.map(r => r.id)],
        suggestedFix: 'Đính ghim vào vị trí nẹp cổ may kép hoặc chỉ cài lên áo vải dày hiện đại.',
      });
    }
  }

  // --- RULE 4: DYNASTY & HISTORICAL CHRONOLOGY COHESION ---
  const historicalGarments = equipped.filter(g => g.dynasty !== 'modern');
  const distinctDynasties = Array.from(new Set(historicalGarments.map(g => g.dynasty)));

  if (mode === 'strict_historical') {
    // In strict mode, modern items are flagged as non-historical
    if (modernGarments.length > 0) {
      issues.push({
        id: 'strict_modern_item_in_historical',
        ruleCode: 'RULE_STRICT_MODERN_INCLUDED',
        type: 'dynasty_mismatch',
        severity: 'error',
        title: 'Chế độ Điển chế nghiêm ngặt: Phát hiện y phục Tân Thời / Gen Z',
        message: `Đang có ${modernGarments.length} món đồ hiện đại (Sneaker, Jeans, Kính Y2K...) trong chế độ Khảo cứu Lịch sử Thuần Khiết.`,
        historicalExplanation:
          'Chế độ Điển Chế Nghiêm Ngặt yêu cầu 100% y phục phải thuộc đúng niên đại khảo cứu (thời Lý-Trần, Hậu Lê hoặc Nguyễn), không kết hợp với phục trang thế kỷ 21.',
        citation: 'Quy chuẩn Khảo cứu Cổ phục Đại Việt',
        garmentIds: modernGarments.map(g => g.id),
        suggestedFix: 'Chuyển sang chế độ "Gen Z Remix" để thỏa sức sáng tạo hoặc thay bằng phụ kiện chuẩn sử (Hài thêu, Guốc mộc, Khăn đóng).',
      });
    }

    if (distinctDynasties.length > 1) {
      const nguyenItems = historicalGarments.filter(g => g.dynasty === 'nguyen');
      const ancientItems = historicalGarments.filter(g => g.dynasty === 'hau_le' || g.dynasty === 'ly_tran');
      issues.push({
        id: 'dynasty_clash_nguyen_le_strict',
        ruleCode: 'RULE_DYNASTY_ANACHRONISM',
        type: 'dynasty_mismatch',
        severity: 'error',
        title: 'Bất đồng niên đại lịch sử (Thời Nguyễn & Thời Hậu Lê/Lý Trần)',
        message: `Bộ trang phục đang kết hợp ${nguyenItems.length} món thời Nguyễn với ${ancientItems.length} món thời Hậu Lê/Lý Trần.`,
        historicalExplanation:
          'Văn hóa trang phục Đại Việt thời Hậu Lê (thế kỷ 15-18) chuộng áo Giao Lĩnh cổ chéo, mũ Đinh Tự; thời Nguyễn (thế kỷ 19-20) đã chuyển hóa sang cổ đứng cài khuy và khăn vấn.',
        citation: 'Ngàn Năm Áo Mũ (Trần Quang Đức)',
        garmentIds: [...nguyenItems, ...ancientItems].map(g => g.id),
        suggestedFix: 'Hãy đồng bộ trang phục về cùng một triều đại để đạt điểm tối đa.',
      });
    }
  } else {
    // IN GEN Z REMIX MODE:
    // We DO NOT penalize mixing traditional robes with modern accessories (Sneakers, Jeans, Boots, Sunglasses, Tote, Headphones)!
    // Only flag extreme court regalia clashes if user is mixing Imperial Yellow or Court Robes with peasant wear
    const hasTrieuPhuc = equipped.some(g => g.formality === 'trieu_phuc');
    const hasGuocMoc = equipped.some(g => g.id === 'guoc_moc_hoa_le');
    if (hasTrieuPhuc && hasGuocMoc) {
      issues.push({
        id: 'formality_court_with_peasant_item',
        ruleCode: 'RULE_FORMALITY_COURT_PEASANT_CLASH',
        type: 'formality_clash',
        severity: 'error',
        title: 'Xung đột phẩm trật: Triều phục cung đình đi cùng guốc mộc dân gian',
        message: 'Áo Nhật Bình hoặc Triều phục hoàng tộc không được phối cùng guốc mộc thô mộc dân dã.',
        historicalExplanation:
          'Nghi thức hoàng cung thời Nguyễn quy định rất nghiêm ngặt: Khi bước lên thềm điện Thái Hòa, mệnh phụ bắt buộc phải mang "Hài thêu phượng hoàng", không mang guốc mộc thôn quê.',
        citation: 'Khâm Định Đại Nam Hội Điển Sự Lệ',
        garmentIds: equipped.filter(g => g.id === 'guoc_moc_hoa_le' || g.formality === 'trieu_phuc').map(g => g.id),
        suggestedFix: 'Thay thế bằng Hài Thêu Phượng Hoàng hoặc Sneaker Trắng hiện đại phong cách Streetwear.',
      });
    }
  }

  // --- RULE 5: RECOMMENDATIONS ---
  const recommendations: string[] = [];
  if (!hasHeadwear) {
    recommendations.push('Có thể bổ sung khăn vấn, kính râm Y2K hoặc tai nghe chụp tai để hoàn thiện thần thái tổng thể.');
  }
  if (!hasFootwear) {
    recommendations.push('Đừng quên trang bị giày sneaker chunky, boots da đen hoặc hài thêu để hoàn thiện outfit.');
  }
  if (hasRobe && !hasUndergarment && mode === 'strict_historical') {
    recommendations.push('Nên lót thêm một chiếc Áo Yếm bên trong để giữ nếp áo phẳng phiu theo cổ lễ.');
  }

  // --- METRICS COMPUTATION ---
  let dynastyPurity = 100;
  if (mode === 'strict_historical') {
    if (distinctDynasties.length > 1 || modernGarments.length > 0) {
      const dominantCount = Math.max(
        ...Object.values(
          equipped.reduce((acc, g) => {
            acc[g.dynasty] = (acc[g.dynasty] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        )
      );
      dynastyPurity = Math.round((dominantCount / garmentCount) * 100);
    }
  } else {
    // In Gen Z Remix mode: Having a good balance of traditional + modern earns high remix score
    dynastyPurity = Math.min(100, Math.round(70 + (colorHarmonyScore * 0.3)));
  }

  let layerIntegrity = 100;
  if (!hasBottom && (hasRobe || hasOuterwear)) layerIntegrity -= 40;
  if (hasOuterwear && !hasRobe) layerIntegrity -= 35;
  if (garmentCount < 2) layerIntegrity -= 20;
  layerIntegrity = Math.max(0, layerIntegrity);

  let formalityHarmony = 100;
  if (issues.some(i => i.type === 'formality_clash')) formalityHarmony -= 40;
  if (issues.some(i => i.type === 'cultural_context_violation')) formalityHarmony -= 50;
  formalityHarmony = Math.max(0, formalityHarmony);

  // Context Fit Score
  let contextFitScore = 95;
  if (hasMiniSkirt && isSacredPlace) contextFitScore -= 60;
  if (weatherType === 'nang_35' && hasOuterwear && hasRobe) contextFitScore -= 25;
  if (eventType === 'concert' && (equipped.some(g => g.id.includes('jeans')) || equipped.some(g => g.id.includes('sneaker')) || equipped.some(g => g.id.includes('tai_nghe')))) {
    contextFitScore = Math.min(100, contextFitScore + 10); // Bonus for fitting concert vibe
  }
  if (eventType === 'cafe' && equipped.some(g => g.id.includes('tote') || g.id.includes('kinh_ram'))) {
    contextFitScore = Math.min(100, contextFitScore + 10); // Bonus for fitting cafe vibe
  }
  contextFitScore = Math.max(0, Math.min(100, contextFitScore));

  // Overall Score
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  let overallScore = 0;
  if (mode === 'strict_historical') {
    overallScore = Math.round(
      dynastyPurity * 0.35 + layerIntegrity * 0.4 + formalityHarmony * 0.25
    );
  } else {
    // Gen Z Remix balances historical integrity, aesthetic color harmony, and context appropriateness
    overallScore = Math.round(
      layerIntegrity * 0.35 +
      colorHarmonyScore * 0.35 +
      contextFitScore * 0.30
    );
  }

  overallScore -= errorCount * 25;
  overallScore -= warningCount * 8;
  overallScore = Math.max(0, Math.min(100, overallScore));

  let status: 'authentic' | 'advisory' | 'historically_invalid' = 'authentic';
  if (errorCount > 0 || overallScore < 60) {
    status = 'historically_invalid';
  } else if (warningCount > 0 || overallScore < 88) {
    status = 'advisory';
  }

  // Summary
  let eraSummary = '';
  if (mode === 'genz_remix' && modernGarments.length > 0) {
    eraSummary = `Gen Z Remix (${traditionalPercent}% Cổ truyền • ${modernPercent}% Tân thời)`;
  } else if (distinctDynasties.length === 1) {
    const d = distinctDynasties[0];
    if (d === 'nguyen') eraSummary = 'Thuần khiết Thời Nguyễn (1802 - 1945)';
    else if (d === 'hau_le') eraSummary = 'Đặc trưng Thời Hậu Lê (1428 - 1789)';
    else if (d === 'ly_tran') eraSummary = 'Cổ kính Thời Lý - Trần (1009 - 1400)';
    else eraSummary = 'Tân Thời & Hiện Đại';
  } else {
    eraSummary = `Giao thoa đa phong cách (${garmentCount} món phối)`;
  }

  const isValid = errorCount === 0;

  return {
    isValid,
    validationMode: mode,
    metrics: {
      overallScore,
      dynastyPurity,
      layerIntegrity,
      formalityHarmony,
      status,
    },
    remixBalance,
    colorHarmonyScore,
    contextFitScore,
    issues,
    eraSummary,
    garmentCount,
    recommendations,
  };
}
