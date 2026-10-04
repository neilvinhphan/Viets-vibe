import React, { useState } from 'react';
import { POSTGRESQL_SCHEMA_SQL, SCHEMA_TABLES } from '../data/postgresSchema';
import { X, Database, Copy, Check, Download, Table, Code, ShieldCheck } from 'lucide-react';

interface PostgresSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PostgresSchemaModal: React.FC<PostgresSchemaModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'tables' | 'rules'>('sql');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(POSTGRESQL_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([POSTGRESQL_SCHEMA_SQL], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vietphuc_cultural_validation_schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="postgres-schema-modal" className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#faf8f5] border border-stone-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-stone-800">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200/80 bg-[#f5f2eb] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-[#996515]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-normal font-royal text-stone-900 tracking-wide flex items-center gap-2">
                Cơ Sở Dữ Liệu PostgreSQL: Cổ Phục & Động Cơ Kiểm Định
              </h2>
              <p className="text-xs text-stone-500 font-serif italic">PostgreSQL Schema Supporting Cultural Validation Rules</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Action Bar */}
        <div className="px-5 py-2.5 bg-[#f0ece1] border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('sql')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'sql'
                  ? 'bg-stone-900 text-stone-50 font-semibold shadow-xs'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Mã Nguồn DDL SQL
            </button>

            <button
              onClick={() => setActiveTab('tables')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'tables'
                  ? 'bg-stone-900 text-stone-50 font-semibold shadow-xs'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Cấu Trúc Các Bảng (Entities)
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'rules'
                  ? 'bg-stone-900 text-stone-50 font-semibold shadow-xs'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Logic Ràng Buộc Sử Liệu
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs text-stone-700 hover:text-stone-900 hover:border-[#996515] transition-all shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              {copied ? 'Đã sao chép!' : 'Sao chép SQL'}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-300/80 text-xs text-amber-900 hover:bg-amber-200/80 transition-all font-medium"
            >
              <Download className="w-3.5 h-3.5 text-[#996515]" />
              Tải file .sql
            </button>
          </div>
        </div>

        {/* Modal Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-stone-700 bg-[#faf8f5]">
          {activeTab === 'sql' && (
            <div className="relative">
              <pre className="p-4 bg-stone-900 border border-stone-800 rounded-xl font-mono text-[11px] leading-relaxed text-emerald-300 overflow-x-auto select-text shadow-sm">
                {POSTGRESQL_SCHEMA_SQL}
              </pre>
            </div>
          )}

          {activeTab === 'tables' && (
            <div className="space-y-6">
              <p className="text-xs text-stone-600">
                Mô hình cơ sở dữ liệu được thiết kế chuẩn hóa quan hệ (3NF) để lưu trữ mọi đặc tính cổ phục, từ số lớp y phục (layer slot), triều đại, phẩm trật đến bảng quy tắc kiểm định chân xác:
              </p>

              <div className="space-y-4">
                {SCHEMA_TABLES.map(table => (
                  <div key={table.name} className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-bold text-[#996515] flex items-center gap-2">
                        <Table className="w-4 h-4 text-[#996515]" />
                        {table.name}
                      </span>
                      <span className="text-[11px] text-stone-400">Bảng quan hệ</span>
                    </div>

                    <p className="text-xs text-stone-600 mb-3">
                      {table.description}
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-stone-200 text-[10px] text-stone-500 uppercase">
                            <th className="py-1.5 px-2">Cột (Column)</th>
                            <th className="py-1.5 px-2">Kiểu (Type)</th>
                            <th className="py-1.5 px-2">Ràng buộc (Constraints)</th>
                            <th className="py-1.5 px-2">Ý nghĩa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-[11px]">
                          {table.columns.map(col => (
                            <tr key={col.name} className="hover:bg-amber-50/30">
                              <td className="py-1.5 px-2 font-mono font-semibold text-sky-800">{col.name}</td>
                              <td className="py-1.5 px-2 font-mono text-stone-600">{col.type}</td>
                              <td className="py-1.5 px-2 text-amber-700 font-medium">{col.constraints}</td>
                              <td className="py-1.5 px-2 text-stone-600">{col.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
                <h3 className="text-sm font-semibold text-[#996515] mb-2 flex items-center gap-2 font-royal">
                  <ShieldCheck className="w-4 h-4 text-[#996515]" />
                  Nguyên lý Kiểm Định của Cultural Validation Engine qua SQL
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed mb-3">
                  Trong hệ thống cơ sở dữ liệu quan hệ PostgreSQL, các quy tắc văn hóa được mô hình hóa qua hai cấp độ:
                </p>

                <ol className="list-decimal pl-5 space-y-2 text-xs text-stone-700">
                  <li>
                    <strong className="text-stone-900">Cấp độ Ràng Buộc Thực Thể (DDL Constraints):</strong>
                    <p className="text-stone-500 mt-0.5">
                      Sử dụng các kiểu ENUM (<code className="text-sky-700">formality_level_enum</code>, <code className="text-sky-700">social_rank_enum</code>), CHECK constraints trên <code className="text-sky-700">layer_slot</code> để đảm bảo lớp lót luôn &lt; lớp áo chính &lt; áo khoác ngoài.
                    </p>
                  </li>
                  <li>
                    <strong className="text-stone-900">Cấp độ Đồ Thị Quan Hệ (Graph Dependencies):</strong>
                    <p className="text-stone-500 mt-0.5">
                      Bảng <code className="text-sky-700">garment_layer_dependencies</code> lưu trữ ma trận quan hệ cho phép/cấm. Khi người dùng khoác Áo Nhật Bình (<code className="text-amber-800">ao_nhat_binh_cong_chua</code>), query kiểm tra sự tồn tại của item có <code className="text-sky-700">category = 'robe'</code> trong tập hợp đang mặc. Nếu không thỏa mãn, trigger trả về mã cảnh báo <code className="text-rose-600">RULE_LAYER_OUTER_WITHOUT_ROBE</code>.
                    </p>
                  </li>
                  <li>
                    <strong className="text-stone-900">Cấp độ Lịch Sử & Điển Chế (Sumptuary Edicts):</strong>
                    <p className="text-stone-500 mt-0.5">
                      Cross-join giữa <code className="text-sky-700">garments.dynasty_id</code> và <code className="text-sky-700">cultural_validation_rules</code> trích xuất tức thì các văn bản thư tịch cổ (*Khâm Định Đại Nam Hội Điển Sự Lệ*, *Lịch Triều Hiến Chương Loại Chí*) đối chiếu cho người dùng.
                    </p>
                  </li>
                </ol>
              </div>

              {/* Sample Query Code Block */}
              <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 shadow-sm">
                <span className="text-[10px] font-mono text-amber-300 uppercase block mb-1">
                  Ví dụ câu truy vấn kiểm tra xung đột phẩm trật (SQL Check Query):
                </span>
                <pre className="font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed">
{`-- Kiểm tra xem bộ trang phục có trộn lẫn Triều Phục cung đình với Guốc Mộc / Nón lá không:
SELECT 
    g.id, g.name, g.formality, g.category, r.rule_code, r.description
FROM garments g
JOIN cultural_validation_rules r ON r.rule_code = 'RULE_FORMALITY_COURT_PEASANT_CLASH'
WHERE g.id = ANY(ARRAY['ao_nhat_binh_cong_chua', 'guoc_moc_hoa_le'])
  AND EXISTS (SELECT 1 FROM garments WHERE id = ANY(ARRAY['ao_nhat_binh_cong_chua', 'guoc_moc_hoa_le']) AND formality = 'trieu_phuc')
  AND EXISTS (SELECT 1 FROM garments WHERE id = ANY(ARRAY['ao_nhat_binh_cong_chua', 'guoc_moc_hoa_le']) AND id IN ('guoc_moc_hoa_le', 'non_ba_tam_kinh_bac'));`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
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
