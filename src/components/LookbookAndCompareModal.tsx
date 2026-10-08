import React, { useEffect, useRef, useState } from 'react';
import { X, Sparkles, GitCompare, ArrowRight } from 'lucide-react';
import { Garment, ValidationResult, EventType, WeatherType } from '../types';
import { HistoricalScene } from '../data/historicalScenes';
import { EVENTS_CONFIG } from './SceneSelector';
import { ReferenceImagePicker } from './ReferenceImagePicker';
import type { ReferenceOutfitImage } from '../data/referenceOutfits';

export interface LookbookAndCompareModalProps {
  isOpen: boolean;
  initialTab?: 'compare' | 'reference';
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
  initialTab = 'reference',
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
  const [activeTab, setActiveTab] = useState<'compare' | 'reference'>(initialTab);
  const [referenceOpened, setReferenceOpened] = useState(false);
  const openReference = () => { setReferenceOpened(true); setActiveTab('reference'); };
  const [isSavedA, setIsSavedA] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    if (initialTab === 'reference') setReferenceOpened(true);
  }, [isOpen, initialTab]);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previous?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const currentEventConfig = EVENTS_CONFIG.find(e => e.id === activeEvent) || EVENTS_CONFIG[0];

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
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Ảnh mẫu và so sánh bản phối" onKeyDown={event => {
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
          {/* Outfit comparison */}
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
        </div>
        {referenceOpened && <div className={activeTab === 'reference' ? 'min-h-0 flex flex-1 flex-col' : 'hidden'}>
          <ReferenceImagePicker key={equippedGarments.map(g => g.id).sort().join('|')} garments={equippedGarments} onSelectReferenceImage={onSelectReferenceImage} initialSelection={selectedReferenceImage} />
        </div>}
      </div>
    </div>
  );
};
