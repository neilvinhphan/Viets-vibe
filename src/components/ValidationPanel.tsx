import React, { useState } from 'react';
import { ValidationResult, ValidationIssue, Garment, ValidationMode } from '../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Layers,
  Palette,
  Sliders,
  X
} from 'lucide-react';

interface ValidationPanelProps {
  validationResult: ValidationResult;
  equippedGarments: Garment[];
  validationMode: ValidationMode;
  onToggleValidationMode: (mode: ValidationMode) => void;
  onInspectGarmentById?: (garmentId: string) => void;
  onClose?: () => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  validationResult,
  equippedGarments,
  validationMode,
  onToggleValidationMode,
  onInspectGarmentById,
  onClose,
}) => {
  const { metrics, issues, eraSummary, recommendations, remixBalance, colorHarmonyScore } = validationResult;
  const [expandedIssueIds, setExpandedIssueIds] = useState<Record<string, boolean>>({});
  const [isEquippedSectionOpen, setIsEquippedSectionOpen] = useState<boolean>(false);
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState<boolean>(false);

  const toggleIssueExpand = (id: string) => {
    setExpandedIssueIds(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authentic':
        return {
          bg: 'bg-emerald-50/80',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-200 font-semibold',
          title: validationMode === 'genz_remix' ? 'Gen Z Remix Đạt Chuẩn Văn Hóa' : 'Hợp Lệ & Chuẩn Sử',
          sub: 'Tuân thủ đúng quy tắc văn hóa và cấu trúc phân tầng trang phục.',
        };
      case 'advisory':
        return {
          bg: 'bg-amber-50/80',
          border: 'border-amber-200',
          text: 'text-amber-800',
          badge: 'bg-amber-100 text-amber-900 border-amber-200 font-semibold',
          title: 'Cần Khảo Cứu Thêm',
          sub: 'Có lưu ý về thời tiết, chất liệu hoặc phụ kiện cần tinh chỉnh.',
        };
      default:
        return {
          bg: 'bg-rose-50/80',
          border: 'border-rose-200',
          text: 'text-rose-800',
          badge: 'bg-rose-100 text-rose-900 border-rose-200 font-semibold',
          title: 'Sai Lệch Quy Chuẩn Văn Hóa',
          sub: 'Xung đột bối cảnh tôn nghiêm, vạt áo hoặc thiếu lớp trang phục bắt buộc.',
        };
    }
  };

  const statusStyle = getStatusColor(metrics.status);

  return (
    <div id="cultural-validation-engine" className="flex flex-col h-full bg-[#faf8f5] text-stone-800 rounded-none sm:rounded-2xl border-stone-200/90 overflow-hidden shadow-xl">
      {/* Engine Header */}
      <div className="p-3.5 sm:p-4 border-b border-stone-200/80 bg-[#f5f2eb]">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-[#996515]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold font-royal text-stone-900 tracking-wide">
                Động Cơ Kiểm Duyệt Văn Hóa & Hài Hòa
              </h2>
              <span className="text-[11px] text-stone-500 font-serif italic">
                {eraSummary}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Score Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-stone-500 uppercase font-semibold">Điểm số:</span>
              <span className="text-sm font-bold font-mono text-[#996515]">
                {metrics.overallScore}đ
              </span>
            </div>

            {onClose && (
              <button
                id="validation-panel-close-btn"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-500 hover:text-stone-900 border border-stone-200 transition-all"
                title="Đóng bảng kiểm định"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Validation Mode Selector Switch */}
        <div className="flex items-center justify-between p-1.5 rounded-xl bg-white border border-stone-200 shadow-2xs mb-2.5">
          <span className="text-[11px] font-semibold text-stone-600 pl-1.5 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-[#996515]" />
            Chế độ kiểm duyệt:
          </span>
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => onToggleValidationMode('genz_remix')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium text-[11px] ${
                validationMode === 'genz_remix'
                  ? 'bg-amber-100/80 text-amber-950 border border-amber-300 font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ✨ Gen Z Remix (Mặc định)
            </button>
            <button
              onClick={() => onToggleValidationMode('strict_historical')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium text-[11px] ${
                validationMode === 'strict_historical'
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              📜 Điển Chế Nghiêm Ngặt
            </button>
          </div>
        </div>

        {/* Streamlined Overall Authenticity Banner */}
        <div className={`p-3 rounded-xl border ${statusStyle.bg} ${statusStyle.border} transition-all shadow-2xs`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusStyle.badge} uppercase tracking-wider`}>
              {statusStyle.title}
            </span>
            <span className="text-[11px] text-stone-600">
              {statusStyle.sub}
            </span>
          </div>

          {/* Sub-Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-200/60">
            <div>
              <div className="flex justify-between text-[10px] text-stone-500 mb-0.5 font-medium">
                <span>Điển chế sử liệu</span>
                <span className="font-mono text-stone-800">{metrics.dynastyPurity}%</span>
              </div>
              <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all duration-300"
                  style={{ width: `${metrics.dynastyPurity}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-stone-500 mb-0.5 font-medium">
                <span>Cấu trúc phân tầng</span>
                <span className="font-mono text-stone-800">{metrics.layerIntegrity}%</span>
              </div>
              <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${metrics.layerIntegrity}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-stone-500 mb-0.5 font-medium">
                <span>Hài hòa màu sắc</span>
                <span className="font-mono text-stone-800">{colorHarmonyScore}%</span>
              </div>
              <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-600 rounded-full transition-all duration-300"
                  style={{ width: `${colorHarmonyScore}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-stone-500 mb-0.5 font-medium">
                <span>Tỷ lệ Remix</span>
                <span className="font-mono text-stone-800">{remixBalance.modernPercent}% Hiện đại</span>
              </div>
              <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${remixBalance.modernPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Issues & Diagnostics */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {issues.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center shadow-2xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
            <h4 className="text-xs font-semibold text-emerald-900 mb-0.5">
              Phối y phục hoàn hảo và hài hòa!
            </h4>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              Bộ trang phục đạt chuẩn mực văn hóa Đại Việt và hài hòa sắc độ với hoàn cảnh sự kiện.
            </p>
          </div>
        ) : (
          issues.map(issue => {
            const isError = issue.severity === 'error';
            const isExpanded = !!expandedIssueIds[issue.id];

            return (
              <div
                key={issue.id}
                id={`issue-${issue.id}`}
                className={`p-2.5 rounded-xl border transition-all ${
                  isError
                    ? 'bg-rose-50/70 border-rose-200'
                    : 'bg-amber-50/70 border-amber-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {isError ? (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-xs font-semibold text-stone-900 truncate">
                        {issue.title}
                      </h4>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/80 border border-stone-200 text-stone-600 shrink-0">
                        {issue.ruleCode}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-700 leading-relaxed">
                      {issue.message}
                    </p>

                    <button
                      onClick={() => toggleIssueExpand(issue.id)}
                      className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-[#996515] hover:underline"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>{isExpanded ? 'Thu gọn sử liệu' : 'Xem giải thích văn hóa & gợi ý sửa'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-stone-200/70 space-y-2 animate-fadeIn text-[11px]">
                        <div className="p-2.5 rounded-lg bg-white border border-stone-200/80 shadow-2xs space-y-1">
                          <span className="text-[10px] font-semibold text-[#996515] block font-royal">
                            Ý nghĩa văn hóa & Điển chế:
                          </span>
                          <p className="text-stone-700 leading-relaxed">
                            {issue.historicalExplanation}
                          </p>
                          {issue.citation && (
                            <p className="text-[10px] text-stone-500 italic pt-1 border-t border-stone-100">
                              Căn cứ: {issue.citation}
                            </p>
                          )}
                        </div>

                        {issue.suggestedFix && (
                          <div className="flex items-start gap-1.5 text-amber-900 text-[11px] font-medium bg-amber-100/60 p-2 rounded-lg border border-amber-200/60">
                            <Sparkles className="w-3 h-3 text-amber-700 shrink-0 mt-0.5" />
                            <span>{issue.suggestedFix}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Collapsible Recommendations */}
        {recommendations.length > 0 && (
          <div className="p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs">
            <button
              onClick={() => setIsRecommendationsOpen(prev => !prev)}
              className="w-full flex items-center justify-between text-xs font-semibold text-[#996515]"
            >
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Gợi ý hoàn thiện ({recommendations.length})</span>
              </div>
              {isRecommendationsOpen ? <ChevronUp className="w-3.5 h-3.5 text-stone-400" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
            </button>

            {isRecommendationsOpen && (
              <ul className="mt-2 pt-2 border-t border-stone-100 space-y-1.5 text-[11px] text-stone-700 animate-fadeIn">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-[#996515] shrink-0 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Currently Selected Items Drawer Tab */}
      <div className="bg-[#f5f2eb] border-t border-stone-200/80 z-20">
        <button
          id="equipped-items-toggle-btn"
          onClick={() => setIsEquippedSectionOpen(prev => !prev)}
          className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-stone-600 hover:text-stone-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#996515] flex items-center gap-1.5 font-royal">
              <Layers className="w-3 h-3 text-[#996515]" />
              Y Phục Đang Mặc
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-stone-700 border border-stone-200">
              {equippedGarments.length} món
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-stone-500 hover:text-[#996515]">
            <span>{isEquippedSectionOpen ? 'Thu gọn' : 'Xem chi tiết'}</span>
            {isEquippedSectionOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </button>

        {isEquippedSectionOpen && (
          <div className="px-3.5 pb-2.5 pt-1 border-t border-stone-200/60 animate-fadeIn">
            {equippedGarments.length === 0 ? (
              <p className="text-[11px] text-stone-400 py-1 text-center">Chưa mặc y phục nào</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {equippedGarments.map(g => (
                  <button
                    key={g.id}
                    onClick={() => onInspectGarmentById?.(g.id)}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-stone-200/90 text-[11px] text-stone-800 hover:border-amber-400 hover:bg-amber-50/50 transition-all shadow-2xs"
                    title={`Lớp ${g.layerSlot}: ${g.name} - Nhấp để xem khảo cứu`}
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full border border-stone-300 shrink-0" 
                      style={{ backgroundColor: g.colorHex }} 
                    />
                    <span className="truncate max-w-[130px] font-medium">{g.name}</span>
                    <span className="text-[9px] text-stone-500">L{g.layerSlot}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
