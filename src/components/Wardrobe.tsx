import React, { useState, useMemo } from 'react';
import { Garment, GarmentCategory, DynastyId, FormalityLevel, OutfitPreset } from '../types';
import { 
  Search, 
  Sparkles, 
  Info, 
  Check, 
  Plus, 
  BookOpen, 
  Layers, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp,
  X,
  Filter
} from 'lucide-react';

interface WardrobeProps {
  garments: Garment[];
  presets: OutfitPreset[];
  equippedGarmentIds: string[];
  initialCategory?: GarmentCategory | 'all';
  onToggleGarment: (garment: Garment) => void;
  onInspectGarment: (garment: Garment) => void;
  onApplyPreset: (preset: OutfitPreset) => void;
  onClose?: () => void;
}

export const Wardrobe: React.FC<WardrobeProps> = ({
  garments,
  presets,
  equippedGarmentIds,
  initialCategory = 'all',
  onToggleGarment,
  onInspectGarment,
  onApplyPreset,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<GarmentCategory | 'all'>(initialCategory);
  const [selectedDynasty, setSelectedDynasty] = useState<DynastyId | 'all'>('all');
  const [selectedFormality, setSelectedFormality] = useState<FormalityLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);

  // Sync selected category if initialCategory changes
  React.useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const categories: Array<{ id: GarmentCategory | 'all'; label: string }> = [
    { id: 'all', label: 'Tất Cả' },
    { id: 'robe', label: 'Áo Chính' },
    { id: 'outerwear', label: 'Áo Khoác' },
    { id: 'undergarment', label: 'Áo Yếm' },
    { id: 'bottom', label: 'Quần/Thường' },
    { id: 'headwear', label: 'Khăn/Mũ' },
    { id: 'accessory', label: 'Phụ Kiện' },
    { id: 'footwear', label: 'Hài/Guốc' },
  ];

  const dynasties: Array<{ id: DynastyId | 'all'; label: string }> = [
    { id: 'all', label: 'Mọi Triều Đại' },
    { id: 'nguyen', label: 'Thời Nguyễn' },
    { id: 'hau_le', label: 'Thời Hậu Lê' },
    { id: 'ly_tran', label: 'Thời Lý - Trần' },
  ];

  const formalities: Array<{ id: FormalityLevel | 'all'; label: string }> = [
    { id: 'all', label: 'Mọi Phẩm Cấp' },
    { id: 'thuong_phuc', label: 'Thường Phục' },
    { id: 'le_phuc', label: 'Lễ Phục' },
    { id: 'trieu_phuc', label: 'Triều Phục' },
  ];

  const activeFilterCount = (selectedDynasty !== 'all' ? 1 : 0) + (selectedFormality !== 'all' ? 1 : 0);

  const filteredGarments = useMemo(() => {
    return garments.filter(g => {
      if (selectedCategory !== 'all' && g.category !== selectedCategory) return false;
      if (selectedDynasty !== 'all' && g.dynasty !== selectedDynasty) return false;
      if (selectedFormality !== 'all' && g.formality !== selectedFormality) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = g.name.toLowerCase().includes(q) || g.nameEn.toLowerCase().includes(q);
        const matchesDesc = g.description.toLowerCase().includes(q) || g.historicalContext.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [garments, selectedCategory, selectedDynasty, selectedFormality, searchQuery]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedDynasty('all');
    setSelectedFormality('all');
    setSearchQuery('');
  };

  return (
    <div id="wardrobe-container" className="flex flex-col h-full bg-[#faf8f5] text-stone-800 rounded-none sm:rounded-2xl border-r sm:border border-stone-200/90 overflow-hidden shadow-xl">
      {/* Wardrobe Header: Clean, editorial paper feel */}
      <div className="p-3.5 sm:p-4 border-b border-stone-200/80 bg-[#f5f2eb]">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-[#996515]">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-base font-medium font-royal text-stone-900 tracking-wide">
                Kho Y Phục
              </h2>
              <span className="text-[11px] text-stone-500 font-serif italic">
                {filteredGarments.length} y phục Đại Việt
              </span>
            </div>
          </div>

          {/* Quick Filter Toggle Button & Optional Close Button */}
          <div className="flex items-center gap-1.5">
            <button
              id="wardrobe-filter-toggle-btn"
              onClick={() => setIsFilterPanelOpen(prev => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isFilterPanelOpen || activeFilterCount > 0
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                  : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#996515]" />
              <span>Bộ Lọc</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-stone-900 text-stone-50 text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              {isFilterPanelOpen ? <ChevronUp className="w-3 h-3 ml-0.5 text-stone-400" /> : <ChevronDown className="w-3 h-3 ml-0.5 text-stone-400" />}
            </button>

            {onClose && (
              <button
                id="wardrobe-close-drawer-btn"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-500 hover:text-stone-900 border border-stone-200 transition-all"
                title="Đóng Kho Y Phục"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Compact Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            id="wardrobe-search-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm tên y phục, chất liệu gấm..."
            className="w-full bg-white border border-stone-200/90 rounded-xl pl-8 pr-8 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-600 transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Expandable Filter Panel: Dynasty, Formality & Historical Presets */}
        {isFilterPanelOpen && (
          <div className="mt-3 pt-3 border-t border-stone-200/80 space-y-2.5 animate-fadeIn">
            {/* Historical Presets Quick Bar */}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#996515] font-semibold flex items-center gap-1 mb-1.5">
                <Sparkles className="w-3 h-3 text-amber-700" />
                Mẫu chuẩn sử Đại Việt:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map(preset => {
                  const isEquipped = preset.garmentIds.every(id => equippedGarmentIds.includes(id));
                  return (
                    <button
                      key={preset.id}
                      onClick={() => onApplyPreset(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        isEquipped
                          ? 'bg-amber-100 border-amber-300 text-amber-950 font-semibold'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-amber-400 hover:bg-stone-50'
                      }`}
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Selectors Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div>
                <label className="text-[10px] text-stone-500 block mb-1">Triều đại:</label>
                <select
                  id="filter-dynasty-select"
                  value={selectedDynasty}
                  onChange={e => setSelectedDynasty(e.target.value as any)}
                  className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-800 focus:outline-none focus:border-amber-600"
                >
                  {dynasties.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-stone-500 block mb-1">Phẩm cấp:</label>
                <select
                  id="filter-formality-select"
                  value={selectedFormality}
                  onChange={e => setSelectedFormality(e.target.value as any)}
                  className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-800 focus:outline-none focus:border-amber-600"
                >
                  {formalities.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters Link */}
            {(activeFilterCount > 0 || searchQuery || selectedCategory !== 'all') && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-[#996515] hover:underline flex items-center gap-1 font-medium"
                >
                  <X className="w-3 h-3" />
                  Xóa toàn bộ bộ lọc
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Horizontal Category Strip: Minimalist, clean chips */}
      <div className="px-3.5 py-2 bg-[#f0ece1]/80 border-b border-stone-200/80 overflow-x-auto scrollbar-none flex items-center gap-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            id={`category-tab-${cat.id}`}
            onClick={() => setSelectedCategory(cat.id)}
            className={`text-[11px] px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-stone-900 text-stone-50 font-semibold shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Compact Garment List View: Essential info only, increased whitespace */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-1.5">
        {filteredGarments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <BookOpen className="w-8 h-8 text-stone-400 mb-2" />
            <p className="text-xs text-stone-500">Không tìm thấy y phục phù hợp bộ lọc.</p>
            <button
              onClick={handleResetFilters}
              className="mt-2 text-xs text-[#996515] font-medium hover:underline"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          filteredGarments.map(garment => {
            const isEquipped = equippedGarmentIds.includes(garment.id);

            return (
              <div
                key={garment.id}
                id={`garment-card-${garment.id}`}
                className={`group flex items-center justify-between p-2 sm:p-2.5 rounded-xl border transition-all duration-150 ${
                  isEquipped
                    ? 'bg-amber-50/80 border-amber-300/80 shadow-xs'
                    : 'bg-white border-stone-200/80 hover:bg-stone-50 hover:border-stone-300'
                }`}
              >
                {/* Left: Thumbnail & Name & Key Tag */}
                <div 
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  onClick={() => onToggleGarment(garment)}
                  title={`Nhấp để ${isEquipped ? 'tháo' : 'mặc'} ${garment.name}`}
                >
                  {/* Compact Visual Color Swatch Thumbnail */}
                  <div
                    className="relative w-9 h-9 rounded-lg shrink-0 flex items-center justify-center border border-stone-300/80 overflow-hidden shadow-2xs"
                    style={{ backgroundColor: garment.colorHex }}
                  >
                    {garment.secondaryColorHex && (
                      <div
                        className="absolute bottom-0 right-0 w-4 h-4 rotate-45 transform translate-x-2 translate-y-2"
                        style={{ backgroundColor: garment.secondaryColorHex }}
                      />
                    )}
                    <span className="text-[9px] font-mono font-bold text-white/95 drop-shadow-sm">
                      L{garment.layerSlot}
                    </span>
                  </div>

                  {/* Title & 1-2 Key Tags only */}
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="text-xs font-semibold text-stone-900 truncate group-hover:text-amber-900 transition-colors">
                        {garment.name}
                      </h4>
                      {isEquipped && (
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-600" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px]">
                      {/* 1 Key Tag: Dynasty */}
                      <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-medium border border-stone-200/80">
                        {garment.dynastyName.split('(')[0].trim()}
                      </span>
                      {/* Secondary Category / Formality Tag */}
                      <span className={`px-1.5 py-0.2 rounded border ${
                        garment.formality === 'trieu_phuc'
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : garment.formality === 'le_phuc'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : 'bg-stone-100 text-stone-600 border-stone-200'
                      }`}>
                        {garment.formalityName.split('/')[0].trim()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons: Info Modal Trigger + Toggle Equip */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Info Modal Button */}
                  <button
                    id={`garment-info-btn-${garment.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspectGarment(garment);
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                    title="Xem chi tiết lịch sử, điển chế & mô tả may mặc (Modal)"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>

                  {/* Toggle Equip Button */}
                  <button
                    id={`garment-toggle-btn-${garment.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleGarment(garment);
                    }}
                    className={`flex items-center justify-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                      isEquipped
                        ? 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 font-medium'
                        : 'bg-stone-900 hover:bg-stone-800 text-stone-50 font-semibold shadow-xs'
                    }`}
                  >
                    {isEquipped ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span className="hidden sm:inline">Tháo</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>Mặc</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
