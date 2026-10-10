import React, { useState, useRef } from 'react';
import { ImageAnalysisResult, Garment } from '../types';
import { X, Upload, Sparkles, Loader2, BookOpen, AlertCircle, CheckCircle, ArrowRight, Image as ImageIcon } from 'lucide-react';

interface GeminiImageAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyIdentifiedGarments: (garmentIds: string[]) => void;
}

export const GeminiImageAnalyzerModal: React.FC<GeminiImageAnalyzerModalProps> = ({
  isOpen,
  onClose,
  onApplyIdentifiedGarments,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setAnalysisResult(null);
    setMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setAnalysisResult(null);
    setMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/analyze-vietphuc-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Phân tích thất bại');
      }

      setAnalysisResult(data.analysis);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Có lỗi xảy ra khi phân tích ảnh');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div id="gemini-analyzer-modal" className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-[#faf8f5] border border-stone-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-stone-800">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200/80 bg-[#f5f2eb] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#991b1b] to-[#996515] p-0.5 flex items-center justify-center shadow-xs">
              <div className="w-full h-full bg-[#faf8f5] rounded-[10px] flex items-center justify-center text-[#996515]">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-normal font-royal text-stone-900 tracking-wide flex items-center gap-2">
                Giám Định Cổ Phục Qua Gemini 3.1 Pro
              </h2>
              <p className="text-xs text-stone-500 font-serif italic">Nhận diện trang phục Việt Cổ, xác định triều đại & khảo cứu điển chế bằng AI</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-stone-700 bg-[#faf8f5]">
          {/* Upload Area */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              selectedImage
                ? 'border-[#996515]/60 bg-amber-50/30'
                : 'border-stone-300 hover:border-[#996515] bg-white hover:bg-stone-50/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {selectedImage ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <img
                  src={selectedImage}
                  alt="Ảnh y phục tải lên"
                  className="max-h-48 rounded-xl object-contain border border-stone-200 shadow-sm"
                />
                <div className="text-left space-y-1">
                  <p className="text-sm font-medium text-stone-900">Ảnh y phục đã sẵn sàng</p>
                  <p className="text-xs text-stone-500">Nhấn để chọn ảnh khác hoặc bấm nút bên dưới để phân tích.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-amber-50 mx-auto flex items-center justify-center text-[#996515] border border-amber-100">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-stone-800">
                  Kéo thả ảnh hoặc nhấn để tải lên ảnh y phục
                </p>
                <p className="text-xs text-stone-500">
                  Hỗ trợ ảnh chụp cổ phục, tranh chân dung cung đình, áo dài, áo tấc, nhật bình (PNG, JPG, WEBP)
                </p>
              </div>
            )}
          </div>

          {/* Trigger Button */}
          {selectedImage && (
            <div className="flex justify-center">
              <button
                id="btn-run-gemini-analysis"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    Đang giải mã điển chế với Gemini 3.1 Pro...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Khởi động Giám Định Cổ Phục AI
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error display */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Analysis Results View */}
          {analysisResult && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-white border border-stone-200/90 shadow-2xs">
                <h3 className="text-sm font-medium text-[#996515] font-royal flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Kết Quả Khảo Cứu & Giám Định Cổ Phục
                </h3>

                {/* Badges Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Niên đại ước tính:</span>
                    <span className="text-xs font-semibold text-sky-800">{analysisResult.dynastyAssessment}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Phẩm cấp nghi lễ:</span>
                    <span className="text-xs font-semibold text-[#996515]">{analysisResult.formalityAssessment}</span>
                  </div>
                </div>

                {/* Authenticity Notes */}
                <div className="mb-3">
                  <span className="text-[11px] font-semibold text-[#996515] block mb-1 font-royal">
                    Nhận định tính chân xác lịch sử:
                  </span>
                  <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-200">
                    {analysisResult.authenticityNotes}
                  </p>
                </div>

                {/* Cultural Observations */}
                {analysisResult.culturalObservations && analysisResult.culturalObservations.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[11px] font-semibold text-stone-500 block mb-1">
                      Đặc điểm hoa văn & cổ áo quan sát được:
                    </span>
                    <ul className="space-y-1">
                      {analysisResult.culturalObservations.map((obs, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-stone-700">
                          <span className="text-[#996515] font-bold">•</span>
                          <span>{obs}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Identified Garments */}
                <div>
                  <span className="text-[11px] font-semibold text-stone-500 block mb-1.5">
                    Các chi tiết y phục nhận diện được:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {analysisResult.identifiedGarments.map((g, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-stone-900">{g.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {Math.round(g.confidence * 100)}% khớp
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600">{g.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action to Apply to Avatar */}
              {analysisResult.suggestedWardrobeIds && analysisResult.suggestedWardrobeIds.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <h4 className="text-xs font-semibold text-amber-900 mb-0.5 font-royal">
                      Đồng bộ vào Hình Chiếu Avatar
                    </h4>
                    <p className="text-[11px] text-stone-600">
                      Tự động mặc {analysisResult.suggestedWardrobeIds.length} món y phục tương ứng trong tủ đồ lên avatar.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onApplyIdentifiedGarments(analysisResult.suggestedWardrobeIds);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium text-xs shadow-xs transition-all whitespace-nowrap"
                  >
                    <span>Mặc Lên Avatar Ngay</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f5f2eb] border-t border-stone-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-xs font-medium text-stone-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
