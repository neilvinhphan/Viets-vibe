# AI MERGE SPEC: AI Reference Image Picker (Moderate VTON)

> **Hướng dẫn cho AI Assistant**: 
> File này chứa toàn bộ đặc tả kỹ thuật, danh sách file thay đổi và mã nguồn chi tiết của tính năng **"Chọn ảnh thực tế trong Lookbook (AI Reference Image Picker)"** từ branch `feat/ai-reference-image-picker`.
> Hãy đọc tài liệu này để thực hiện merge hoặc re-apply các thay đổi vào nhánh mới/codebase mới một cách chính xác mà không làm mất các tính năng hiện có.

---

## 1. Metadata

- **Branch nguồn**: `feat/ai-reference-image-picker`
- **Commit hash tham chiếu**: `b9e0d9c`
- **Trạng thái**: Đã test, build thành công (`npm run lint`, `npm run test`, `npm run build`)
- **Dependencies chính**: `@google/genai` (đã có trong `package.json`), Node.js `crypto`, `dns`, `http`, `https`, `net`.

---

## 2. File Manifest (Danh sách file)

### A. File tạo mới hoàn toàn (22 files - Có thể copy nguyên trạng)
| Đường dẫn | Vai trò |
|---|---|
| `src/components/ReferenceImagePicker.tsx` | Component UI chọn ảnh mẫu, chỉnh query, upload ảnh, chọn ảnh |
| `src/data/referenceOutfits.ts` | Type interfaces (`ReferenceOutfitImage`, `SimilarImagesResult`) & static catalog |
| `src/services/referenceImageMatching.ts` | Xử lý họ áo, tạo 3 query tìm kiếm chuẩn, thuật toán matching offline |
| `src/services/webImageSearch.server.ts` | Scraper tìm ảnh Bing không cần key, parse HTML json metadata |
| `src/services/imageProxy.server.ts` | Proxy stream ảnh an toàn (phòng thủ SSRF, chặn IP private, DNS Pinning) |
| `src/services/findSimilarImages.server.ts` | Điều phối tìm kiếm, tải ảnh candidate, gọi Gemini 2.5 Flash chấm điểm VTON |
| `src/services/referenceImages.test.ts` | Unit test cho matching, fallback catalog, ngưỡng 65đ |
| `src/services/webImages.test.ts` | Unit test cho Bing parser và kiểm tra SSRF |
| `docs/reference-image-picker.md` | Tài liệu kỹ thuật chi tiết của tính năng |
| `public/reference-outfits/credits.json` | Metadata credit bản quyền ảnh mẫu tĩnh |
| `public/reference-outfits/*.jpg, *.webp` (11 file ảnh) | Ảnh tĩnh mẫu cho catalog fallback (`traditional-*.jpg`, `remix-*.jpg/webp`) |

### B. File đã chỉnh sửa (Cần merge cẩn thận theo chỉ dẫn dưới đây)
1. `server.ts`
2. `src/App.tsx`
3. `src/components/LookbookAndCompareModal.tsx`
4. `.env.example`

---

## 3. Chi tiết mã nguồn cần merge vào các file hiện có

### 3.1. Chỉnh sửa `server.ts`

#### Step 1: Thêm imports và export ở đầu file:
```ts
import { findSimilarImages } from './src/services/findSimilarImages.server';
import { fallbackQueries, mainGarment } from './src/services/referenceImageMatching';
import { BROWSER_USER_AGENT, parseBingImageResults, readSearchHtml } from './src/services/webImageSearch.server';
import { fetchPublicImage, validateImageUrl } from './src/services/imageProxy.server';
export { buildHybridSearchQueries } from './src/services/referenceImageMatching';
```

#### Step 2: Hỗ trợ PORT từ env:
```ts
const PORT = Number(process.env.PORT) || 3000;
```

#### Step 3: Thêm helper function & 2 API Endpoints (đặt trước các route khác hoặc trước `app.listen`):
```ts
// Zero-key live Bing Images search; the scorer supplies catalog fallback when no candidates qualify.
export async function searchWebImagesLive(query: string) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&qft=+filterui:aspect-tall&setlang=vi&adlt=strict`;
  const response = await fetch(url, {
    headers: { 'User-Agent': BROWSER_USER_AGENT, Accept: 'text/html', 'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8' },
    signal: AbortSignal.timeout(10000),
  });
  const html = await readSearchHtml(response);
  const images = parseBingImageResults(html);
  if (!images.length && !/no (?:image )?results|couldn.t find any|không (?:có|tìm thấy) kết quả/i.test(html)) {
    throw new Error('Bing returned a challenge or an unsupported search page');
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
  let pending = referenceSearchPending.get(key);
  try {
    if (!pending) {
      if (referenceSearchPending.size >= 8) return res.status(429).json({ error: 'Đang có nhiều lượt tìm ảnh. Vui lòng thử lại sau.' });
      pending = findSimilarImages(garments, { search: searchWebImagesLive }, customQueries);
      referenceSearchPending.set(key, pending);
    }
    const result = await pending;
    return res.json(result);
  } catch {
    return res.status(503).json({ error: 'Chưa tìm được ảnh trên Web. Bing có thể đang giới hạn truy cập hoặc kết nối bị gián đoạn. Hãy thử lại.' });
  } finally {
    if (pending && referenceSearchPending.get(key) === pending) referenceSearchPending.delete(key);
  }
});
```

---

### 3.2. Chỉnh sửa `src/App.tsx`

#### Step 1: Import type:
```ts
import type { ReferenceOutfitImage } from "./data/referenceOutfits";
```

#### Step 2: Quản lý state ảnh mẫu đã chọn (gắn với outfit hiện tại):
Ngay dưới khai báo `const [equippedGarmentIds, setEquippedGarmentIds] = useState<string[]>(...);`, chèn:
```ts
  const referenceOutfitKey = [...equippedGarmentIds].sort().join('|');
  const [referenceSelection, setReferenceSelection] = useState<{ outfitKey: string; image: ReferenceOutfitImage } | null>(null);
  useEffect(() => { setReferenceSelection(null); }, [referenceOutfitKey]);
```

#### Step 3: Truyền props vào `<LookbookAndCompareModal ... />`:
```tsx
  <LookbookAndCompareModal
    // ...các props hiện có...
    selectedReferenceImage={referenceSelection?.outfitKey === referenceOutfitKey ? referenceSelection.image : null}
    onSelectReferenceImage={(image) => setReferenceSelection({ outfitKey: referenceOutfitKey, image })}
  />
```

---

### 3.3. Chỉnh sửa `src/components/LookbookAndCompareModal.tsx`

#### Step 1: Thêm imports:
```ts
import { ReferenceImagePicker } from './ReferenceImagePicker';
import type { ReferenceOutfitImage } from '../data/referenceOutfits';
```

#### Step 2: Cập nhật Props Interface:
```ts
export interface LookbookAndCompareModalProps {
  // ...các props cũ...
  onSelectReferenceImage?: (image: ReferenceOutfitImage) => void;
  selectedReferenceImage?: ReferenceOutfitImage | null;
}
```

#### Step 3: Thêm tab state và dialog trap:
```ts
  const [activeTab, setActiveTab] = useState<'lookbook' | 'compare' | 'reference'>('lookbook');
  const [referenceOpened, setReferenceOpened] = useState(false);
  const openReference = () => { setReferenceOpened(true); setActiveTab('reference'); };
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previous?.focus();
  }, [isOpen]);
```

#### Step 4: Thêm nút Tab "Ảnh Mẫu AI (Beta)" trong Header Modal:
```tsx
  <button 
    onClick={openReference} 
    aria-pressed={activeTab === 'reference'} 
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${activeTab === 'reference' ? 'bg-stone-900 text-white shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'}`}
  >
    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
    <span>Ảnh Mẫu AI (Beta)</span>
  </button>
```

#### Step 5: Thêm Banner CTA trong Tab Lookbook (ở phần Action Buttons):
```tsx
  <button onClick={openReference} className="w-full rounded-xl border border-amber-300 bg-gradient-to-r from-amber-200 to-amber-50 px-4 py-3 text-left shadow-xs transition-colors hover:from-amber-300">
    <span className="block text-xs font-bold text-amber-950">✨ Tìm Ảnh Thực Tế Tương Đồng (Beta)</span>
    <span className="mt-1 block text-[11px] leading-relaxed text-amber-900">AI lọc ảnh trang phục thật giống bản phối nhất để chuẩn bị thử đồ</span>
  </button>
```

#### Step 6: Render `ReferenceImagePicker` (Lazy loaded khi đã mở tab ít nhất 1 lần):
Bên dưới thẻ đóng của `/* Modal Content */`:
```tsx
  {referenceOpened && (
    <div className={activeTab === 'reference' ? 'min-h-0 flex flex-1 flex-col' : 'hidden'}>
      <ReferenceImagePicker 
        key={equippedGarments.map(g => g.id).sort().join('|')} 
        garments={equippedGarments} 
        onSelectReferenceImage={onSelectReferenceImage} 
        initialSelection={selectedReferenceImage} 
      />
    </div>
  )}
```

---

### 3.4. Chỉnh sửa `.env.example` & `.env`
Thêm cấu hình model Gemini cho Lookbook:
```env
LOOKBOOK_GEMINI_MODEL="gemini-2.5-flash"
```

---

## 4. Các điểm cần chú ý khi resolve conflict

1. **Giữ nguyên các export của `server.ts`**:
   `server.ts` export `searchWebImagesLive` và `buildHybridSearchQueries` để phục vụ `findSimilarImages.server.ts` và unit tests. Đừng xóa bỏ các export này.
2. **Keying của `ReferenceImagePicker`**:
   Prop `key={equippedGarments.map(g => g.id).sort().join('|')}` là bắt buộc để React reset hoàn toàn state tìm kiếm khi người dùng đổi trang phục, tránh việc ảnh của bản phối trước rò rỉ sang bản phối sau.
3. **Phòng chống SSRF trong `imageProxy.server.ts`**:
   File này đã cấu hình chặn nghiêm ngặt các dải IP private/localhost và DNS rebinding. Đừng thay thế bằng `fetch` đơn giản không có kiểm tra IP.

---

## 5. Kiểm tra và xác nhận sau Merge

Chạy chuỗi lệnh sau trong terminal để đảm bảo merge thành công 100%:
```sh
npm run lint
node --import tsx --test src/services/referenceImages.test.ts src/services/webImages.test.ts
npm run build
```
Nếu 3 lệnh trên đều exit code 0 thì việc merge hoàn tất.

