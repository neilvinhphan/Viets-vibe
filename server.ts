import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { GARMENTS, OUTFIT_PRESETS } from './src/data/garments';
import { validateOutfit } from './src/services/culturalValidationEngine';
import { POSTGRESQL_SCHEMA_SQL, SCHEMA_TABLES } from './src/data/postgresSchema';
import { findSimilarImages } from './src/services/findSimilarImages.server';
import { fallbackQueries, mainGarment, rankReferences } from './src/services/referenceImageMatching';
import { REFERENCE_OUTFITS_CATALOG } from './src/data/referenceOutfits';
import { BROWSER_USER_AGENT, parseBingImageResults, readSearchHtml } from './src/services/webImageSearch.server';
import { fetchPublicImage, validateImageUrl } from './src/services/imageProxy.server';
export { buildHybridSearchQueries } from './src/services/referenceImageMatching';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

// Lazy initialize Google GenAI
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. AI image analysis will require an API key.');
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// ---------------------------------------------------------
// API ROUTES
// ---------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'Viet Phuc Mix & Match',
    timestamp: new Date().toISOString(),
  });
});

// Garments & Presets catalog
app.get('/api/garments', (req, res) => {
  res.json({
    garments: GARMENTS,
    presets: OUTFIT_PRESETS,
  });
});

// Zero-key live Bing Images search; the scorer supplies catalog fallback when no candidates qualify.
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const webSearchCache = new Map<string, CacheEntry<Awaited<ReturnType<typeof parseBingImageResults>>>>();
const lookbookResultCache = new Map<string, CacheEntry<Awaited<ReturnType<typeof findSimilarImages>>>>();

// Zero-key live Bing Images search with Vietnam region parameters and proxy relays for Vercel datacenter IPs
export async function searchWebImagesLive(query: string) {
  const cleanQuery = query.replace(/chụp toàn thân rõ trang phục/gi, '').replace(/\s+/g, ' ').trim() || query;
  const cached = webSearchCache.get(cleanQuery);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const bingSearchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(cleanQuery)}&qft=+filterui:aspect-tall&cc=VN&mkt=vi-VN&setlang=vi&adlt=strict`;
  const bingAsyncUrl = `https://www.bing.com/images/async?q=${encodeURIComponent(cleanQuery)}&first=1&count=35&qft=+filterui:aspect-tall&cc=VN&mkt=vi-VN&setlang=vi&adlt=strict&mmasync=1`;

  const headers = {
    'User-Agent': BROWSER_USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cookie': '_EDGE_S=mkt=vi-VN&F=1; SRCHHPGUSR=SRCHLANG=vi&ADLT=STRICT',
    'Referer': 'https://www.bing.com/',
  };

  let images: ReturnType<typeof parseBingImageResults> = [];

  // Bước 1: Thử gọi trực tiếp bingAsyncUrl (và nếu rỗng thì gọi bingSearchUrl)
  try {
    const res = await fetch(bingAsyncUrl, { headers, signal: AbortSignal.timeout(4500) });
    if (res.ok) {
      const html = await res.text();
      images = parseBingImageResults(html);
    }
  } catch (err) {
    console.warn(`Direct bingAsyncUrl failed for query "${cleanQuery}":`, err);
  }

  if (images.length === 0) {
    try {
      const res = await fetch(bingSearchUrl, { headers, signal: AbortSignal.timeout(4500) });
      if (res.ok) {
        const html = await res.text();
        images = parseBingImageResults(html);
      }
    } catch (err) {
      console.warn(`Direct bingSearchUrl failed for query "${cleanQuery}":`, err);
    }
  }

  // Bước 2: Vượt tường lửa IP Datacenter trên Vercel qua các cổng relay công khai (timeout 5000ms mỗi cổng)
  if (images.length === 0) {
    const relayUrls = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(bingAsyncUrl)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(bingAsyncUrl)}`,
    ];
    for (const relayUrl of relayUrls) {
      try {
        const res = await fetch(relayUrl, {
          headers: { 'User-Agent': BROWSER_USER_AGENT },
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const html = await res.text();
          const parsed = parseBingImageResults(html);
          if (parsed.length > 0) {
            images = parsed;
            break;
          }
        }
      } catch (relayErr) {
        console.warn(`Relay ${relayUrl.split('?')[0]} failed for query "${cleanQuery}":`, relayErr);
      }
    }
  }

  if (images.length > 0) {
    if (webSearchCache.size >= 100) {
      const oldestKey = webSearchCache.keys().next().value;
      if (oldestKey) webSearchCache.delete(oldestKey);
    }
    webSearchCache.set(cleanQuery, { data: images, expiresAt: Date.now() + 10 * 60 * 1000 });
  }

  return images;
}

let activeImageDownloads = 0;
app.get('/api/image-proxy', async (req, res) => {
  const url = req.query.url;
  if (typeof url !== 'string') return res.status(400).json({ error: 'Cần URL ảnh hợp lệ.' });
  try { validateImageUrl(url); } catch { return res.status(400).json({ error: 'URL ảnh không được hỗ trợ.' }); }
  if (activeImageDownloads >= 16) return res.status(429).json({ error: 'Đang tải nhiều ảnh. Vui lòng thử lại.' });
  activeImageDownloads++;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  const onClose = () => controller.abort();
  res.on('close', onClose);
  try {
    const image = await fetchPublicImage(url, controller.signal);
    res.set({ 'Content-Type': image.mime, 'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=3600', 'Content-Security-Policy': "default-src 'none'; sandbox" });
    return res.send(image.bytes);
  } catch {
    if (!res.destroyed) return res.status(502).json({ error: 'Nguồn ảnh không cho tải hoặc ảnh không hợp lệ.' });
  } finally {
    activeImageDownloads--; clearTimeout(timer); res.off('close', onClose);
  }
});

const referenceSearchPending = new Map<string, Promise<Awaited<ReturnType<typeof findSimilarImages>>>>();
app.post('/api/lookbook/find-similar-images', async (req, res) => {
  const ids = req.body?.garmentIds;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 24 || ids.some(id => typeof id !== 'string' || !GARMENTS.some(g => g.id === id))) {
    return res.status(400).json({ error: 'Hãy gửi garmentIds hợp lệ của bản phối (1–24 món).' });
  }
  // Resolve all colors, layers, footwear and accessories from the canonical wardrobe.
  const garments = GARMENTS.filter(g => ids.includes(g.id));
  if (!mainGarment(garments)) return res.status(400).json({ error: 'Hãy chọn áo chính trước khi tìm ảnh mẫu.' });
  const query = req.body.query;
  const provided = req.body.queries;
  const validQuery = (value: unknown): value is string => typeof value === 'string' && value.trim().length >= 3 && value.length <= 220;
  const queryKeys = ['remixSearchQuery', 'styleSearchQuery', 'traditionalSearchQuery'] as const;
  if ((query !== undefined && !validQuery(query)) || (provided !== undefined && (!provided || typeof provided !== 'object' || Array.isArray(provided) || !queryKeys.every(k => validQuery(provided[k])))) || (query !== undefined && provided !== undefined)) {
    return res.status(400).json({ error: 'Từ khóa cần từ 3–220 ký tự; gửi query hoặc đủ ba queries.' });
  }
  const customQueries = provided ? Object.fromEntries(queryKeys.map(k => [k, provided[k].trim()])) as ReturnType<typeof fallbackQueries>
    : query ? { remixSearchQuery: query.trim(), styleSearchQuery: query.trim(), traditionalSearchQuery: query.trim() } : undefined;
  const key = JSON.stringify([garments.map(g => g.id).sort(), customQueries]);
  res.setHeader('Cache-Control', 'no-store');

  const cached = lookbookResultCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.data);
  }

  let pending = referenceSearchPending.get(key);
  try {
    if (!pending) {
      if (referenceSearchPending.size >= 8) return res.status(429).json({ error: 'Đang có nhiều lượt tìm ảnh. Vui lòng thử lại sau.' });
      pending = findSimilarImages(garments, { search: searchWebImagesLive }, customQueries);
      referenceSearchPending.set(key, pending);
    }
    const result = await pending;
    // BẮT BUỘC: Nếu nguồn tìm kiếm web trả về rỗng, endpoint BẮT BUỘC trả về danh sách ảnh phù hợp nhất từ kho referenceOutfits.ts (HTTP 200)
    if (!result.images || result.images.length === 0) {
      const fallbackImages = rankReferences(garments, REFERENCE_OUTFITS_CATALOG).slice(0, 6);
      return res.json({
        ...result,
        images: fallbackImages,
        candidates: fallbackImages.map(({ imageUrl, matchScore, matchReason }) => ({ imageUrl, matchScore, matchReason })),
        searchMode: 'catalog',
        rankingMode: 'fallback',
        warning: 'Gợi ý ảnh trang phục thực tế có phom dáng và sắc độ gần nhất với bản phối của bạn.',
      });
    }
    if (result.searchMode === 'web') {
      if (lookbookResultCache.size >= 100) {
        const oldestKey = lookbookResultCache.keys().next().value;
        if (oldestKey) lookbookResultCache.delete(oldestKey);
      }
      lookbookResultCache.set(key, { data: result, expiresAt: Date.now() + 5 * 60 * 1000 });
    }
    return res.json(result);
  } catch (error) {
    console.warn('findSimilarImages failed or blocked, returning top referenceOutfits catalog (HTTP 200):', error);
    const queries = customQueries || fallbackQueries(garments);
    const fallbackImages = rankReferences(garments, REFERENCE_OUTFITS_CATALOG).slice(0, 6);
    return res.json({
      ...queries,
      images: fallbackImages,
      candidates: fallbackImages.map(({ imageUrl, matchScore, matchReason }) => ({ imageUrl, matchScore, matchReason })),
      queryMode: customQueries ? 'custom' : 'fallback',
      rankingMode: 'fallback',
      searchMode: 'catalog',
      fetchedAt: new Date().toISOString(),
      warning: 'Gợi ý ảnh trang phục thực tế có phom dáng và sắc độ gần nhất với bản phối của bạn.',
    });
  } finally {
    if (pending && referenceSearchPending.get(key) === pending) referenceSearchPending.delete(key);
  }
});

app.post('/api/validate-outfit', (req, res) => {
  try {
    const { garmentIds, validationMode, sceneId, eventType, weatherType } = req.body;
    if (!Array.isArray(garmentIds)) {
      return res.status(400).json({ error: 'garmentIds must be an array of strings' });
    }
    const result = validateOutfit(garmentIds, {
      validationMode,
      sceneId,
      eventType,
      weatherType,
    });
    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Validation error:', error);
    res.status(500).json({ error: error.message || 'Validation failed' });
  }
});

// AI Vibe-to-Outfit Endpoint (Gen Z Studio Assistant)
app.post('/api/vibe-to-outfit', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const lower = prompt.toLowerCase();
    
    // Default fallback styling result based on heuristics
    let sceneId = 'hue_citadel';
    let eventType: 'le_chua' | 'concert' | 'ky_yeu' | 'cafe' = 'cafe';
    let weatherType: 'nang_35' | 'mat_24' | 'lanh_16' = 'mat_24';
    let garmentIds: string[] = ['quan_bach_quy', 'ao_ngu_than_tay_chen_nam', 'giay_sneaker_trang'];
    let stylingAdvice = 'Phối Áo Ngũ Thân cùng sneaker trắng năng động, vừa giữ trọn nét cổ kính vừa thoải mái di chuyển.';

    if (lower.includes('concert') || lower.includes('âm nhạc') || lower.includes('quẩy') || lower.includes('cháy')) {
      sceneId = 'thang_long';
      eventType = 'concert';
      weatherType = 'mat_24';
      garmentIds = ['quan_jeans_y2k', 'ao_ngu_than_tay_chen_nam', 'tai_nghe_genz', 'giay_sneaker_trang', 'tui_tote_genz'];
      stylingAdvice = 'Ngũ Thân Streetwear: Kết hợp Áo Ngũ Thân tay chẽn, Quần Jeans baggy Y2K và Tai nghe chụp tai để bùng nổ năng lượng tại concert.';
    } else if (lower.includes('chùa') || lower.includes('lễ') || lower.includes('tâm linh') || lower.includes('thanh tịnh')) {
      sceneId = 'chua_mot_cot';
      eventType = 'le_chua';
      weatherType = 'mat_24';
      garmentIds = ['quan_bach_quy', 'ao_tac_le_phuc_ngoc', 'khan_dong_chu_nhan', 'hai_theu_phuong_hoang'];
      stylingAdvice = 'Trang trọng & Kín đáo: Áo Tấc tay thụng ngọc bích phối Quần lụa trắng và Hài thêu, tuyệt đối đoan trang nơi cửa Phật.';
    } else if (lower.includes('kỷ yếu') || lower.includes('tốt nghiệp') || lower.includes('trường') || lower.includes('nắng')) {
      sceneId = 'van_mieu';
      eventType = 'ky_yeu';
      weatherType = lower.includes('nắng') ? 'nang_35' : 'mat_24';
      garmentIds = ['quan_bach_quy', 'ao_dai_tan_thoi', 'giay_sneaker_trang', 'ghim_cai_vat_ao'];
      stylingAdvice = 'Thanh xuân rạng rỡ: Áo Dài Tân Thời cách tân màu xanh mint pastel cùng Sneaker trắng cho bộ ảnh kỷ yếu lưu niệm đáng nhớ.';
    } else if (lower.includes('cafe') || lower.includes('cà phê') || lower.includes('dạo phố') || lower.includes('thơ')) {
      sceneId = 'hoa_lu';
      eventType = 'cafe';
      weatherType = 'mat_24';
      garmentIds = ['thuong_xep_li_hau_le', 'ao_giao_linh_hau_le', 'kinh_ram_y2k', 'boots_da_den', 'tui_tote_genz'];
      stylingAdvice = 'Neo-Traditional Cafe: Áo Giao Lĩnh Hậu Lê kết hợp Boots da đen và Kính mắt mèo Y2K cho buổi dạo phố cà phê nghệ thuật.';
    } else if (lower.includes('lạnh') || lower.includes('đông') || lower.includes('gió')) {
      weatherType = 'lanh_16';
      garmentIds = ['quan_bach_quy', 'ao_tac_le_phuc_ngoc', 'ao_nhat_binh_cong_chua', 'boots_da_den'];
      stylingAdvice = 'Layering mùa đông: Khoác Áo Nhật Bình quyền quý bên ngoài Áo Tấc, kết hợp Boots da đen giữ ấm thời thượng.';
    }

    // Attempt Gemini AI if key exists
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = getGenAI();
        const availableGarmentsSummary = GARMENTS.map(g => `${g.id} (${g.name}, ${g.category}, ${g.dynasty})`).join('; ');
        const promptInstruction = `Bạn là stylist chuyên gia Việt Phục Gen Z Remix ("Việt Phục Remix — Gen Z Studio").
Dựa trên mong muốn/vibe của người dùng: "${prompt}", hãy gợi ý tổ hợp trang phục tốt nhất.
Danh sách ID đồ có sẵn: ${availableGarmentsSummary}.
Bối cảnh hợp lệ: hue_citadel, thang_long, van_mieu, chua_mot_cot, hoa_lu, studio_do.
Sự kiện hợp lệ: le_chua, concert, ky_yeu, cafe.
Thời tiết hợp lệ: nang_35, mat_24, lanh_16.
Quy tắc văn hóa: Nếu sự kiện là le_chua hoặc nơi đến là chùa/văn miếu, KHÔNG CHỌN chan_vay_ngan_genz!
Trả về JSON đúng cấu trúc:
{
  "garmentIds": ["id1", "id2", ...],
  "sceneId": "hue_citadel",
  "eventType": "concert",
  "weatherType": "mat_24",
  "stylingAdvice": "Lời khuyên stylist ngắn gọn, truyền cảm hứng"
}`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptInstruction,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (aiResponse.text) {
          const parsed = JSON.parse(aiResponse.text);
          if (Array.isArray(parsed.garmentIds) && parsed.garmentIds.length > 0) {
            garmentIds = parsed.garmentIds.filter((id: string) => GARMENTS.some(g => g.id === id));
            if (parsed.sceneId) sceneId = parsed.sceneId;
            if (parsed.eventType) eventType = parsed.eventType;
            if (parsed.weatherType) weatherType = parsed.weatherType;
            if (parsed.stylingAdvice) stylingAdvice = parsed.stylingAdvice;
          }
        }
      } catch (aiErr) {
        console.warn('AI Vibe generation fallback to heuristic rule-engine:', aiErr);
      }
    }

    res.json({
      success: true,
      sceneId,
      eventType,
      weatherType,
      garmentIds,
      stylingAdvice,
    });
  } catch (error: any) {
    console.error('Error generating vibe outfit:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi tạo bản phối theo vibe' });
  }
});

// PostgreSQL Schema & Table metadata
app.get('/api/schema', (req, res) => {
  res.json({
    rawSql: POSTGRESQL_SCHEMA_SQL,
    tables: SCHEMA_TABLES,
  });
});

app.get('/api/schema.sql', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="vietphuc_schema.sql"');
  res.send(POSTGRESQL_SCHEMA_SQL);
});

// Gemini Image Understanding for Traditional Vietnamese Attire
app.post('/api/analyze-vietphuc-photo', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 string is required' });
    }

    const ai = getGenAI();

    // Prepare prompt and image part
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: mimeType,
      },
    };

    const systemInstruction = `You are a distinguished historian and expert on Vietnamese traditional attire (Cổ Phục Việt Nam / Việt Phục), specializing in dynasties from Lý, Trần, Hậu Lê (Lê Trung Hưng), and Nguyễn (Áo Ngũ Thân, Áo Dài, Áo Nhật Bình, Áo Tấc, Áo Giao Lĩnh, Áo Đối Khâm, Áo Viên Lĩnh, Áo Yếm, Khăn Vấn, Khăn Đóng).
Analyze the provided image containing traditional Vietnamese dress or clothing.
Evaluate:
1. Identified garments and garment parts (with Vietnamese names).
2. Estimated historical dynasty / era (Thời Nguyễn, Thời Hậu Lê, Thời Lý-Trần, Tân Thời / Hiện Đại).
3. Formality level (Thường Phục / Everyday, Lễ Phục / Ceremonial, Triều Phục / Imperial Court).
4. Historical authenticity evaluation: note whether the combination follows historical rules (e.g. correct layering, no inappropriate mixing of court robes with peasant items, collar types).
5. Cultural observations and suggested matching items from standard Vietnamese wardrobes.

Respond in JSON matching the exact schema requested.`;

    const contents = {
      parts: [
        imagePart,
        {
          text: 'Phân tích bức ảnh trang phục truyền thống Việt Nam này và đánh giá tính chân xác lịch sử theo quy chế cổ phục.',
        },
      ],
    };

    // Try primary requested model gemini-3.1-pro-preview with fallback to gemini-2.5-flash
    let responseText = '';
    const primaryModel = 'gemini-3.1-pro-preview';
    const fallbackModel = 'gemini-2.5-flash';

    try {
      console.log(`Analyzing image with ${primaryModel}...`);
      const response = await ai.models.generateContent({
        model: primaryModel,
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dynastyAssessment: {
                type: Type.STRING,
                description: 'Triều đại ước tính (vd: Thời Nguyễn, Thời Hậu Lê, Hiện đại)',
              },
              formalityAssessment: {
                type: Type.STRING,
                description: 'Phẩm cấp nghi lễ (Thường Phục, Lễ Phục, Triều Phục)',
              },
              authenticityNotes: {
                type: Type.STRING,
                description: 'Nhận xét chuyên sâu về tính chuẩn xác văn hóa và khảo cứu',
              },
              culturalObservations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Các điểm quan sát văn hóa nổi bật (cổ áo, hoa văn, khăn đội đầu)',
              },
              identifiedGarments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    dynastyEstimate: { type: Type.STRING },
                    category: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                  },
                  required: ['name', 'category', 'confidence', 'description'],
                },
              },
              suggestedWardrobeIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Gợi ý các mã ID phù hợp trong tủ đồ (vd: ao_nhat_binh_cong_chua, ao_tac_le_phuc_ngoc, quan_bach_quy)',
              },
            },
            required: [
              'dynastyAssessment',
              'formalityAssessment',
              'authenticityNotes',
              'culturalObservations',
              'identifiedGarments',
              'suggestedWardrobeIds',
            ],
          },
        },
      });
      responseText = response.text || '';
    } catch (primaryErr: any) {
      console.warn(`Primary model ${primaryModel} failed (${primaryErr.message}), trying ${fallbackModel}...`);
      const fallbackResponse = await ai.models.generateContent({
        model: fallbackModel,
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });
      responseText = fallbackResponse.text || '';
    }

    const parsedData = JSON.parse(responseText);
    res.json({
      success: true,
      analysis: parsedData,
    });
  } catch (error: any) {
    console.error('Error analyzing photo:', error);
    res.status(500).json({
      error: error.message || 'Lỗi khi phân tích hình ảnh trang phục',
    });
  }
});

// ---------------------------------------------------------
// GLB MODEL SERVING & UPLOAD (3D VIET PHUC GALLERY)
// ---------------------------------------------------------

// Ensure public/models directory exists on startup
try {
  fs.mkdirSync(path.join(process.cwd(), 'public', 'models'), { recursive: true });
} catch {
  // Read-only filesystem in serverless environments
}

// Serve viet_phuc_gallery.glb safely without falling into Vite HTML catch-all
app.get('/models/viet_phuc_gallery.glb', (req, res) => {
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'models', 'viet_phuc_gallery.glb'),
    path.join(process.cwd(), 'public', 'viet_phuc_gallery.glb'),
    path.join(process.cwd(), 'viet_phuc_gallery.glb'),
    path.join(process.cwd(), 'src', 'viet_phuc_gallery.glb'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.statSync(p).size > 1000) {
      res.setHeader('Content-Type', 'model/gltf-binary');
      return res.sendFile(p);
    }
  }
  res.status(404).json({ status: 'missing_glb', expectedPath: 'public/models/viet_phuc_gallery.glb' });
});

// Upload GLB endpoint allowing client to save model permanently
app.post('/api/upload-glb', (req, res) => {
  try {
    const targetDir = path.join(process.cwd(), 'public/models');
    fs.mkdirSync(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, 'viet_phuc_gallery.glb');

    let buffer: Buffer | null = null;
    if (Buffer.isBuffer(req.body)) {
      buffer = req.body;
    } else if (req.body && req.body.base64) {
      buffer = Buffer.from(req.body.base64, 'base64');
    }

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: 'No binary GLB data provided' });
    }

    fs.writeFileSync(targetPath, buffer);
    console.log(`Saved GLB model to ${targetPath} (${buffer.length} bytes)`);
    return res.json({ success: true, url: '/models/viet_phuc_gallery.glb' });
  } catch (error: any) {
    console.error('Error saving GLB model:', error);
    return res.status(500).json({ error: error.message || 'Failed to save GLB model' });
  }
});

// ---------------------------------------------------------
// VITE MIDDLEWARE / STATIC SERVING
// ---------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Viet Phuc Mix & Match server running at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
