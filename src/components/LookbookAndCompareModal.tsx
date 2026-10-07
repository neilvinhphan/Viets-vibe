import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  GitCompare, 
  ShieldCheck, 
  Palette, 
  BookOpen, 
  Landmark, 
  Sun, 
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Garment, ValidationResult, EventType, WeatherType } from '../types';
import { HistoricalScene } from '../data/historicalScenes';
import { EVENTS_CONFIG, WEATHER_CONFIG } from './SceneSelector';
import { ReferenceImagePicker } from './ReferenceImagePicker';
import type { ReferenceOutfitImage } from '../data/referenceOutfits';

export interface LookbookAndCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  equippedGarments: Garment[];
  validationResult: ValidationResult;
  activeScene: HistoricalScene;
  activeEvent: EventType;
  activeWeather: WeatherType;
  savedVariantA: {
    garments: Garment[];
    validationResult: ValidationResult;
    scene: HistoricalScene;
    event: EventType;
    weather: WeatherType;
    timestamp: number;
  } | null;
  onSaveCurrentAsVariantA: () => void;
  onApplyVariantA: () => void;
  onSelectReferenceImage?: (image: ReferenceOutfitImage) => void;
  selectedReferenceImage?: ReferenceOutfitImage | null;
}

export const LookbookAndCompareModal: React.FC<LookbookAndCompareModalProps> = ({
  isOpen,
  onClose,
  equippedGarments,
  validationResult,
  activeScene,
  activeEvent,
  activeWeather,
  savedVariantA,
  onSaveCurrentAsVariantA,
  onApplyVariantA,
  onSelectReferenceImage,
  selectedReferenceImage,
}) => {
  const [activeTab, setActiveTab] = useState<'lookbook' | 'compare' | 'reference'>('lookbook');
  const [referenceOpened, setReferenceOpened] = useState(false);
  const openReference = () => { setReferenceOpened(true); setActiveTab('reference'); };
  const [copiedText, setCopiedText] = useState(false);
  const [isSavedA, setIsSavedA] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previous?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const currentEventConfig = EVENTS_CONFIG.find(e => e.id === activeEvent) || EVENTS_CONFIG[0];
  const currentWeatherConfig = WEATHER_CONFIG.find(w => w.id === activeWeather) || WEATHER_CONFIG[1];

  // Excerpt 2 sentences from historical context of key robes
  const keyGarment = equippedGarments.find(g => g.category === 'robe' || g.category === 'outerwear') || equippedGarments[0];
  const historicalStory = keyGarment 
    ? keyGarment.historicalContext.split('.').slice(0, 2).join('. ') + '.'
    : 'Y phục Việt cổ mang theo hồn cốt văn hóa nghìn năm của cha ông, nay được thế hệ trẻ tiếp nối với tinh thần sáng tạo không ngừng.';

  // Palette of unique colors
  const colorPalette = Array.from(
    new Map(equippedGarments.map(g => [g.colorHex, g])).values()
  ).slice(0, 5);

  const handleCopyShare = () => {
    const names = equippedGarments.map(g => g.name).join(', ');
    const text = `✨ [LOOKBOOK VIỆT PHỤC REMIX - GEN Z STUDIO]
• Bộ trang phục: ${names || 'Chưa mặc y phục'}
• Bối cảnh: ${activeScene.name} (${activeScene.era})
• Ngữ cảnh: ${currentEventConfig.label} • ${currentWeatherConfig.label}
• Điểm Chuẩn Sử: ${validationResult.metrics.overallScore}/100
• Độ Hài Hòa Màu Sắc: ${validationResult.colorHarmonyScore}%
• Tỷ Lệ Remix: ${validationResult.remixBalance.label}
• Khảo Cứu: "${historicalStory}"`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleSaveA = () => {
    onSaveCurrentAsVariantA();
    setIsSavedA(true);
    setTimeout(() => setIsSavedA(false), 2000);
  };

  return (
    <div 
      id="lookbook-modal-backdrop"
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Lookbook và ảnh mẫu" onKeyDown={event => {
        if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
        if (event.key !== 'Tab') return;
        const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]') || []).filter(node => node.getClientRects().length > 0);
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }} className="w-full max-w-4xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] h-[900px] min-h-0 bg-[#faf8f5] border border-stone-200/90 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-800 animate-fadeIn outline-none">
        {/* Modal Header */}
        <div className="flex shrink-0 items-start justify-between gap-2 px-3 sm:px-5 py-3.5 border-b border-stone-200 bg-white/80 backdrop-blur-md">
          <div className="min-w-0 flex items-center gap-3">
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-stone-100 border border-stone-200 text-xs font-medium">
              <button
                onClick={() => setActiveTab('lookbook')}
                aria-pressed={activeTab === 'lookbook'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'lookbook'
                    ? 'bg-stone-900 text-white shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#eab308]" />
                <span>Thẻ Lookbook 9:16</span>
              </button>
              <button
                onClick={() => setActiveTab('compare')}
                aria-pressed={activeTab === 'compare'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'compare'
                    ? 'bg-stone-900 text-white shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5 text-sky-600" />
                <span>So Sánh A/B</span>
                {savedVariantA && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
              <button onClick={openReference} aria-pressed={activeTab === 'reference'} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${activeTab === 'reference' ? 'bg-stone-900 text-white shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'}`}>
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /><span>Ảnh Mẫu AI (Beta)</span>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng Lookbook"
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className={activeTab === 'reference' ? 'hidden' : 'min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6'}>
          {activeTab === 'lookbook' ? (
            /* TAB 1: 9:16 STORY LOOKBOOK POSTER */
            <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
              {/* The 9:16 Poster Card */}
              <div 
                id="lookbook-story-poster"
                className="relative w-full max-w-[340px] aspect-[9/16] rounded-2xl bg-[#fdfbf7] border-2 border-stone-300/80 shadow-2xl p-5 flex flex-col justify-between overflow-hidden select-none"
              >
                {/* Vintage paper fiber & subtle watermark background */}
                <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-multiply flex items-center justify-center">
                  {activeScene.renderArtwork()}
                </div>

                {/* Top Corner Seal / Decorative Frame */}
                <div className="absolute top-2.5 left-2.5 w-6 h-6 border-t-2 border-l-2 border-[#996515]/60 pointer-events-none" />
                <div className="absolute top-2.5 right-2.5 w-6 h-6 border-t-2 border-r-2 border-[#996515]/60 pointer-events-none" />
                <div className="absolute bottom-2.5 left-2.5 w-6 h-6 border-b-2 border-l-2 border-[#996515]/60 pointer-events-none" />
                <div className="absolute bottom-2.5 right-2.5 w-6 h-6 border-b-2 border-r-2 border-[#996515]/60 pointer-events-none" />

                {/* Top Header of the Card */}
                <div className="relative z-10 text-center">
                  <div className="text-[10px] tracking-[0.28em] font-royal font-bold text-[#996515] uppercase">
                    VIỆT PHỤC REMIX
                  </div>
                  <h3 className="text-lg font-royal font-bold text-stone-900 tracking-wide mt-0.5">
                    GEN Z LOOKBOOK
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-500 font-serif italic mt-0.5">
                    <span>{activeScene.name}</span>
                    <span>•</span>
                    <span>{currentEventConfig.shortLabel}</span>
                    <span>•</span>
                    <span>{currentWeatherConfig.shortLabel}</span>
                  </div>
                </div>

                {/* Center Visual & Cultural Seal Stamp */}
                <div className="relative z-10 my-auto flex flex-col items-center justify-center py-2">
                  {/* Red Cultural Validation Seal (Con Dấu Triện Đỏ) */}
                  <div className="absolute top-0 right-2 z-20 transform rotate-[-8deg] border-2 border-red-700/90 rounded-lg p-1.5 bg-red-50/70 backdrop-blur-2xs shadow-xs text-center">
                    <div className="text-[8px] font-royal font-black text-red-800 uppercase tracking-widest leading-none">
                      {validationResult.metrics.overallScore >= 88 ? 'ĐẠI VIỆT' : 'KIỂM ĐỊNH'}
                    </div>
                    <div className="text-[10px] font-royal font-black text-red-700 uppercase tracking-wider leading-tight">
                      {validationResult.metrics.overallScore >= 88 ? 'CHUẨN SỬ' : 'GEN Z REMIX'}
                    </div>
                    <div className="text-[7.5px] font-mono font-bold text-red-600">
                      {validationResult.metrics.overallScore}% ĐIỂM
                    </div>
                  </div>

                  {/* Garment Highlights Stack */}
                  <div className="w-full space-y-1.5 bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-stone-200/70 shadow-2xs">
                    <div className="text-[9px] uppercase tracking-wider font-semibold text-stone-500 mb-1">
                      Các Lớp Y Phục Phối Hợp ({equippedGarments.length}):
                    </div>
                    {equippedGarments.slice(0, 4).map(g => (
                      <div key={g.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-stone-300"
                            style={{ backgroundColor: g.colorHex }}
                          />
                          <span className="font-medium text-stone-800 truncate text-[11.5px]">{g.name}</span>
                        </div>
                        <span className="text-[9.5px] font-mono text-stone-600 shrink-0 ml-1">
                          {g.dynasty === 'modern' ? 'Gen Z' : g.dynasty.toUpperCase()}
                        </span>
                      </div>
                    ))}
                    {equippedGarments.length > 4 && (
                      <div className="text-[10px] font-serif italic text-stone-600 text-center">
                        + {equippedGarments.length - 4} phụ kiện khác
                      </div>
                    )}
                  </div>
                </div>

                {/* Color Palette Row */}
                <div className="relative z-10 bg-white/80 backdrop-blur-xs rounded-xl p-2.5 border border-stone-200/80 mb-2">
                  <div className="text-[9px] uppercase tracking-wider font-semibold text-stone-500 mb-1.5 flex items-center justify-between">
                    <span>Bảng Sắc Tố Cổ Phục</span>
                    <span className="font-mono text-stone-600 font-bold">Hài Hòa {validationResult.colorHarmonyScore}%</span>
                  </div>
                  <div className="flex items-center justify-around gap-1">
                    {colorPalette.map((g, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div 
                          className="w-5 h-5 rounded-full border border-stone-300 shadow-2xs"
                          style={{ backgroundColor: g.colorHex }}
                          title={`${g.name}: ${g.colorName} (${g.colorHex})`}
                        />
                        <span className="text-[8px] font-mono text-stone-500 mt-0.5 uppercase tracking-tighter">
                          {g.colorHex.slice(0, 5)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Excerpted Historical Context Quote */}
                <div className="relative z-10 text-[10px] text-stone-600 font-serif italic text-center px-1 mb-2 leading-relaxed">
                  "{historicalStory}"
                </div>

                {/* Card Footer Bar */}
                <div className="relative z-10 pt-2 border-t border-stone-200/80 flex items-center justify-between text-[9.5px] text-stone-500">
                  <span className="font-royal text-stone-700 font-medium">Việt Phục Remix Studio</span>
                  <span className="font-mono">{validationResult.remixBalance.label}</span>
                </div>
              </div>

              {/* Lookbook Controls & Export Tools */}
              <div className="flex-1 max-w-md space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-stone-900 font-royal">
                    Thẻ Lookbook Việt Phục 9:16
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Định dạng poster chuẩn tỷ lệ 9:16 thích hợp chia sẻ lên Story Instagram, TikTok hoặc lưu vào bộ sưu tập cá nhân với đầy đủ bảng màu, con dấu kiểm duyệt và trích đoạn sử liệu.
                  </p>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                    <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Điểm Chuẩn Sử</div>
                    <div className="text-xl font-bold font-royal text-emerald-800 mt-0.5">
                      {validationResult.metrics.overallScore}/100
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      {validationResult.metrics.status === 'authentic' ? 'Chuẩn mực điển chế' : 'Khảo cứu cần lưu ý'}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                    <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Độ Hài Hòa Màu</div>
                    <div className="text-xl font-bold font-royal text-amber-800 mt-0.5">
                      {validationResult.colorHarmonyScore}%
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      Quy luật sắc độ & ngũ hành
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button onClick={openReference} className="w-full rounded-xl border border-amber-300 bg-gradient-to-r from-amber-200 to-amber-50 px-4 py-3 text-left shadow-xs transition-colors hover:from-amber-300">
                    <span className="block text-xs font-bold text-amber-950">✨ Tìm Ảnh Thực Tế Tương Đồng (Beta)</span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-amber-900">AI lọc ảnh trang phục thật giống bản phối nhất để chuẩn bị thử đồ</span>
                  </button>
                  <button
                    onClick={handleCopyShare}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-xs transition-all active:scale-98"
                  >
                    {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedText ? 'Đã sao chép văn bản Lookbook!' : 'Sao Chép Tóm Tắt Bản Phối'}</span>
                  </button>

                  <button
                    onClick={handleSaveA}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-medium text-xs transition-all active:scale-98"
                  >
                    <GitCompare className="w-4 h-4 text-amber-700" />
                    <span>{isSavedA ? '✓ Đã lưu thành Phương Án A!' : 'Lưu Bộ Này Làm Phương Án A (Để So Sánh)'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: SPLIT A/B COMPARISON */
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <div>
                  <h4 className="text-base font-semibold text-stone-900 font-royal">
                    So Sánh Phương Án A / B Trực Quan
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Đặt hai phương án cạnh nhau để so sánh điểm Điển chế, Độ hài hòa sắc độ và Tính phù hợp hoàn cảnh.
                  </p>
                </div>

                <button
                  onClick={handleSaveA}
                  className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold border border-amber-300 transition-colors"
                >
                  {isSavedA ? '✓ Đã cập nhật Phương Án A' : 'Cập nhật Phương Án A (Lấy bộ hiện tại)'}
                </button>
              </div>

              {savedVariantA ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Column A: Saved Variant */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-stone-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                          A
                        </span>
                        <span className="font-semibold text-stone-900 font-royal">Phương Án A (Đã Lưu)</span>
                      </div>
                      <span className="text-[10px] text-stone-600 font-mono">
                        {new Date(savedVariantA.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Metrics A */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between text-stone-600 mb-0.5">
                          <span>Điểm Điển Chế:</span>
                          <span className="font-bold text-stone-900">{savedVariantA.validationResult.metrics.overallScore}/100</span>
                        </div>
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-600 h-full rounded-full transition-all"
                            style={{ width: `${savedVariantA.validationResult.metrics.overallScore}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-stone-600 mb-0.5">
                          <span>Độ Hài Hòa Màu:</span>
                          <span className="font-bold text-stone-900">{savedVariantA.validationResult.colorHarmonyScore}%</span>
                        </div>
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full rounded-full transition-all"
                            style={{ width: `${savedVariantA.validationResult.colorHarmonyScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between py-1 border-t border-stone-100 text-[11px]">
                        <span className="text-stone-500">Tỷ Lệ Gen Z:</span>
                        <span className="font-medium text-stone-800">{savedVariantA.validationResult.remixBalance.label}</span>
                      </div>

                      <div className="flex justify-between py-1 border-t border-stone-100 text-[11px]">
                        <span className="text-stone-500">Bối Cảnh / Sự Kiện:</span>
                        <span className="font-medium text-stone-800">{savedVariantA.scene.name} • {savedVariantA.event}</span>
                      </div>
                    </div>

                    {/* Garment List A */}
                    <div className="space-y-1 pt-2 border-t border-stone-100">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500 mb-1">
                        Danh sách y phục ({savedVariantA.garments.length}):
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {savedVariantA.garments.map(g => (
                          <div key={g.id} className="text-[11.5px] text-stone-700 flex items-center justify-between p-1 rounded bg-stone-50">
                            <span className="truncate">{g.name}</span>
                            <span className="text-[9.5px] text-stone-600 uppercase font-mono">{g.category}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={onApplyVariantA}
                      className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-stone-600" />
                      <span>Áp Dụng Lại Phương Án A</span>
                    </button>
                  </div>

                  {/* Column B: Current Variant */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 border-2 border-amber-300 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#996515] text-white flex items-center justify-center text-xs font-bold font-mono">
                          B
                        </span>
                        <span className="font-semibold text-stone-900 font-royal">Phương Án B (Hiện Tại)</span>
                      </div>
                      <span className="text-[10px] text-amber-800 font-medium px-2 py-0.5 rounded-full bg-amber-100">
                        Đang chọn
                      </span>
                    </div>

                    {/* Metrics B */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between text-stone-600 mb-0.5">
                          <span>Điểm Điển Chế:</span>
                          <span className="font-bold text-stone-900">{validationResult.metrics.overallScore}/100</span>
                        </div>
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-600 h-full rounded-full transition-all"
                            style={{ width: `${validationResult.metrics.overallScore}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-stone-600 mb-0.5">
                          <span>Độ Hài Hòa Màu:</span>
                          <span className="font-bold text-stone-900">{validationResult.colorHarmonyScore}%</span>
                        </div>
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full rounded-full transition-all"
                            style={{ width: `${validationResult.colorHarmonyScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between py-1 border-t border-amber-100 text-[11px]">
                        <span className="text-stone-500">Tỷ Lệ Gen Z:</span>
                        <span className="font-medium text-stone-800">{validationResult.remixBalance.label}</span>
                      </div>

                      <div className="flex justify-between py-1 border-t border-amber-100 text-[11px]">
                        <span className="text-stone-500">Bối Cảnh / Sự Kiện:</span>
                        <span className="font-medium text-stone-800">{activeScene.name} • {currentEventConfig.shortLabel}</span>
                      </div>
                    </div>

                    {/* Garment List B */}
                    <div className="space-y-1 pt-2 border-t border-amber-100">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500 mb-1">
                        Danh sách y phục ({equippedGarments.length}):
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {equippedGarments.map(g => (
                          <div key={g.id} className="text-[11.5px] text-stone-700 flex items-center justify-between p-1 rounded bg-white">
                            <span className="truncate">{g.name}</span>
                            <span className="text-[9.5px] text-stone-600 uppercase font-mono">{g.category}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-100/70 text-xs text-amber-900 font-medium text-center">
                      Đang hiển thị trên sân khấu chính
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-white border border-stone-200">
                  <GitCompare className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                  <div className="font-royal font-semibold text-stone-800 text-sm">
                    Chưa có Phương Án A được lưu
                  </div>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    Hãy bấm nút bên dưới để lưu bộ y phục hiện tại thành "Phương Án A", sau đó thoải mái đổi đồ để so sánh với "Phương Án B".
                  </p>
                  <button
                    onClick={handleSaveA}
                    className="mt-4 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
                  >
                    Lưu Bộ Hiện Tại Làm Phương Án A
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {referenceOpened && <div className={activeTab === 'reference' ? 'min-h-0 flex flex-1 flex-col' : 'hidden'}>
          <ReferenceImagePicker key={equippedGarments.map(g => g.id).sort().join('|')} garments={equippedGarments} onSelectReferenceImage={onSelectReferenceImage} initialSelection={selectedReferenceImage} />
        </div>}
      </div>
    </div>
  );
};
