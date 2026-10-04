import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  GraduationCap, 
  Building2, 
  Coffee, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export type VibeType = 'concert' | 'ky_yeu' | 'le_chua' | 'cafe';

export interface IntroOnboardingModalProps {
  isOpen: boolean;
  onSelectVibe: (vibe: VibeType) => void;
  onSkip: () => void;
}

export const IntroOnboardingModal: React.FC<IntroOnboardingModalProps> = ({
  isOpen,
  onSelectVibe,
  onSkip,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="intro-onboarding-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-stone-900/50 backdrop-blur-md select-none"
        >
          <motion.div
            id="intro-onboarding-card"
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10, transition: { duration: 0.25 } }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-lg bg-[#faf8f5]/95 border border-stone-300/80 shadow-2xl rounded-3xl p-5 sm:p-7 overflow-hidden text-stone-800"
          >
            {/* Vintage Asian corner ornaments */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#996515]/60 pointer-events-none" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#996515]/60 pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#996515]/60 pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#996515]/60 pointer-events-none" />

            {/* Header Badge & Title */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-300/70 text-[#996515] text-[10px] font-semibold tracking-widest uppercase mb-2">
                <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
                <span>Việt Phục Remix • Gen Z Studio</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-royal font-bold text-stone-900 tracking-wide">
                Mở Màn Không Gian Cổ Phục
              </h2>
              <p className="text-xs sm:text-[13px] text-stone-600 font-serif italic mt-1">
                Hôm nay bạn muốn phối trang phục cho sự kiện nào?
              </p>
            </div>

            {/* 4 Quick Vibe Cards (2x2 grid on mobile and desktop) */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 mb-4">
              {/* 1. Đi Concert Âm Nhạc */}
              <button
                id="vibe-concert-btn"
                type="button"
                onClick={() => onSelectVibe('concert')}
                className="group flex flex-col items-start p-3 sm:p-3.5 rounded-2xl bg-white/85 hover:bg-amber-50/80 border border-stone-200/90 hover:border-[#996515] text-left transition-all duration-200 shadow-2xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 group-hover:scale-110 transition-transform">
                    <Music className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200/60">
                    Streetwear
                  </span>
                </div>
                <div className="font-royal font-bold text-stone-900 text-xs sm:text-sm group-hover:text-amber-900 transition-colors">
                  Đi Concert Âm Nhạc
                </div>
                <div className="text-[10px] text-stone-500 mt-1 line-clamp-2 leading-tight">
                  Ngũ Thân + Sneaker • Thăng Long • Mát 24°C
                </div>
              </button>

              {/* 2. Chụp Kỷ Yếu Thanh Xuân */}
              <button
                id="vibe-ky-yeu-btn"
                type="button"
                onClick={() => onSelectVibe('ky_yeu')}
                className="group flex flex-col items-start p-3 sm:p-3.5 rounded-2xl bg-white/85 hover:bg-amber-50/80 border border-stone-200/90 hover:border-[#996515] text-left transition-all duration-200 shadow-2xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200/60">
                    Thanh Xuân
                  </span>
                </div>
                <div className="font-royal font-bold text-stone-900 text-xs sm:text-sm group-hover:text-amber-900 transition-colors">
                  Chụp Kỷ Yếu
                </div>
                <div className="text-[10px] text-stone-500 mt-1 line-clamp-2 leading-tight">
                  Áo Dài Tân Thời • Văn Miếu • Nắng 35°C
                </div>
              </button>

              {/* 3. Lễ Chùa / Di Tích */}
              <button
                id="vibe-le-chua-btn"
                type="button"
                onClick={() => onSelectVibe('le_chua')}
                className="group flex flex-col items-start p-3 sm:p-3.5 rounded-2xl bg-white/85 hover:bg-amber-50/80 border border-stone-200/90 hover:border-[#996515] text-left transition-all duration-200 shadow-2xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Cung Đình
                  </span>
                </div>
                <div className="font-royal font-bold text-stone-900 text-xs sm:text-sm group-hover:text-amber-900 transition-colors">
                  Lễ Chùa / Di Tích
                </div>
                <div className="text-[10px] text-stone-500 mt-1 line-clamp-2 leading-tight">
                  Áo Tấc Lễ Phục • Chùa Một Cột • Mát 24°C
                </div>
              </button>

              {/* 4. Dạo Phố Cafe Hoài Niệm */}
              <button
                id="vibe-cafe-btn"
                type="button"
                onClick={() => onSelectVibe('cafe')}
                className="group flex flex-col items-start p-3 sm:p-3.5 rounded-2xl bg-white/85 hover:bg-amber-50/80 border border-stone-200/90 hover:border-[#996515] text-left transition-all duration-200 shadow-2xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 group-hover:scale-110 transition-transform">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60">
                    Phố Cổ
                  </span>
                </div>
                <div className="font-royal font-bold text-stone-900 text-xs sm:text-sm group-hover:text-amber-900 transition-colors">
                  Dạo Phố Cafe
                </div>
                <div className="text-[10px] text-stone-500 mt-1 line-clamp-2 leading-tight">
                  Giao Lĩnh + Boots/Kính • Hoa Lư • Mát 24°C
                </div>
              </button>
            </div>

            {/* Skip Button */}
            <div className="text-center pt-1 border-t border-stone-200/70">
              <button
                id="intro-skip-btn"
                type="button"
                onClick={onSkip}
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 font-medium py-1 px-3 rounded-full hover:bg-stone-100 transition-colors group"
              >
                <span>Hoặc tự do khám phá (Bỏ qua)</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
