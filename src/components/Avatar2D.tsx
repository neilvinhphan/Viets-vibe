import React, { useState, useRef } from 'react';
import { Garment, GarmentCategory } from '../types';
import { EraLightingTheme } from '../utils/eraLighting';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  User, 
  Sliders, 
  ChevronDown, 
  X,
  Info
} from 'lucide-react';

interface Avatar2DProps {
  equippedGarments: Garment[];
  onGarmentClick?: (garment: Garment) => void;
  onRemoveGarment?: (garmentId: string) => void;
  onSelectCategoryForWardrobe?: (category: GarmentCategory) => void;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
  eraTheme?: EraLightingTheme;
  isCustomizerOpen?: boolean;
  onToggleCustomizer?: () => void;
  onCloseCustomizer?: () => void;
  gender?: 'female' | 'male';
  onGenderChange?: (gender: 'female' | 'male') => void;
  skinTone?: string;
  onSkinToneChange?: (skinTone: string) => void;
  isIntroActive?: boolean;
}

interface LayerSlotConfig {
  id: GarmentCategory;
  categoryLabel: string;
  order: string;
  innerY: number; // Anchor on clothing in SVG viewBox (0-520)
  labelY: number; // Staggered Y coordinate for text label
  innerX: number; // Anchor near clothing
  outerX: number; // Anchor near outer edge
  side: 'left' | 'right';
}

const LAYER_SLOTS: LayerSlotConfig[] = [
  // Left side: Staggered vertically to never overlap
  { id: 'headwear', categoryLabel: 'Khăn Mũ', order: '01', innerY: 70, labelY: 75, innerX: 154, outerX: 0, side: 'left' },
  { id: 'undergarment', categoryLabel: 'Áo Yếm', order: '02', innerY: 160, labelY: 195, innerX: 148, outerX: 0, side: 'left' },
  { id: 'robe', categoryLabel: 'Áo Chính', order: '03', innerY: 240, labelY: 315, innerX: 136, outerX: 0, side: 'left' },
  { id: 'bottom', categoryLabel: 'Quần Thường', order: '04', innerY: 370, labelY: 435, innerX: 138, outerX: 0, side: 'left' },

  // Right side: Staggered vertically to never overlap
  { id: 'outerwear', categoryLabel: 'Áo Khoác', order: '05', innerY: 185, labelY: 120, innerX: 204, outerX: 340, side: 'right' },
  { id: 'accessory', categoryLabel: 'Phụ Kiện', order: '06', innerY: 275, labelY: 275, innerX: 196, outerX: 340, side: 'right' },
  { id: 'footwear', categoryLabel: 'Hài Guốc', order: '07', innerY: 490, labelY: 435, innerX: 188, outerX: 340, side: 'right' },
];

const MOBILE_LAYER_ORDER: GarmentCategory[] = [
  'robe',        // Áo Chính
  'outerwear',   // Áo Khoác
  'bottom',      // Quần Thường
  'headwear',    // Khăn Mũ
  'accessory',   // Phụ Kiện
  'footwear',    // Hài Guốc
  'undergarment' // Áo Yếm
];

export const Avatar2D: React.FC<Avatar2DProps> = ({
  equippedGarments,
  onGarmentClick,
  onRemoveGarment,
  onSelectCategoryForWardrobe,
  isZenMode = false,
  eraTheme,
  isCustomizerOpen,
  onToggleCustomizer,
  onCloseCustomizer,
  gender: propGender,
  onGenderChange,
  skinTone: propSkinTone,
  onSkinToneChange,
  isIntroActive = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [internalSkinTone, setInternalSkinTone] = useState<string>('#f6d8be');
  const [internalGender, setInternalGender] = useState<'female' | 'male'>('female');
  const [isSettingsOpenInternal, setIsSettingsOpenInternal] = useState<boolean>(false);

  // Controlled or uncontrolled gender & skinTone
  const gender = propGender !== undefined ? propGender : internalGender;
  const skinTone = propSkinTone !== undefined ? propSkinTone : internalSkinTone;

  const handleGenderSelect = (selectedGender: 'female' | 'male') => {
    if (onGenderChange) {
      onGenderChange(selectedGender);
    }
    setInternalGender(selectedGender);
  };

  const handleSkinToneSelect = (selectedTone: string) => {
    if (onSkinToneChange) {
      onSkinToneChange(selectedTone);
    }
    setInternalSkinTone(selectedTone);
  };

  // Controlled or uncontrolled popover state
  const isSettingsOpen = isCustomizerOpen !== undefined ? isCustomizerOpen : isSettingsOpenInternal;
  const handleToggleSettings = () => {
    if (onToggleCustomizer) {
      onToggleCustomizer();
    } else {
      setIsSettingsOpenInternal(prev => !prev);
    }
  };
  const handleCloseSettings = () => {
    if (onCloseCustomizer) {
      onCloseCustomizer();
    } else {
      setIsSettingsOpenInternal(false);
    }
  };

  const customizerPopoverRef = useRef<HTMLDivElement>(null);
  const customizerBtnRef = useRef<HTMLButtonElement>(null);

  // Click outside to dismiss character customizer
  useOnClickOutside(customizerPopoverRef, () => {
    if (isSettingsOpen) {
      handleCloseSettings();
    }
  }, customizerBtnRef);

  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Find equipped garment by category
  const getGarment = (category: GarmentCategory): Garment | undefined => {
    return equippedGarments.find(g => g.category === category);
  };

  const headwear = getGarment('headwear');
  const undergarment = getGarment('undergarment');
  const robe = getGarment('robe');
  const outerwear = getGarment('outerwear');
  const bottom = getGarment('bottom');
  const footwear = getGarment('footwear');
  const accessory = equippedGarments.filter(g => g.category === 'accessory');

  // Exact 4 Vietnamese skin tones requested by user
  const skinTones = [
    { label: 'Bạch Tuyết', color: '#fdf2e9' },
    { label: 'Trắng Hồng', color: '#f6d8be' },
    { label: 'Bánh Mật', color: '#dfb18b' },
    { label: 'Nâu Đồng', color: '#bd8960' },
  ];

  // Render a refined, typography-as-UI callout hugging the avatar silhouette (Desktop Only)
  const renderSlotLabel = (slot: LayerSlotConfig) => {
    const equippedItem = equippedGarments.find(g => g.category === slot.id);
    const hasItem = Boolean(equippedItem);
    const isLeft = slot.side === 'left';

    return (
      <motion.div
        key={slot.id}
        initial={{ opacity: 0, x: isLeft ? 25 : -25 }}
        animate={{
          opacity: isZenMode || isIntroActive ? 0 : 1,
          x: isZenMode || isIntroActive ? (isLeft ? 25 : -25) : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 24,
          delay: isIntroActive ? 0 : 0.05 * Number(slot.order),
        }}
        style={{ top: `${(slot.labelY / 520) * 100}%` }}
        className={`absolute hidden md:block ${isLeft ? 'right-full mr-2.5 sm:mr-3.5' : 'left-full ml-2.5 sm:ml-3.5'} -translate-y-1/2 pointer-events-auto z-10 ${
          isZenMode || isIntroActive ? 'invisible pointer-events-none' : 'visible'
        }`}
      >
        <div
          onMouseEnter={() => setHoveredCategory(slot.id)}
          onMouseLeave={() => setHoveredCategory(null)}
          className={`group select-none flex flex-col min-w-[165px] sm:min-w-[195px] whitespace-nowrap ${isLeft ? 'items-end text-right' : 'items-start text-left'}`}
        >
          {/* DÒNG 1: Tên danh mục in hoa + chấm màu + nếu có đồ: 2 nút icon siêu gọn (Info & X) cùng hàng */}
          <div className={`flex items-center gap-1.5 ${isLeft ? 'justify-end' : 'justify-start'}`}>
            {isLeft && hasItem && equippedItem && (
              <div className="flex items-center gap-0.5 mr-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGarmentClick?.(equippedItem);
                  }}
                  className="p-0.5 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
                  title="Xem điển tích lịch sử"
                >
                  <Info className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveGarment?.(equippedItem.id);
                  }}
                  className="p-0.5 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Cởi bỏ y phục này"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}

            {isLeft && hasItem && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 border border-stone-300 shadow-2xs"
                style={{ backgroundColor: equippedItem?.colorHex || '#996515' }}
              />
            )}

            <span 
              onClick={() => onSelectCategoryForWardrobe?.(slot.id)}
              className="text-[9.5px] uppercase tracking-[0.2em] text-[#996515] font-royal font-semibold transition-colors group-hover:text-amber-800 cursor-pointer"
            >
              {slot.categoryLabel}
            </span>

            {!isLeft && hasItem && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 border border-stone-300 shadow-2xs"
                style={{ backgroundColor: equippedItem?.colorHex || '#996515' }}
              />
            )}

            {!isLeft && hasItem && equippedItem && (
              <div className="flex items-center gap-0.5 ml-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGarmentClick?.(equippedItem);
                  }}
                  className="p-0.5 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
                  title="Xem điển tích lịch sử"
                >
                  <Info className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveGarment?.(equippedItem.id);
                  }}
                  className="p-0.5 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Cởi bỏ y phục này"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>

          {/* DÒNG 2: Tên trang phục (bấm mở ngay ngăn kéo Wardrobe) kèm niên đại nhỏ */}
          <div 
            onClick={() => onSelectCategoryForWardrobe?.(slot.id)}
            className="mt-0.5 cursor-pointer max-w-full"
          >
            {hasItem && equippedItem ? (
              <div>
                <span className="text-[12px] sm:text-[13px] font-normal tracking-wide block truncate max-w-[230px] lg:max-w-[260px] text-stone-800 group-hover:text-stone-950 font-medium transition-colors">
                  {equippedItem.name}
                </span>
                <span className="text-[8.5px] uppercase tracking-widest text-stone-500 font-medium block mt-0.5">
                  {equippedItem.dynastyName}
                </span>
              </div>
            ) : (
              <span className="text-[11px] font-light text-stone-400 italic tracking-wider block hover:text-stone-600 whitespace-nowrap">
                Chưa mặc • Bấm chọn
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div id="avatar-container" className="relative flex flex-col w-full h-full select-none overflow-hidden bg-transparent">
      {/* Subtle Top-Left Context Badge with Era Lighting Indication (Duplicate App Name Removed) */}
      {eraTheme && (
        <motion.div
          initial={false}
          animate={{ opacity: isZenMode || isIntroActive ? 0 : 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute top-4 left-4 z-10 hidden md:flex items-center text-xs select-none ${
            isZenMode || isIntroActive ? 'invisible' : 'visible'
          }`}
        >
          <div 
            id="workspace-era-lighting-badge"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${eraTheme.badgeBg} ${eraTheme.badgeBorder} border text-[11px] shadow-2xs transition-all duration-700`}
            title={`Không gian quang chiếu: ${eraTheme.description}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${eraTheme.badgeDot} animate-pulse shrink-0`} />
            <span className={`font-royal font-medium ${eraTheme.badgeText}`}>{eraTheme.name}</span>
            <span className="text-stone-300 text-[10px]">|</span>
            <span className="font-serif italic text-stone-600 text-[10.5px]">{eraTheme.colorName}</span>
          </div>
        </motion.div>
      )}

      {/* Floating Controls: Zoom & Avatar Customization */}
      <motion.div
        initial={false}
        animate={{
          opacity: isZenMode || isIntroActive ? 0 : 1,
          y: isZenMode || isIntroActive ? -10 : 0,
        }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`absolute bottom-[96px] right-2.5 flex-col-reverse items-end md:bottom-auto md:top-4 md:right-4 md:flex-row md:items-center gap-2 ${
          isSettingsOpen ? 'z-40' : 'z-20'
        } ${
          isZenMode || isIntroActive ? 'pointer-events-none invisible' : 'pointer-events-auto visible'
        }`}
      >
        {/* Floating Zoom Bar */}
        <div className="flex items-center backdrop-blur-xl bg-white/90 rounded-full border border-stone-200/90 px-1 py-0.5 text-xs shadow-xs text-stone-700">
          <button
            id="zoom-out-btn"
            onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.15))}
            className="p-1 sm:p-1.5 text-stone-500 hover:text-stone-900 transition-colors"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="hidden sm:inline text-[10px] text-stone-700 px-1 font-mono min-w-[32px] text-center font-medium">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            id="zoom-in-btn"
            onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.15))}
            className="p-1 sm:p-1.5 text-stone-500 hover:text-stone-900 transition-colors"
            title="Phóng to"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            id="zoom-reset-btn"
            onClick={() => setZoomLevel(1)}
            className="hidden sm:block p-1.5 text-stone-400 hover:text-stone-800 border-l border-stone-200 transition-colors"
            title="Đặt lại zoom 100%"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Avatar Customization Dropdown Button (Gender, Skin Tone) */}
        <div className="relative">
          <button
            id="avatar-settings-dropdown-btn"
            ref={customizerBtnRef}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSettings();
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium border backdrop-blur-xl transition-all shadow-xs ${
              isSettingsOpen
                ? 'bg-stone-900 text-stone-50 border-stone-900'
                : 'bg-white/90 border-stone-200/90 text-stone-700 hover:text-stone-950 hover:bg-stone-100/90'
            }`}
            title="Tùy biến nhân vật: Giới tính & Sắc diện"
          >
            <User className="w-3.5 h-3.5 text-[#996515]" />
            <span className="text-[11px] sm:text-xs">
              <span className="sm:hidden">{gender === 'female' ? 'Nữ' : 'Nam'}</span>
              <span className="hidden sm:inline">{gender === 'female' ? 'Nữ Phục' : 'Nam Phục'}</span>
            </span>
            <ChevronDown className="w-3 h-3 text-stone-400" />
          </button>

          {/* Dropdown Popover */}
          {isSettingsOpen && (
            <div 
              id="avatar-settings-popover" 
              ref={customizerPopoverRef}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 bottom-full mb-2 md:bottom-auto md:top-full md:mt-2 w-64 bg-white border border-stone-200 shadow-xl ring-1 ring-stone-900/5 rounded-2xl p-3.5 z-50 space-y-3.5 animate-fadeIn text-stone-800"
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#996515]" />
                  Tùy Chỉnh Nhân Vật
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseSettings();
                  }}
                  className="text-stone-400 hover:text-stone-700 p-0.5 rounded-md hover:bg-stone-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Gender selector */}
              <div>
                <span className="text-[11px] font-medium text-stone-500 block mb-1.5">Khuôn mẫu trang phục:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    id="gender-female-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenderSelect('female');
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition-all ${
                      gender === 'female'
                        ? 'bg-[#991b1b] text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200/80 hover:bg-stone-200/60'
                    }`}
                  >
                    Nữ Phục
                  </button>
                  <button
                    id="gender-male-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenderSelect('male');
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition-all ${
                      gender === 'male'
                        ? 'bg-sky-900 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200/80 hover:bg-stone-200/60'
                    }`}
                  >
                    Nam Phục
                  </button>
                </div>
              </div>

              {/* Skin tone selector - 2x2 grid */}
              <div>
                <span className="text-[11px] font-medium text-stone-500 block mb-1.5">Sắc diện nước da:</span>
                <div className="grid grid-cols-2 gap-2">
                  {skinTones.map(tone => (
                    <button
                      key={tone.color}
                      type="button"
                      title={`Nước da: ${tone.label}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSkinToneSelect(tone.color);
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
                        skinTone === tone.color
                          ? 'bg-amber-50/80 border-[#996515] text-stone-900 font-semibold shadow-xs'
                          : 'bg-stone-50/70 border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-stone-400/60 shadow-xs shrink-0"
                        style={{ backgroundColor: tone.color }}
                      />
                      <span className="text-[11px] truncate">{tone.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Avatar Stage */}
      <div className="relative flex-1 min-h-0 w-full flex items-center justify-center pb-24 md:pb-0 pt-10 md:pt-0">
        <div
          id="avatar-scale-stage"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
          className="avatar-figure relative shrink-0 transition-transform duration-300 ease-out"
        >
          {/* Subtle Elbow Connecting Lines for Desktop */}
          <motion.svg
            viewBox="0 0 340 520"
            className="absolute inset-0 w-full h-full pointer-events-none hidden md:block"
            initial={false}
            animate={{ opacity: isZenMode || isIntroActive ? 0 : 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: isIntroActive ? 0 : 0.15 }}
          >
            {LAYER_SLOTS.map(slot => {
              const isHovered = hoveredCategory === slot.id;
              const isEquipped = equippedGarments.some(g => g.category === slot.id);
              const isLeft = slot.side === 'left';
              const midX = isLeft ? 55 : 285;
              const strokeColor = isHovered
                ? 'rgba(180, 83, 9, 0.9)'
                : isEquipped
                ? 'rgba(153, 101, 21, 0.5)'
                : 'rgba(0, 0, 0, 0.12)';

              return (
                <g key={slot.id} className="transition-all duration-300">
                  {/* Elbow connector polyline: outerX,labelY -> midX,labelY -> innerX,innerY */}
                  <polyline
                    points={`${slot.outerX},${slot.labelY} ${midX},${slot.labelY} ${slot.innerX},${slot.innerY}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isHovered ? 1.4 : 0.9}
                    strokeDasharray={isEquipped ? 'none' : '3 3'}
                  />

                  {/* Dot on garment */}
                  <circle
                    cx={slot.innerX}
                    cy={slot.innerY}
                    r={isHovered ? 2.5 : 1.5}
                    fill={isHovered ? '#b45309' : isEquipped ? 'rgba(153, 101, 21, 0.7)' : 'rgba(0, 0, 0, 0.2)'}
                  />

                  {/* Dot near outer label */}
                  <circle
                    cx={slot.outerX}
                    cy={slot.labelY}
                    r={isHovered ? 2.5 : 1.5}
                    fill={isHovered ? '#b45309' : isEquipped ? 'rgba(153, 101, 21, 0.7)' : 'rgba(0, 0, 0, 0.2)'}
                  />
                </g>
              );
            })}
          </motion.svg>

          {/* Typography-as-UI Callouts (Desktop) */}
          <motion.div
            initial={false}
            animate={{ opacity: isZenMode || isIntroActive ? 0 : 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute inset-0 pointer-events-none hidden md:block ${isZenMode || isIntroActive ? 'invisible' : 'visible'}`}
          >
            {LAYER_SLOTS.map(slot => renderSlotLabel(slot))}
          </motion.div>

          {/* Main 2D Avatar SVG */}
          <svg
            viewBox="0 0 340 520"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Pattern: Thủy Ba Wave Pattern */}
              <pattern id="thuyba" width="20" height="12" patternUnits="userSpaceOnUse">
                <path d="M 0,6 Q 5,0 10,6 T 20,6" fill="none" stroke="#ffd700" strokeWidth="1" opacity="0.6" />
                <path d="M 0,11 Q 5,5 10,11 T 20,11" fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.4" />
              </pattern>
              {/* Gold gradient for imperial borders */}
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#a16207" />
              </linearGradient>
              {/* Denim texture gradient */}
              <linearGradient id="denimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="50%" stopColor="#475569" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
            </defs>

            {/* --- 1. AVATAR BODY MANNEQUIN --- */}
            <g id="avatar-mannequin">
              {/* Shadow on Floor */}
              <ellipse cx="170" cy="505" rx="75" ry="12" fill="#000000" opacity="0.25" />

              {/* Seamless Pelvis / Hips Base (Connecting from y=280 to y=305) */}
              <path
                d={
                  gender === 'female'
                    ? 'M 144,280 Q 139,295 146,305 L 194,305 Q 201,295 196,280 Z'
                    : 'M 138,280 L 144,305 L 196,305 L 202,280 Z'
                }
                fill={skinTone}
              />

              {/* Complete Left Leg: Thigh (295-385), Knee (385), Calf (385-485), Foot (485-498) */}
              <path
                d={
                  gender === 'female'
                    ? 'M 147,295 Q 143,345 149,385 Q 146,432 152,488 Q 152,498 160,498 Q 167,498 166,488 Q 167,432 167,385 Q 168,345 166,295 Z'
                    : 'M 145,295 Q 143,345 148,385 Q 145,432 151,488 Q 151,498 160,498 Q 168,498 167,488 Q 168,432 168,385 Q 169,345 167,295 Z'
                }
                fill={skinTone}
              />

              {/* Complete Right Leg: Thigh (295-385), Knee (385), Calf (385-485), Foot (485-498) */}
              <path
                d={
                  gender === 'female'
                    ? 'M 174,295 Q 172,345 173,385 Q 173,432 174,488 Q 173,498 180,498 Q 188,498 188,488 Q 194,432 191,385 Q 197,345 193,295 Z'
                    : 'M 173,295 Q 171,345 172,385 Q 172,432 173,488 Q 172,498 180,498 Q 189,498 189,488 Q 195,432 192,385 Q 197,345 195,295 Z'
                }
                fill={skinTone}
              />

              {/* Subtle knee curve accents */}
              <path d="M 152,385 Q 158,388 164,385" fill="none" stroke="#000000" strokeWidth="0.8" opacity="0.1" strokeLinecap="round" />
              <path d="M 176,385 Q 182,388 188,385" fill="none" stroke="#000000" strokeWidth="0.8" opacity="0.1" strokeLinecap="round" />

              {/* Torso & Neck */}
              <rect 
                x={gender === 'female' ? 162 : 160} 
                y={gender === 'female' ? 110 : 108} 
                width={gender === 'female' ? 16 : 20} 
                height={gender === 'female' ? 30 : 32} 
                rx={6} 
                fill={skinTone} 
              />
              <path
                d={
                  gender === 'female'
                    ? 'M 140,135 Q 125,210 145,290 L 195,290 Q 215,210 200,135 Z'
                    : 'M 124,135 L 140,290 L 200,290 L 216,135 Z'
                }
                fill={skinTone}
              />

              {/* Arms & Hands */}
              {gender === 'female' ? (
                <>
                  <path d="M 138,142 Q 115,210 120,290 L 132,290 Q 128,210 145,148 Z" fill={skinTone} />
                  <path d="M 202,142 Q 225,210 220,290 L 208,290 Q 212,210 195,148 Z" fill={skinTone} />
                  <ellipse cx="125" cy="300" rx="8" ry="12" fill={skinTone} />
                  <ellipse cx="215" cy="300" rx="8" ry="12" fill={skinTone} />
                </>
              ) : (
                <>
                  <path d="M 122,140 Q 104,210 114,290 L 126,290 Q 118,210 134,146 Z" fill={skinTone} />
                  <path d="M 218,140 Q 236,210 226,290 L 214,290 Q 222,210 206,146 Z" fill={skinTone} />
                  <ellipse cx="119" cy="300" rx="9" ry="12" fill={skinTone} />
                  <ellipse cx="221" cy="300" rx="9" ry="12" fill={skinTone} />
                </>
              )}

              {/* Head & Jawline */}
              {gender === 'female' ? (
                <ellipse cx="170" cy="85" rx="27" ry="33" fill={skinTone} />
              ) : (
                <path d="M 143,76 C 143,56 197,56 197,76 C 197,95 186,114 170,114 C 154,114 143,95 143,76 Z" fill={skinTone} />
              )}

              {/* Cheek Shading / Blush */}
              {gender === 'female' ? (
                <>
                  <ellipse cx="154" cy="91" rx="5" ry="2.5" fill="#f43f5e" opacity="0.22" />
                  <ellipse cx="186" cy="91" rx="5" ry="2.5" fill="#f43f5e" opacity="0.22" />
                </>
              ) : (
                <>
                  <ellipse cx="153" cy="92" rx="4" ry="2" fill="#78350f" opacity="0.08" />
                  <ellipse cx="187" cy="92" rx="4" ry="2" fill="#78350f" opacity="0.08" />
                </>
              )}

              {/* Eyebrows: Willow (Female) vs Sword (Male) */}
              {gender === 'female' ? (
                <>
                  <path d="M 152,77 Q 161,73 167,77" fill="none" stroke="#3e2723" strokeWidth="1.3" strokeLinecap="round" />
                  <path d="M 173,77 Q 179,73 188,77" fill="none" stroke="#3e2723" strokeWidth="1.3" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <path d="M 150,78 L 160,74 L 167,76" fill="none" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 190,78 L 180,74 L 173,76" fill="none" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}

              {/* Eyes with light highlight */}
              <ellipse cx="159" cy="83" rx="4" ry="2.2" fill="#261c14" />
              <circle cx="160.5" cy="82.2" r="0.8" fill="#ffffff" />
              <ellipse cx="181" cy="83" rx="4" ry="2.2" fill="#261c14" />
              <circle cx="182.5" cy="82.2" r="0.8" fill="#ffffff" />

              {/* Slender Nose */}
              <path d="M 170,83 L 168.5,92 Q 170,94 172,92" fill="none" stroke="#a27b5c" strokeWidth={gender === 'female' ? 0.9 : 1.1} strokeLinecap="round" />

              {/* Lips: Rosy Red (Female) vs Natural healthy tone (Male) */}
              {gender === 'female' ? (
                <>
                  <path d="M 164,101 Q 170,104 176,101" fill="none" stroke="#be123c" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M 166,101.5 Q 170,103 174,101.5" fill="none" stroke="#fb7185" strokeWidth="0.8" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <path d="M 164,101 Q 170,103.5 176,101" fill="none" stroke="#b45309" strokeWidth="1.4" opacity="0.65" strokeLinecap="round" />
                  <path d="M 166,101.5 Q 170,102.5 174,101.5" fill="none" stroke="#d97706" strokeWidth="0.7" opacity="0.5" strokeLinecap="round" />
                </>
              )}

              {/* Hair & Topknot/Bun */}
              {gender === 'female' ? (
                <>
                  {/* Soft female bun */}
                  <circle cx="170" cy="52" r="16" fill="#181412" />
                  <ellipse cx="170" cy="50" rx="14" ry="10" fill="#261e1b" />
                  <path d="M 142,85 C 142,50 198,50 198,85 C 190,65 150,65 142,85 Z" fill="#181412" />
                </>
              ) : (
                <>
                  {/* Búi tóc củ hành Nho sinh / Quân tử cao trên đỉnh đầu */}
                  <ellipse cx="170" cy="42" rx="11" ry="14" fill="#181412" />
                  <rect x="162" y="52" width="16" height="5" rx="2" fill="#996515" />
                  <line x1="154" y1="43" x2="186" y2="43" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" />
                  {/* Hair silhouette neatly pulled back */}
                  <path d="M 143,80 C 143,55 197,55 197,80 C 190,62 150,62 143,80 Z" fill="#181412" />
                </>
              )}
            </g>

            {/* --- 2. LAYER 1: UNDERGARMENT (ÁO YẾM) --- */}
            {undergarment && (
              <g
                id="layer-undergarment"
                onClick={() => onGarmentClick?.(undergarment)}
                className="cursor-pointer transition-all hover:opacity-90"
              >
                <path
                  d="M 170,126 L 198,175 L 170,255 L 142,175 Z"
                  fill={undergarment.colorHex}
                  stroke={undergarment.secondaryColorHex || '#d4af37'}
                  strokeWidth="1.5"
                />
                <path d="M 163,120 Q 170,125 177,120" fill="none" stroke={undergarment.colorHex} strokeWidth="3" />
                <path d="M 142,175 Q 120,185 110,210" fill="none" stroke={undergarment.colorHex} strokeWidth="2" opacity="0.6" />
                <path d="M 198,175 Q 220,185 230,210" fill="none" stroke={undergarment.colorHex} strokeWidth="2" opacity="0.6" />
                <circle cx="170" cy="180" r="5" fill="#facc15" opacity="0.8" />
                <circle cx="170" cy="180" r="2.5" fill="#ffffff" />
              </g>
            )}

            {/* --- 3. LAYER 1.5: BOTTOM (QUẦN / THƯỜNG / JEANS Y2K / CHÂN VÁY NGẮN) --- */}
            {bottom && (
              <g
                id="layer-bottom"
                onClick={() => onGarmentClick?.(bottom)}
                className="cursor-pointer transition-all hover:opacity-95"
              >
                {bottom.id === 'chan_vay_ngan_genz' ? (
                  // Y2K Pleated Mini Skirt
                  <g>
                    <path
                      d="M 144,260 L 196,260 L 215,340 L 125,340 Z"
                      fill={bottom.colorHex}
                      stroke={bottom.secondaryColorHex || '#3f3f46'}
                      strokeWidth="1.2"
                    />
                    {[136, 148, 160, 170, 180, 192, 204].map(x => (
                      <line key={x} x1={x} y1="260" x2={x + (x - 170) * 0.3} y2="340" stroke="#000000" strokeWidth="0.9" opacity="0.35" />
                    ))}
                    <rect x="144" y="258" width="52" height="6" fill="#18181b" rx="1" />
                    <line x1="125" y1="340" x2="215" y2="340" stroke="#52525b" strokeWidth="1.5" />
                  </g>
                ) : bottom.id === 'quan_jeans_y2k' ? (
                  // Y2K Baggy Wide-Leg Denim Jeans
                  <g>
                    <path
                      d="M 143,260 L 168,260 L 162,490 L 114,490 Q 124,370 143,260 Z"
                      fill="url(#denimGrad)"
                      stroke="#475569"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M 172,260 L 197,260 Q 216,370 226,490 L 178,490 L 172,260 Z"
                      fill="url(#denimGrad)"
                      stroke="#475569"
                      strokeWidth="1.2"
                    />
                    <line x1="170" y1="265" x2="170" y2="400" stroke="#d97706" strokeWidth="1" strokeDasharray="3 2" />
                    <path d="M 114,489 Q 138,492 162,489" fill="none" stroke="#d97706" strokeWidth="1.2" />
                    <path d="M 178,489 Q 202,492 226,489" fill="none" stroke="#d97706" strokeWidth="1.2" />
                    <circle cx="150" cy="272" r="1.5" fill="#f59e0b" />
                    <circle cx="190" cy="272" r="1.5" fill="#f59e0b" />
                  </g>
                ) : bottom.id.includes('thuong') ? (
                  // Traditional Pleated Skirt (Thường Xếp Li thời Hậu Lê)
                  <g>
                    <path
                      d="M 142,260 L 198,260 L 225,485 L 115,485 Z"
                      fill={bottom.colorHex}
                      stroke={bottom.secondaryColorHex || '#d4af37'}
                      strokeWidth="1"
                    />
                    {[130, 145, 160, 170, 180, 195, 210].map(x => (
                      <line key={x} x1={x} y1="260" x2={x + (x - 170) * 0.4} y2="485" stroke="#000000" strokeWidth="0.8" opacity="0.25" />
                    ))}
                    <path d="M 115,485 Q 170,490 225,485" fill="none" stroke="#d4af37" strokeWidth="3" />
                  </g>
                ) : (
                  // Traditional Wide Trousers (Quần Bạch Quy / Quần Đen)
                  <g>
                    <path
                      d="M 144,260 L 168,260 L 163,485 L 118,485 Q 128,370 144,260 Z"
                      fill={bottom.colorHex}
                      stroke={bottom.secondaryColorHex || '#cbd5e1'}
                      strokeWidth="1"
                    />
                    <path
                      d="M 172,260 L 196,260 Q 212,370 222,485 L 177,485 L 172,260 Z"
                      fill={bottom.colorHex}
                      stroke={bottom.secondaryColorHex || '#cbd5e1'}
                      strokeWidth="1"
                    />
                    <line x1="170" y1="265" x2="170" y2="390" stroke="#000000" strokeWidth="1.5" opacity="0.2" />
                    <path d="M 118,485 Q 140,488 163,485" fill="none" stroke={bottom.secondaryColorHex || '#94a3b8'} strokeWidth="1.5" />
                    <path d="M 177,485 Q 200,488 222,485" fill="none" stroke={bottom.secondaryColorHex || '#94a3b8'} strokeWidth="1.5" />
                  </g>
                )}
              </g>
            )}

            {/* --- 4. LAYER 2: MAIN ROBE (ÁO TÂN THỜI / ÁO NGŨ THÂN / ÁO TẤC / ÁO GIAO LĨNH / ÁO VIÊN LĨNH) --- */}
            {robe && (
              <g
                id="layer-robe"
                onClick={() => onGarmentClick?.(robe)}
                className="cursor-pointer transition-all hover:opacity-95"
              >
                {robe.id === 'ao_dai_tan_thoi' ? (
                  // Modern Reimagined Ao Dai (Tân Thời)
                  <g>
                    <path
                      d="M 139,135 L 201,135 L 214,415 L 126,415 Z"
                      fill={robe.colorHex}
                      stroke={robe.secondaryColorHex || '#e2e8f0'}
                      strokeWidth="1.2"
                    />
                    <path d="M 139,138 Q 116,195 120,270 L 129,270 Q 126,200 144,146 Z" fill={robe.colorHex} />
                    <path d="M 201,138 Q 224,195 220,270 L 211,270 Q 214,200 196,146 Z" fill={robe.colorHex} />
                    <line x1="120" y1="270" x2="129" y2="270" stroke="#ffffff" strokeWidth="2" />
                    <line x1="211" y1="270" x2="220" y2="270" stroke="#ffffff" strokeWidth="2" />
                    <ellipse cx="170" cy="125" rx="14" ry="7" fill="none" stroke="#ffffff" strokeWidth="2.5" />
                    <line x1="130" y1="260" x2="130" y2="415" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
                    <line x1="210" y1="260" x2="210" y2="415" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
                    <path d="M 126,415 Q 170,422 214,415" fill="none" stroke="#ffffff" strokeWidth="2" />
                  </g>
                ) : robe.id === 'ao_tu_than_kinh_bac' || robe.id.includes('tu_than') ? (
                  // Áo Tứ Thân Kinh Bắc (Khoác ngoài yếm đào, thắt lưng lụa xanh cốm buông trước bụng)
                  <g>
                    {/* Thân sau buông rủ */}
                    <path
                      d="M 144,245 L 196,245 L 206,465 L 134,465 Z"
                      fill={robe.colorHex}
                      opacity="0.9"
                    />
                    {/* Vạt áo khoác nâu mở chữ V trước ngực để lộ lớp Áo Yếm đỏ bên trong */}
                    <path
                      d="M 136,135 L 155,135 L 148,245 L 120,460 L 110,455 L 126,245 Z"
                      fill={robe.colorHex}
                      stroke="#451a03"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M 185,135 L 204,135 L 214,245 L 230,455 L 220,460 L 192,245 Z"
                      fill={robe.colorHex}
                      stroke="#451a03"
                      strokeWidth="1.2"
                    />
                    {/* Tay áo lửng ôm nhẹ */}
                    <path d="M 136,138 Q 112,205 116,285 L 126,285 Q 124,205 144,146 Z" fill={robe.colorHex} stroke="#451a03" strokeWidth="0.8" />
                    <path d="M 204,138 Q 228,205 224,285 L 214,285 Q 216,205 196,146 Z" fill={robe.colorHex} stroke="#451a03" strokeWidth="0.8" />
                    {/* Viền vạt áo chữ V */}
                    <path d="M 153,135 L 147,245" stroke="#451a03" strokeWidth="1.6" />
                    <path d="M 187,135 L 193,245" stroke="#451a03" strokeWidth="1.6" />
                    {/* Dải thắt lưng lụa xanh cốm (#84cc16) buộc ngang eo buông hai dải trước bụng */}
                    <rect x="138" y="240" width="64" height="12" rx="2" fill="#84cc16" stroke="#4d7c0f" strokeWidth="1" />
                    <circle cx="170" cy="246" r="4.5" fill="#65a30d" stroke="#365314" strokeWidth="1" />
                    {/* Hai dải xanh cốm buông dài trước bụng */}
                    <path d="M 166,249 Q 162,310 159,370 L 166,370 Q 169,310 170,250 Z" fill="#84cc16" stroke="#4d7c0f" strokeWidth="0.8" />
                    <path d="M 171,249 Q 175,310 179,365 L 172,365 Q 170,310 168,250 Z" fill="#84cc16" stroke="#4d7c0f" strokeWidth="0.8" />
                    {/* Tà dưới bay nhẹ */}
                    <path d="M 110,455 Q 122,462 136,465" stroke="#361a06" strokeWidth="1.2" fill="none" />
                    <path d="M 204,465 Q 218,462 230,455" stroke="#361a06" strokeWidth="1.2" fill="none" />
                  </g>
                ) : robe.id.includes('vien_linh') ? (
                  // Áo Viên Lĩnh Lý - Trần
                  <g>
                    <path
                      d="M 132,135 L 208,135 L 226,458 L 114,458 Z"
                      fill={robe.colorHex}
                      stroke={robe.secondaryColorHex || '#d4af37'}
                      strokeWidth="1.2"
                    />
                    <path d="M 132,140 L 74,235 L 88,360 L 136,305 Z" fill={robe.colorHex} />
                    <path d="M 208,140 L 266,235 L 252,360 L 204,305 Z" fill={robe.colorHex} />
                    <path d="M 74,235 L 88,360" stroke="#facc15" strokeWidth="2.5" />
                    <path d="M 266,235 L 252,360" stroke="#facc15" strokeWidth="2.5" />
                    <ellipse cx="170" cy="128" rx="18" ry="10" fill="none" stroke="#facc15" strokeWidth="3" />
                    <circle cx="186" cy="128" r="3" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
                    <circle cx="170" cy="180" r="13" fill="#facc15" opacity="0.85" />
                    <circle cx="170" cy="180" r="8" fill={robe.colorHex} />
                    <circle cx="170" cy="180" r="3" fill="#ffffff" />
                    <rect x="138" y="244" width="64" height="12" rx="2" fill="#78350f" stroke="#facc15" strokeWidth="1" />
                    <path d="M 114,458 Q 170,466 226,458" fill="none" stroke="#facc15" strokeWidth="2" />
                  </g>
                ) : robe.id.includes('giao_linh') ? (
                  // Áo Giao Lĩnh
                  <g>
                    <path
                      d="M 132,135 L 208,135 L 226,450 L 114,450 Z"
                      fill={robe.colorHex}
                      stroke={robe.secondaryColorHex || '#000000'}
                      strokeWidth="1"
                    />
                    <path d="M 134,142 L 80,240 L 98,340 L 138,260 Z" fill={robe.colorHex} />
                    <path d="M 206,142 L 260,240 L 242,340 L 202,260 Z" fill={robe.colorHex} />
                    <path d="M 148,135 L 200,240 L 195,450" fill="none" stroke="#d4af37" strokeWidth="4" />
                    <path d="M 192,135 L 140,240" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.7" />
                    <rect x="140" y="240" width="60" height="14" fill="#854d0e" rx="3" />
                  </g>
                ) : robe.id.includes('tac') ? (
                  // Áo Tấc
                  <g>
                    <path
                      d="M 136,134 L 204,134 L 220,460 L 120,460 Z"
                      fill={robe.colorHex}
                      stroke={robe.secondaryColorHex || '#000000'}
                      strokeWidth="1.2"
                    />
                    <path d="M 136,138 L 70,220 L 76,380 L 136,330 Z" fill={robe.colorHex} />
                    <path d="M 204,138 L 270,220 L 264,380 L 204,330 Z" fill={robe.colorHex} />
                    <path d="M 70,220 L 76,380" stroke="#facc15" strokeWidth="2.5" />
                    <path d="M 270,220 L 264,380" stroke="#facc15" strokeWidth="2.5" />
                    <rect x="157" y="116" width="26" height="18" rx="4" fill={robe.colorHex} stroke="#d4af37" strokeWidth="1.5" />
                    <path d="M 170,134 Q 190,165 194,225 L 194,460" fill="none" stroke={robe.secondaryColorHex || '#d4af37'} strokeWidth="2" />
                    {[134, 150, 172, 200, 230].map((y, idx) => (
                      <circle key={idx} cx={170 + idx * 4.5} cy={y} r="2.5" fill="#facc15" stroke="#78350f" strokeWidth="0.8" />
                    ))}
                  </g>
                ) : (
                  // Áo Ngũ Thân Tay Chẽn
                  <g>
                    <path
                      d="M 138,135 L 202,135 L 216,450 L 124,450 Z"
                      fill={robe.colorHex}
                      stroke={robe.secondaryColorHex || '#0f172a'}
                      strokeWidth="1"
                    />
                    <path d="M 138,138 Q 112,210 118,295 L 128,295 Q 124,210 144,148 Z" fill={robe.colorHex} />
                    <path d="M 202,138 Q 228,210 222,295 L 212,295 Q 216,210 196,148 Z" fill={robe.colorHex} />
                    <rect x="158" y="117" width="24" height="17" rx="3" fill={robe.colorHex} stroke="#e2e8f0" strokeWidth="1" />
                    <path d="M 170,134 Q 186,165 190,220 L 190,450" fill="none" stroke="#000000" strokeWidth="1.5" opacity="0.3" />
                    {[134, 148, 168, 192, 218].map((y, idx) => (
                      <circle key={idx} cx={170 + idx * 4} cy={y} r="2" fill="#d4af37" />
                    ))}
                    <path d="M 124,450 Q 170,458 216,450" fill="none" stroke="#d4af37" strokeWidth="1.5" />
                  </g>
                )}
              </g>
            )}

            {/* --- 5. LAYER 3: OUTER COURT ROBE (ÁO NHẬT BÌNH / ĐỐI KHÂM) --- */}
            {outerwear && (
              <g
                id="layer-outerwear"
                onClick={() => onGarmentClick?.(outerwear)}
                className="cursor-pointer transition-all hover:opacity-95"
              >
                {outerwear.id.includes('nhat_binh') ? (
                  // Áo Nhật Bình
                  <g>
                    <path
                      d="M 134,136 L 206,136 L 224,455 L 116,455 Z"
                      fill={outerwear.colorHex}
                      stroke={outerwear.secondaryColorHex || '#d4af37'}
                      strokeWidth="1.5"
                    />
                    <path d="M 134,142 L 84,235 L 94,360 L 136,310 Z" fill={outerwear.colorHex} />
                    <path d="M 206,142 L 256,235 L 246,360 L 204,310 Z" fill={outerwear.colorHex} />
                    {['#eab308', '#2563eb', '#ffffff', '#dc2626', '#18181b'].map((col, idx) => (
                      <g key={idx}>
                        <rect x={84 + idx * 2} y={345 + idx * 2.5} width="12" height="4" fill={col} transform="rotate(20 84 345)" />
                        <rect x={244 - idx * 2} y={345 + idx * 2.5} width="12" height="4" fill={col} transform="rotate(-20 244 345)" />
                      </g>
                    ))}
                    <rect x="160" y="136" width="20" height="319" fill="#000000" opacity="0.08" />
                    <path
                      d="M 152,136 L 152,245 L 188,245 L 188,136 Z"
                      fill="none"
                      stroke="url(#goldGrad)"
                      strokeWidth="6"
                    />
                    <path
                      d="M 152,136 L 152,245 L 188,245 L 188,136 Z"
                      fill="none"
                      stroke="#991b1b"
                      strokeWidth="2"
                    />
                    <circle cx="170" cy="190" r="10" fill="#d97706" opacity="0.9" />
                    <circle cx="170" cy="190" r="6" fill="#facc15" />
                    <circle cx="170" cy="190" r="2.5" fill="#ffffff" />
                    <rect x="116" y="440" width="108" height="15" fill="url(#thuyba)" opacity="0.8" />
                    <line x1="116" y1="455" x2="224" y2="455" stroke="url(#goldGrad)" strokeWidth="3" />
                  </g>
                ) : (
                  // Áo Đối Khâm
                  <g>
                    <path
                      d="M 132,135 L 208,135 L 228,455 L 112,455 Z"
                      fill={outerwear.colorHex}
                      stroke={outerwear.secondaryColorHex || '#1e3a8a'}
                      strokeWidth="1.2"
                    />
                    <path d="M 134,142 L 78,245 L 94,365 L 136,310 Z" fill={outerwear.colorHex} />
                    <path d="M 206,142 L 262,245 L 246,365 L 204,310 Z" fill={outerwear.colorHex} />
                    <line x1="156" y1="135" x2="156" y2="455" stroke="#f8fafc" strokeWidth="4" />
                    <line x1="184" y1="135" x2="184" y2="455" stroke="#f8fafc" strokeWidth="4" />
                  </g>
                )}
              </g>
            )}

            {/* --- 6. LAYER 4: ACCESSORIES (VÂN KIÊN, THẮT LƯNG, NGỌC BỘI, TÚI TOTE, GHIM CÀI) --- */}
            {accessory.map(acc => {
              if (acc.id === 'tui_tote_genz') {
                return (
                  <g
                    key={acc.id}
                    id="layer-tui-tote"
                    onClick={() => onGarmentClick?.(acc)}
                    className="cursor-pointer transition-all hover:scale-105"
                  >
                    <line x1="140" y1="138" x2="218" y2="305" stroke="#292524" strokeWidth="3.5" />
                    <rect x="204" y="295" width="28" height="34" rx="3" fill="#fef3c7" stroke="#292524" strokeWidth="1.2" />
                    <line x1="208" y1="305" x2="228" y2="305" stroke="#996515" strokeWidth="1.5" />
                    <circle cx="218" cy="315" r="4" fill="#996515" opacity="0.6" />
                  </g>
                );
              }
              if (acc.id === 'ghim_cai_vat_ao') {
                return (
                  <g
                    key={acc.id}
                    id="layer-ghim-cai"
                    onClick={() => onGarmentClick?.(acc)}
                    className="cursor-pointer transition-all hover:scale-125"
                  >
                    <circle cx="180" cy="155" r="3.5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
                    <circle cx="180" cy="155" r="1.5" fill="#38bdf8" />
                    <line x1="180" y1="158" x2="180" y2="166" stroke="#94a3b8" strokeWidth="1.2" />
                  </g>
                );
              }
              if (acc.id.includes('van_kien')) {
                return (
                  <g
                    key={acc.id}
                    id="layer-van-kien"
                    onClick={() => onGarmentClick?.(acc)}
                    className="cursor-pointer transition-all hover:scale-105"
                  >
                    <path
                      d="M 170,126 Q 192,126 210,146 Q 195,175 170,172 Q 145,175 130,146 Q 148,126 170,126 Z"
                      fill={acc.colorHex}
                      stroke="#fbbf24"
                      strokeWidth="2"
                    />
                    <circle cx="170" cy="150" r="4" fill="#ffffff" />
                    {[140, 155, 170, 185, 200].map(x => (
                      <circle key={x} cx={x} cy="174" r="1.8" fill="#fef08a" />
                    ))}
                  </g>
                );
              }
              if (acc.id.includes('that_lung')) {
                return (
                  <g
                    key={acc.id}
                    id="layer-that-lung"
                    onClick={() => onGarmentClick?.(acc)}
                    className="cursor-pointer transition-all hover:opacity-95"
                  >
                    <rect x="138" y="246" width="64" height="10" fill={acc.colorHex} rx="2" stroke="#fbbf24" strokeWidth="1" />
                    <path d="M 166,256 L 163,380 L 169,380 Z" fill={acc.colorHex} />
                    <path d="M 174,256 L 177,370 L 171,370 Z" fill={acc.colorHex} />
                    <line x1="161" y1="380" x2="167" y2="390" stroke="#facc15" strokeWidth="1.5" />
                    <line x1="173" y1="370" x2="179" y2="380" stroke="#facc15" strokeWidth="1.5" />
                  </g>
                );
              }
              if (acc.id.includes('ngoc_boi')) {
                return (
                  <g
                    key={acc.id}
                    id="layer-ngoc-boi"
                    onClick={() => onGarmentClick?.(acc)}
                    className="cursor-pointer transition-all hover:scale-110"
                  >
                    <line x1="192" y1="250" x2="192" y2="280" stroke="#d97706" strokeWidth="1.5" />
                    <rect x="187" y="280" width="10" height="16" rx="2" fill="#6ee7b7" stroke="#047857" strokeWidth="1" />
                    <circle cx="192" cy="288" r="2.5" fill="#ffffff" />
                    <line x1="192" y1="296" x2="192" y2="315" stroke="#dc2626" strokeWidth="2" />
                  </g>
                );
              }
              return null;
            })}

            {/* --- 7. LAYER 5: HEADWEAR (KHĂN VẤN / KHĂN ĐÓNG / KÍNH Y2K / TAI NGHE CHỤP TAI) --- */}
            {headwear && (
              <g
                id="layer-headwear"
                onClick={() => onGarmentClick?.(headwear)}
                className="cursor-pointer transition-all hover:scale-105"
              >
                {headwear.id === 'kinh_ram_y2k' ? (
                  <g>
                    <path d="M 152,81 L 165,82 L 162,88 L 151,85 Z" fill="#09090b" stroke="#e4e4e7" strokeWidth="1" />
                    <line x1="165" y1="82" x2="175" y2="82" stroke="#e4e4e7" strokeWidth="1.2" />
                    <path d="M 175,82 L 188,81 L 189,85 L 178,88 Z" fill="#09090b" stroke="#e4e4e7" strokeWidth="1" />
                    <line x1="151" y1="83" x2="145" y2="80" stroke="#e4e4e7" strokeWidth="1" />
                    <line x1="189" y1="83" x2="195" y2="80" stroke="#e4e4e7" strokeWidth="1" />
                  </g>
                ) : headwear.id === 'tai_nghe_genz' ? (
                  <g>
                    <path d="M 142,82 Q 170,42 198,82" fill="none" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                    <rect x="138" y="76" width="8" height="18" rx="3" fill="#cbd5e1" stroke="#475569" strokeWidth="1.2" />
                    <rect x="194" y="76" width="8" height="18" rx="3" fill="#cbd5e1" stroke="#475569" strokeWidth="1.2" />
                  </g>
                ) : headwear.id.includes('khan_van') ? (
                  <g>
                    <ellipse cx="170" cy="62" rx="33" ry="15" fill={headwear.colorHex} stroke={headwear.secondaryColorHex || '#ca8a04'} strokeWidth="2" />
                    <ellipse cx="170" cy="58" rx="30" ry="12" fill={headwear.secondaryColorHex || '#ca8a04'} />
                    <ellipse cx="170" cy="54" rx="27" ry="10" fill={headwear.colorHex} />
                    <circle cx="170" cy="68" r="3" fill="#6ee7b7" stroke="#ffffff" strokeWidth="1" />
                  </g>
                ) : headwear.id.includes('khan_dong') ? (
                  <g>
                    <ellipse cx="170" cy="64" rx="32" ry="14" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
                    <path d="M 160,72 L 170,66 L 180,72" fill="none" stroke="#52525b" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 158,68 L 170,62 L 182,68" fill="none" stroke="#27272a" strokeWidth="2" />
                  </g>
                ) : headwear.id.includes('phac_dau') ? (
                  <g>
                    <ellipse cx="170" cy="62" rx="30" ry="16" fill="#18181b" stroke="#d4af37" strokeWidth="1.5" />
                    <ellipse cx="170" cy="54" rx="24" ry="12" fill="#27272a" />
                    <path d="M 144,62 Q 105,54 85,70 Q 102,76 142,66" fill="#18181b" stroke="#d4af37" strokeWidth="1.2" />
                    <path d="M 196,62 Q 235,54 255,70 Q 238,76 198,66" fill="#18181b" stroke="#d4af37" strokeWidth="1.2" />
                    <circle cx="170" cy="56" r="3" fill="#facc15" />
                  </g>
                ) : headwear.id.includes('dinh_tu') ? (
                  <g>
                    <path d="M 144,72 L 196,72 L 190,46 L 150,46 Z" fill="#09090b" stroke="#d97706" strokeWidth="1" />
                    <rect x="135" y="32" width="70" height="14" rx="2" fill="#18181b" stroke="#fbbf24" strokeWidth="1.5" />
                    <circle cx="170" cy="39" r="3" fill="#fbbf24" />
                  </g>
                ) : (
                  <g>
                    <ellipse cx="170" cy="54" rx="65" ry="18" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
                    <ellipse cx="170" cy="54" rx="28" ry="8" fill="#fde68a" />
                    <path d="M 125,58 Q 115,180 120,340" fill="none" stroke="#991b1b" strokeWidth="3" />
                    <path d="M 215,58 Q 225,180 220,340" fill="none" stroke="#991b1b" strokeWidth="3" />
                  </g>
                )}
              </g>
            )}

            {/* --- 8. LAYER 6: FOOTWEAR (SNEAKER CHUNKY / BOOTS ĐEN / HÀI THÊU / GUỐC MỘC) --- */}
            {footwear && (
              <g
                id="layer-footwear"
                onClick={() => onGarmentClick?.(footwear)}
                className="cursor-pointer transition-all hover:scale-105"
              >
                {footwear.id === 'giay_sneaker_trang' ? (
                  <g>
                    <rect x="142" y="492" width="26" height="8" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
                    <path d="M 144,492 L 152,484 L 166,488 L 168,492 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                    <line x1="142" y1="497" x2="168" y2="497" stroke="#e2e8f0" strokeWidth="2" />
                    <rect x="172" y="492" width="26" height="8" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
                    <path d="M 174,492 L 176,488 L 190,484 L 198,492 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                    <line x1="172" y1="497" x2="198" y2="497" stroke="#e2e8f0" strokeWidth="2" />
                  </g>
                ) : footwear.id === 'boots_da_den' ? (
                  <g>
                    <rect x="144" y="445" width="22" height="50" rx="3" fill="#18181b" stroke="#3f3f46" strokeWidth="1.2" />
                    <rect x="140" y="494" width="28" height="7" rx="2" fill="#09090b" stroke="#52525b" strokeWidth="1" />
                    {[455, 465, 475, 485].map(y => (
                      <line key={y} x1="150" y1={y} x2="160" y2={y} stroke="#71717a" strokeWidth="1" />
                    ))}
                    <rect x="174" y="445" width="22" height="50" rx="3" fill="#18181b" stroke="#3f3f46" strokeWidth="1.2" />
                    <rect x="172" y="494" width="28" height="7" rx="2" fill="#09090b" stroke="#52525b" strokeWidth="1" />
                    {[455, 465, 475, 485].map(y => (
                      <line key={y} x1="180" y1={y} x2="190" y2={y} stroke="#71717a" strokeWidth="1" />
                    ))}
                  </g>
                ) : footwear.id.includes('hai_theu') ? (
                  <g>
                    <path d="M 148,485 L 166,485 Q 169,498 163,500 L 140,500 Q 134,494 148,485 Z" fill={footwear.colorHex} stroke="#facc15" strokeWidth="1" />
                    <path d="M 140,500 Q 132,496 136,490" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 174,485 L 192,485 Q 206,494 200,500 L 177,500 Q 171,498 174,485 Z" fill={footwear.colorHex} stroke="#facc15" strokeWidth="1" />
                    <path d="M 200,500 Q 208,496 204,490" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
                  </g>
                ) : (
                  <g>
                    <rect x="144" y="493" width="22" height="7" rx="1.5" fill={footwear.colorHex} stroke="#451a03" strokeWidth="1" />
                    <rect x="174" y="493" width="22" height="7" rx="1.5" fill={footwear.colorHex} stroke="#451a03" strokeWidth="1" />
                    <path d="M 146,493 Q 155,486 164,493" fill="none" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 176,493 Q 185,486 194,493" fill="none" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" />
                  </g>
                )}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* --- MOBILE BOTTOM LAYER DOCK (< 768px) --- */}
      {/* Horizontally scrollable dock at bottom of screen, clean, elegant, no cut-off text, prioritized order */}
      <div 
        id="mobile-layer-dock"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200/90 py-2 px-3 transition-all duration-500 transform ${
          isZenMode || isIntroActive ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="flex items-center justify-between mb-1 px-1">
          <span className="text-[10px] uppercase tracking-wider font-royal font-semibold text-[#996515]">
            7 Lớp Y Phục Phân Rã
          </span>
          <span className="text-[9.5px] text-stone-500">
            Vuốt ngang để xem • Chạm để đổi đồ
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {MOBILE_LAYER_ORDER.map(catId => {
            const slot = LAYER_SLOTS.find(s => s.id === catId);
            if (!slot) return null;
            const item = equippedGarments.find(g => g.category === catId);
            const isEquipped = Boolean(item);
            return (
              <div
                key={slot.id}
                onClick={() => onSelectCategoryForWardrobe?.(slot.id)}
                className={`w-[152px] shrink-0 flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isEquipped
                    ? 'bg-amber-50/90 border-amber-200 text-amber-950 shadow-2xs hover:bg-amber-100/90'
                    : 'bg-stone-50 border-stone-200/80 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div 
                    className="w-2.5 h-2.5 rounded-full border border-stone-300 shrink-0"
                    style={{ backgroundColor: item?.colorHex || '#d6d3d1' }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] uppercase tracking-wider font-semibold text-stone-500 truncate">
                      {slot.categoryLabel}
                    </div>
                    <div className="text-[11px] font-medium text-stone-800 truncate">
                      {item ? item.name : 'Chưa mặc'}
                    </div>
                  </div>
                </div>

                {isEquipped && item && (
                  <div className="flex items-center gap-0.5 shrink-0 ml-0.5">
                    {onGarmentClick && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGarmentClick(item);
                        }}
                        className="p-1 rounded-full text-stone-400 hover:text-amber-800 hover:bg-amber-100/80 transition-colors"
                        title="Xem điển tích y phục"
                      >
                        <Info className="w-3.5 h-3.5 text-amber-700" />
                      </button>
                    )}
                    {onRemoveGarment && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveGarment(item.id);
                        }}
                        className="p-1 rounded-full text-stone-400 hover:text-rose-600 hover:bg-rose-100/80 transition-colors"
                        title="Cởi nhanh món này"
                      >
                        <X className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
