import React, { useMemo } from "react";
import { Garment } from "../types";
import { GALLERY_3D_TO_2D_MAP } from "../data/garments";
import {
  X,
  BookOpen,
  Scroll,
  Award,
  Sparkles,
  Check,
  Plus,
  ExternalLink,
} from "lucide-react";

interface HistoricalInfoModalProps {
  garment: Garment | null;
  isEquipped: boolean;
  onClose: () => void;
  onToggleEquip: (garment: Garment) => void;
  onInspect3D?: (galleryId: string) => void;
}

export const HistoricalInfoModal: React.FC<HistoricalInfoModalProps> = ({
  garment,
  isEquipped,
  onClose,
  onToggleEquip,
  onInspect3D,
}) => {
  if (!garment) return null;

  const gallery3DId = useMemo(() => {
    for (const [galleryId, config] of Object.entries(GALLERY_3D_TO_2D_MAP)) {
      if (
        config.primaryGarmentId === garment.id ||
        config.garmentIds.includes(garment.id)
      ) {
        return galleryId;
      }
    }
    if (garment.id.includes("giao_linh")) return "giao_linh";
    if (garment.id.includes("tu_than")) return "tu_than";
    if (garment.id.includes("ngu_than")) return "ngu_than";
    if (garment.id.includes("ao_dai")) return "ao_dai";
    if (garment.id.includes("nhat_binh")) return "nhat_binh";
    return null;
  }, [garment.id]);

  return (
    <div
      id="historical-info-modal"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] bg-[#faf8f5] border border-stone-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-stone-800">
        {/* Header with Garment Banner Color */}
        <div
          className="relative p-6 text-white overflow-hidden shadow-sm"
          style={{
            background: `linear-gradient(135deg, ${garment.colorHex}ee, #292524 95%)`,
          }}
        >
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffd700_1px,transparent_1px)] [background-size:16px_16px]" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/30 text-white/80 hover:text-white hover:bg-black/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-black/40 text-amber-200 border border-amber-200/30">
              {garment.dynastyName}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-black/40 text-stone-200">
              Lớp y phục số {garment.layerSlot}
            </span>
          </div>

          <h2 className="text-2xl font-normal font-royal text-[#fef9c3] tracking-wide mb-1 drop-shadow-sm">
            {garment.name}
          </h2>
          <p className="text-sm text-white/80 italic font-serif">
            {garment.nameEn}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-stone-700 leading-relaxed bg-[#faf8f5]">
          {/* Formality and Social Rank Highlights */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white border border-stone-200/80 shadow-2xs">
            <div>
              <span className="text-[11px] text-stone-500 block mb-0.5">
                Phẩm cấp nghi lễ:
              </span>
              <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#996515]" />
                {garment.formalityName}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-stone-500 block mb-0.5">
                Thân phận phục sức:
              </span>
              <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                <Scroll className="w-3.5 h-3.5 text-sky-700" />
                {garment.socialRankName}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-stone-500 block mb-0.5">
                Chất liệu gấm vóc:
              </span>
              <span className="text-xs text-stone-800 font-medium">
                {garment.fabric}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-stone-500 block mb-0.5">
                Sắc phục chủ đạo:
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full border border-stone-300"
                  style={{ backgroundColor: garment.colorHex }}
                />
                <span className="text-xs text-stone-800">
                  {garment.colorName}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold text-[#996515] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-royal">
              <Sparkles className="w-3.5 h-3.5" />
              Mô tả cấu trúc & May mặc
            </h3>
            <p className="text-xs text-stone-700 leading-relaxed bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
              {garment.description}
            </p>
          </div>

          {/* Historical Context & Court Edicts */}
          <div>
            <h3 className="text-xs font-semibold text-[#996515] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-royal">
              <BookOpen className="w-3.5 h-3.5" />
              Bối cảnh lịch sử & Điển chế
            </h3>
            <p className="text-xs text-stone-700 leading-relaxed bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
              {garment.historicalContext}
            </p>
          </div>

          {/* Cultural Symbolism */}
          <div>
            <h3 className="text-xs font-semibold text-[#996515] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-royal">
              <Scroll className="w-3.5 h-3.5" />Ý nghĩa biểu tượng văn hóa
            </h3>
            <p className="text-xs text-stone-700 leading-relaxed bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
              {garment.symbolism}
            </p>
          </div>

          {/* Citations & Sources */}
          {garment.citations && garment.citations.length > 0 && (
            <div className="pt-2 border-t border-stone-200">
              <span className="text-[11px] font-semibold text-stone-500 block mb-1">
                Tài liệu nghiên cứu & Thư tịch cổ:
              </span>
              <ul className="space-y-1">
                {garment.citations.map((cite, index) => (
                  <li
                    key={index}
                    className="text-xs text-stone-700 italic flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3 h-3 text-[#996515]" />
                    {cite}
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* Disclaimer cho thông tin trang phục */}
        <div className="mt-4 pt-4 border-t border-amber-900/10 flex items-start gap-2 text-[10px] sm:text-[11px] text-amber-900/60 leading-tight">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-700/50">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
          <p>
            <strong>Lưu ý:</strong> Các chi tiết hoa văn, tỷ lệ viền hoặc chất liệu phục dựng trên bản phối 2D có thể chứa sai lệch so với hiện vật lịch sử và <strong>chưa qua giám định chuyên môn</strong>.
          </p>
        </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#f5f2eb] border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs text-stone-600 hover:text-stone-900 transition-colors"
          >
            Đóng bảng khảo cứu
          </button>

          <div className="flex items-center gap-2">
            {gallery3DId && onInspect3D && (
              <button
                type="button"
                onClick={() => {
                  onInspect3D(gallery3DId);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg font-semibold bg-amber-500/15 text-amber-900 border border-amber-400/60 hover:bg-amber-500/25 transition-all shadow-2xs"
                title="Bay thẳng tới bục trưng bày 3D trong Hành lang Di sản"
              >
                <span>🏛️ Soi Mô Hình 3D (360°)</span>
              </button>
            )}

            <button
              onClick={() => {
                onToggleEquip(garment);
                onClose();
              }}
              className={`inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-semibold transition-all ${
                isEquipped
                  ? "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
                  : "bg-stone-900 text-stone-50 hover:bg-stone-800 shadow-xs"
              }`}
            >
              {isEquipped ? (
                "Tháo trang phục này"
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Mặc trang phục này
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
