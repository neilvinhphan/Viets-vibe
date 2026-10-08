import React, { useEffect, useRef, useState } from 'react';
import { Check, Download, ImagePlus, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import type { Garment } from '../types';
import { downloadReferenceImage } from '../utils/downloadReferenceImage';
import type { ReferenceOutfitImage, SimilarImagesResult } from '../data/referenceOutfits';
import { fallbackQueries, localReferenceResult, mainGarment } from '../services/referenceImageMatching';

interface Props {
  garments: Garment[];
  onSelectReferenceImage?: (image: ReferenceOutfitImage) => void;
  initialSelection?: ReferenceOutfitImage | null;
}
const filters = [['all', 'Tất cả gợi ý'], ['remix', 'Phối Gen Z / Hiện đại'], ['traditional', 'Chuẩn Cổ phục']] as const;

export function ReferenceImagePicker({ garments, onSelectReferenceImage, initialSelection }: Props) {
  const [result, setResult] = useState<SimilarImagesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [queryDrafts, setQueryDrafts] = useState(() => fallbackQueries(garments));
  const [submittedQueries, setSubmittedQueries] = useState<ReturnType<typeof fallbackQueries>>();
  const [queryMode, setQueryMode] = useState<SimilarImagesResult['queryMode']>('fallback');
  const [filter, setFilter] = useState<'all' | 'remix' | 'traditional'>('all');
  const [uploads, setUploads] = useState<ReferenceOutfitImage[]>(initialSelection?.isUpload ? [initialSelection] : []);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(initialSelection?.id || null);
  const [confirmed, setConfirmed] = useState(Boolean(initialSelection));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState('');
  const [downloadNotice, setDownloadNotice] = useState('');
  const downloadPending = useRef(false);
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const [loadedIds, setLoadedIds] = useState<string[]>([]);
  const [thumbnailIds, setThumbnailIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  // Parent keys this component by the complete outfit, so old requests/selections cannot cross outfits.
  const outfitKey = garments.map(g => g.id).sort().join('|');
  const canSearch = Boolean(mainGarment(garments));

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const refresh = () => setAttempt(n => n + 1);
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    return () => { window.removeEventListener('online', refresh); window.removeEventListener('offline', refresh); };
  }, []);
  useEffect(() => {
    if (!canSearch) return;
    if (navigator.onLine === false) {
      setResult(localReferenceResult(garments)); setLoading(false);
      setMessage('Thiết bị đang ngoại tuyến. Tạm hiển thị kho ảnh dự phòng; khi có mạng, hệ thống sẽ tìm lại trên Web.');
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 55000);
    let active = true;
    setLoading(true);
    setMessage('');
    setResult(null);
    fetch('/api/lookbook/find-similar-images', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ garmentIds: outfitKey.split('|'), queries: submittedQueries }), signal: controller.signal,
    }).then(async response => {
      if (!response.ok) {
        console.warn('Fetch /api/lookbook/find-similar-images non-ok response status:', response.status);
        if (active) {
          const fallback = localReferenceResult(garments);
          setResult({
            ...fallback,
            searchMode: 'catalog',
            warning: 'Gợi ý ảnh trang phục thực tế có phom dáng và sắc độ gần nhất với bản phối của bạn.',
          });
          setQueryMode(fallback.queryMode);
          setMessage('Gợi ý ảnh trang phục thực tế có phom dáng và sắc độ gần nhất với bản phối của bạn.');
          setQueryDrafts({
            remixSearchQuery: fallback.remixSearchQuery,
            styleSearchQuery: fallback.styleSearchQuery,
            traditionalSearchQuery: fallback.traditionalSearchQuery,
          });
        }
        return;
      }
      const data: SimilarImagesResult = await response.json();
      if (!Array.isArray(data.images) || typeof data.remixSearchQuery !== 'string' || typeof data.traditionalSearchQuery !== 'string') {
        throw new Error('Invalid response');
      }
      if (active) {
        if (!data.images.length) {
          const fallback = localReferenceResult(garments);
          setResult({
            ...data,
            images: fallback.images,
            searchMode: 'catalog',
            warning: 'Gợi ý ảnh trang phục thực tế có phom dáng và sắc độ gần nhất với bản phối của bạn.',
          });
        } else {
          setResult(data);
        }
        setQueryMode(data.queryMode);
        setMessage(data.warning || '');
        setQueryDrafts({
          remixSearchQuery: data.remixSearchQuery,
          styleSearchQuery: data.styleSearchQuery,
          traditionalSearchQuery: data.traditionalSearchQuery,
        });
      }
    }).catch(error => {
      if (active) {
        console.warn('Error fetching /api/lookbook/find-similar-images, falling back to local catalog:', error);
        const fallback = localReferenceResult(garments);
        setResult({
          ...fallback,
          searchMode: 'catalog',
          warning: 'Gợi ý ảnh trang phục thực tế có phom dáng và sắc độ gần nhất với bản phối của bạn.',
        });
        setQueryMode(fallback.queryMode);
        setMessage('Gợi ý ảnh trang phục thực tế có phom dáng và sắc độ gần nhất với bản phối của bạn.');
        setQueryDrafts({
          remixSearchQuery: fallback.remixSearchQuery,
          styleSearchQuery: fallback.styleSearchQuery,
          traditionalSearchQuery: fallback.traditionalSearchQuery,
        });
      }
    }).finally(() => { window.clearTimeout(timer); if (active) setLoading(false); });
    return () => { active = false; window.clearTimeout(timer); controller.abort(); };
  }, [outfitKey, attempt, canSearch, submittedQueries]);

  const suggestions = result?.images || [];
  const retained = initialSelection && !initialSelection.isUpload && !suggestions.some(img => img.id === initialSelection.id) ? [initialSelection] : [];
  const images = [...uploads, ...retained, ...suggestions].map(img => thumbnailIds.includes(img.id) && img.thumbnailUrl ? { ...img, imageUrl: img.thumbnailUrl } : img);
  const selected = images.find(img => img.id === selectedImageId && !failedIds.includes(img.id));
  const visible = images.filter(img => (img.isUpload || filter === 'all' || img.category === filter) && !failedIds.includes(img.id));
  const choose = (image: ReferenceOutfitImage) => { setSelectedImageId(image.id); setConfirmed(false); };

  async function download(image: ReferenceOutfitImage) {
    if (downloadPending.current) return;
    downloadPending.current = true;
    setDownloadingId(image.id);
    setDownloadError('');
    setDownloadNotice('');
    try {
      await downloadReferenceImage(image);
      if (mounted.current) setDownloadNotice('Đã bắt đầu tải ảnh: ' + image.title);
    } catch (error) {
      if (mounted.current) setDownloadError(error instanceof Error && error.name !== 'TimeoutError'
        ? error.message : 'Tải ảnh mất quá nhiều thời gian. Hãy thử lại.');
    } finally {
      downloadPending.current = false;
      if (mounted.current) setDownloadingId(null);
    }
  }

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setUploadError('Chọn ảnh JPG, PNG hoặc WebP có dung lượng tối đa 8 MB.'); return;
    }
    if (uploads.length >= 5) { setUploadError('Bạn có thể thêm tối đa 5 ảnh trong lượt chọn này.'); return; }
    setUploading(true);
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file);
      });
      // Decode the file before enabling selection; file extensions alone are not validation.
      const decoded = new Image(); decoded.src = url; await decoded.decode();
      if (!mounted.current) return;
      const item: ReferenceOutfitImage = {
        id: `upload-${crypto.randomUUID()}`, title: file.name, imageUrl: url,
        sourceName: 'Ảnh từ thiết bị của bạn', category: 'remix', garmentId: '', tags: [],
        matchScore: 0, matchReason: 'Bạn tự chọn ảnh này; chưa chấm điểm tương đồng.', isUpload: true,
      };
      setUploads(prev => [item, ...prev]); setLoadedIds(prev => [...prev, item.id]); choose(item); setFilter('all');
    } catch { if (mounted.current) setUploadError('Không đọc được ảnh này. Hãy thử một tệp ảnh khác.'); }
    finally { if (mounted.current) setUploading(false); }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label="Chọn ảnh mẫu AI">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">Từ bản phối đến ảnh thật</span>
              <h2 className="mt-1 font-royal text-xl font-semibold text-stone-900">Chọn ảnh mẫu của bạn <span className="align-middle text-[10px] font-sans bg-amber-200 px-2 py-1 rounded-full">BETA</span></h2>
            </div>
            <Sparkles className="mt-1 h-6 w-6 shrink-0 text-amber-700" />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-stone-600">{garments.map(g => g.name).join(' · ') || 'Chưa có món nào trong bản phối.'}</p>
          <form className="mt-3 space-y-2 text-xs" onSubmit={event => {
            event.preventDefault();
            setFailedIds([]); setThumbnailIds([]);
            setSubmittedQueries({ ...queryDrafts }); setAttempt(n => n + 1);
          }}>
            <p className="font-semibold text-stone-700">{queryMode === 'gemini' ? 'Từ khóa AI đề xuất — bấm để sửa' : queryMode === 'custom' ? 'Từ khóa tìm kiếm của bạn' : 'Từ khóa từ bản phối — bấm để sửa'}</p>
            {([['remixSearchQuery', 'Sát bản phối'], ['styleSearchQuery', 'Mở rộng phong cách'], ['traditionalSearchQuery', 'Phom truyền thống']] as const).map(([key, label]) => <label key={key} className="block rounded-lg bg-white/80 px-3 py-2">
              <span className="block mb-1 font-medium text-amber-800">{label}</span>
              <input value={queryDrafts[key]} onChange={event => setQueryDrafts(prev => ({ ...prev, [key]: event.target.value }))} required minLength={3} maxLength={220} disabled={loading} className="w-full min-w-0 rounded border border-stone-200 bg-white px-2 py-2 text-stone-800 focus:border-amber-500 focus:outline-none disabled:opacity-60" />
            </label>)}
            <button type="submit" disabled={loading || !canSearch || Object.values(queryDrafts).some(q => q.trim().length < 3)} className="flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 font-semibold text-white hover:bg-stone-700 disabled:opacity-40"><RefreshCw className="h-3.5 w-3.5" />Tìm lại trên Web</button>
          </form>
        </div>

        <div className="my-4 flex flex-wrap items-center gap-2">
          {filters.map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-full border px-3 py-2 text-[11px] font-medium transition-colors ${filter === value ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white hover:bg-stone-100'}`}>{label}</button>)}
          <button onClick={() => inputRef.current?.click()} disabled={uploading || uploads.length >= 5} className="flex items-center gap-1.5 rounded-full border border-dashed border-amber-400 px-3 py-2 text-[11px] font-semibold text-amber-900 hover:bg-amber-50 disabled:opacity-50"><ImagePlus className="h-3.5 w-3.5" />{uploading ? 'Đang đọc ảnh…' : '+ Tự tải ảnh từ máy'}</button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Tải ảnh mẫu từ máy" onChange={upload} />
        </div>
        {uploadError && <p role="alert" className="mb-3 text-xs text-red-700">{uploadError}</p>}
        {downloadError && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{downloadError}</p>}
        {downloadNotice && <p role="status" className="mb-3 text-xs text-emerald-700">{downloadNotice}</p>}
        {!canSearch && <p className="my-5 text-sm text-stone-600">Hãy chọn áo chính trong tủ đồ để tìm ảnh tương đồng. Bạn vẫn có thể tải ảnh mẫu từ máy.</p>}
        {loading && <div role="status" className="my-4 flex items-center gap-2 text-sm text-amber-800"><Loader2 className="h-4 w-4 animate-spin" />Đang tìm ảnh thật phù hợp với bản phối…</div>}
        {message && <p role="status" className="mb-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">{message}</p>}
        {result && <div className="mb-3 flex items-start justify-between gap-3 text-[11px] text-stone-500">
          <p className="max-w-xl leading-relaxed">{result.rankingMode === 'gemini' ? 'AI giám định ảnh VTON mức Moderate: 50% khớp đồ, 50% tư thế và độ rõ trang phục.' : 'Xếp hạng theo loại áo, màu và món phối trong mô tả.'} Điểm tương đồng là ước tính, không phải kiểm định cổ phục. {result.searchMode === 'offline' ? 'Nguồn: kho dự phòng ngoại tuyến.' : result.searchMode === 'catalog' ? 'Gợi ý ảnh trang phục thực tế có phom dáng và sắc độ gần nhất với bản phối của bạn.' : `Tìm trực tiếp trên Web · ${result.images.length} ảnh${result.fetchedAt ? ' · ' + new Date(result.fetchedAt).toLocaleTimeString('vi-VN') : ''}.`}</p>
        </div>}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 sm:gap-4">
          {visible.map(img => <article key={img.id} className={`min-w-0 overflow-hidden rounded-2xl border-2 bg-white transition-all ${selectedImageId === img.id ? 'border-amber-500 ring-2 ring-amber-200' : 'border-stone-200'}`}>
            <button onClick={() => choose(img)} aria-pressed={selectedImageId === img.id} aria-label={`Chọn ${img.title}`} className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-amber-600">
              <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                <img src={img.imageUrl} alt={img.title} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]" onLoad={() => setLoadedIds(prev => prev.includes(img.id) ? prev : [...prev, img.id])} onError={() => {
                  setLoadedIds(prev => prev.filter(id => id !== img.id));
                  if (img.thumbnailUrl && !thumbnailIds.includes(img.id)) { setThumbnailIds(prev => [...prev, img.id]); return; }
                  setFailedIds(prev => prev.includes(img.id) ? prev : [...prev, img.id]);
                  if (selectedImageId === img.id) { setSelectedImageId(null); setConfirmed(false); }
                }} />
                <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-stone-800 shadow-sm">{img.isUpload ? 'Ảnh của bạn' : result?.searchMode === 'catalog' ? 'Ảnh tham khảo' : `Giống ${img.matchScore}%`}</span>
                {selectedImageId === img.id && <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-1 text-[10px] font-bold text-stone-950"><Check className="h-3 w-3" />Đã chọn</span>}
              </div>
              <div className="p-3"><h3 className="text-xs font-semibold leading-relaxed break-words">{img.title}</h3><p className="mt-1 text-[11px] leading-relaxed text-stone-500">{img.matchReason}</p></div>
            </button>
            <div className="px-3 pb-3 text-[10px] text-stone-500 break-words">
              {img.sourceUrl ? <a href={img.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-amber-800">{img.sourceName} ↗</a> : img.sourceName}
              {img.attribution && <p className="mt-1">{img.attribution} · {img.license}</p>}
            </div>
            <div className="px-3 pb-3">
              <button type="button" disabled={downloadingId !== null} onClick={() => download(img)}
                aria-label={'Tải ảnh ' + img.title}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-[11px] font-semibold text-stone-700 transition-colors hover:border-amber-300 hover:bg-amber-50 disabled:cursor-wait disabled:opacity-50">
                {downloadingId === img.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {downloadingId === img.id ? 'Đang tải…' : 'Tải ảnh về'}
              </button>
            </div>
          </article>)}
        </div>
        {!loading && result && !visible.length && <p role="status" className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">Chưa có ảnh hiển thị trong nhóm này. Hãy đổi bộ lọc, tìm lại hoặc tải ảnh của bạn.</p>}
        {failedIds.length > 0 && <p role="status" className="mt-3 text-xs text-stone-500">Đã ẩn {failedIds.length} ảnh không tải được từ nguồn.</p>}
      </div>
      <footer className="shrink-0 border-t border-stone-200 bg-white p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 text-xs"><p className="font-semibold text-stone-800 break-words">{selected ? selected.title : 'Chọn một ảnh mẫu để tiếp tục'}</p><p className="mt-1 text-[11px] text-stone-500" role="status">{confirmed ? 'Đã lưu ảnh mẫu cho bản phối hiện tại.' : 'Ảnh đã chốt được giữ khi bạn mở lại Lookbook.'}</p></div>
          <button disabled={!selected || !loadedIds.includes(selected.id) || confirmed} onClick={() => { if (selected) { onSelectReferenceImage?.(selected); setConfirmed(true); } }} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-stone-950 transition-colors hover:bg-amber-300 disabled:cursor-default disabled:bg-stone-100 disabled:text-stone-400"><Check className="h-4 w-4 shrink-0" /><span>{confirmed ? 'Đã Chốt Ảnh Mẫu' : 'Chốt Ảnh Mẫu Này'}<span className="block mt-0.5 text-[10px] font-normal">Dùng cho bản phối hiện tại</span></span></button>
        </div>
      </footer>
    </section>
  );
}
