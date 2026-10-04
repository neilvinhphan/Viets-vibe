export const POSTGRESQL_SCHEMA_SQL = `-- ====================================================================
-- VIET PHUC MIX & MATCH: CULTURAL VALIDATION DATABASE SCHEMA
-- PostgreSQL 14+ Compliant Schema for Traditional Vietnamese Garments
-- Supporting Strict Historical Metadata, Layer Sequencing, and Regalia Rules
-- ====================================================================

-- 1. EXTENSIONS & CUSTOM TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE garment_category_enum AS ENUM (
    'headwear',
    'undergarment',
    'robe',
    'outerwear',
    'bottom',
    'footwear',
    'accessory'
);

CREATE TYPE formality_level_enum AS ENUM (
    'thuong_phuc',  -- Everyday casual wear
    'le_phuc',       -- Ceremonial festive wear
    'trieu_phuc'     -- Imperial court regalia
);

CREATE TYPE social_rank_enum AS ENUM (
    'royal',         -- Imperial family (Hoàng tộc / Hậu phi)
    'mandarin',      -- Court officials & nobility (Quan lại / Mệnh phụ)
    'commoner'       -- Scholars & citizens (Thứ dân / Nho sinh)
);

CREATE TYPE gender_target_enum AS ENUM (
    'unisex',
    'female',
    'male'
);

CREATE TYPE rule_severity_enum AS ENUM (
    'error',
    'warning',
    'info'
);

CREATE TYPE rule_type_enum AS ENUM (
    'layer_order',
    'dynasty_mismatch',
    'formality_clash',
    'sumptuary_violation',
    'missing_essential'
);

-- --------------------------------------------------------------------
-- 2. HISTORICAL DYNASTIES TABLE
-- --------------------------------------------------------------------
CREATE TABLE dynasties (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    era_start_year INT NOT NULL,
    era_end_year INT NOT NULL,
    capital_city VARCHAR(100) NOT NULL,
    dress_code_edict VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_dynasty_years CHECK (era_start_year < era_end_year)
);

COMMENT ON TABLE dynasties IS 'Historical Vietnamese eras and dynasties with respective sumptuary edicts.';

-- --------------------------------------------------------------------
-- 3. SOCIAL RANKS & REGALIA TABLE
-- --------------------------------------------------------------------
CREATE TABLE social_ranks (
    id VARCHAR(32) PRIMARY KEY,
    rank_level INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    rank_category social_rank_enum NOT NULL,
    sumptuary_color_allowance TEXT NOT NULL,
    prohibited_patterns TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE social_ranks IS 'Social hierarchy governing sumptuary laws (colors, dragon claws, phoenix embroidery).';

-- --------------------------------------------------------------------
-- 4. MASTER GARMENTS TABLE
-- --------------------------------------------------------------------
CREATE TABLE garments (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    name_en VARCHAR(150),
    category garment_category_enum NOT NULL,
    layer_slot NUMERIC(3, 1) NOT NULL,
    dynasty_id VARCHAR(32) NOT NULL REFERENCES dynasties(id) ON UPDATE CASCADE,
    formality formality_level_enum NOT NULL,
    social_rank social_rank_enum NOT NULL,
    gender gender_target_enum DEFAULT 'unisex',
    primary_color_name VARCHAR(60) NOT NULL,
    color_hex VARCHAR(7) NOT NULL CHECK (color_hex ~* '^#[0-9a-f]{6}$'),
    secondary_color_hex VARCHAR(7) CHECK (secondary_color_hex ~* '^#[0-9a-f]{6}$'),
    pattern_type VARCHAR(60),
    fabric VARCHAR(150),
    symbolism TEXT,
    historical_context TEXT,
    svg_graphic_type VARCHAR(64) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_layer_slot_positive CHECK (layer_slot >= 1.0)
);

CREATE INDEX idx_garments_dynasty ON garments(dynasty_id);
CREATE INDEX idx_garments_category ON garments(category);
CREATE INDEX idx_garments_formality ON garments(formality);
CREATE INDEX idx_garments_layer_slot ON garments(layer_slot);

-- --------------------------------------------------------------------
-- 5. HISTORICAL CITATIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE garment_citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    garment_id VARCHAR(64) NOT NULL REFERENCES garments(id) ON DELETE CASCADE,
    historical_text_name VARCHAR(200) NOT NULL,
    volume_chapter VARCHAR(100),
    excerpt_quote TEXT,
    page_reference VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 6. CULTURAL VALIDATION RULES ENGINE SPECIFICATION
-- --------------------------------------------------------------------
CREATE TABLE cultural_validation_rules (
    id VARCHAR(64) PRIMARY KEY,
    rule_code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    rule_type rule_type_enum NOT NULL,
    severity rule_severity_enum NOT NULL,
    description TEXT NOT NULL,
    historical_rationale TEXT NOT NULL,
    historical_citation VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 7. LAYER DEPENDENCY CONSTRAINTS (GRAPH MATRIX)
-- --------------------------------------------------------------------
CREATE TABLE garment_layer_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_garment_id VARCHAR(64) REFERENCES garments(id) ON DELETE CASCADE,
    target_category garment_category_enum,
    requires_category garment_category_enum,
    forbidden_category garment_category_enum,
    prohibited_paired_garment_id VARCHAR(64) REFERENCES garments(id),
    rule_id VARCHAR(64) REFERENCES cultural_validation_rules(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 8. OUTFIT PRESETS & PRESET ITEMS
-- --------------------------------------------------------------------
CREATE TABLE outfit_presets (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    dynasty_id VARCHAR(32) REFERENCES dynasties(id),
    gender gender_target_enum DEFAULT 'unisex',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE preset_items (
    preset_id VARCHAR(64) REFERENCES outfit_presets(id) ON DELETE CASCADE,
    garment_id VARCHAR(64) REFERENCES garments(id) ON DELETE CASCADE,
    PRIMARY KEY (preset_id, garment_id)
);

-- --------------------------------------------------------------------
-- 9. VALIDATION LOGS & AUDIT TRAIL
-- --------------------------------------------------------------------
CREATE TABLE outfit_validation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100),
    equipped_garment_ids TEXT[] NOT NULL,
    is_valid BOOLEAN NOT NULL,
    authenticity_score INT NOT NULL CHECK (authenticity_score BETWEEN 0 AND 100),
    dynasty_purity_score INT NOT NULL,
    layer_integrity_score INT NOT NULL,
    formality_harmony_score INT NOT NULL,
    detected_issue_codes TEXT[],
    ip_or_user_agent VARCHAR(255),
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 10. SAMPLE SEED DATA
-- --------------------------------------------------------------------
INSERT INTO dynasties (id, name, era_start_year, era_end_year, capital_city, dress_code_edict, description) VALUES
('ly_tran', 'Thời Lý - Trần', 1009, 1400, 'Thăng Long', 'Chiếu quy định Viên Lĩnh hoàng triều', 'Thời kỳ phục hưng độc lập Đại Việt với tinh thần Đông A hào hùng và y phục cổ Viên Lĩnh, Giao Lĩnh.'),
('hau_le', 'Thời Hậu Lê', 1428, 1789, 'Đông Kinh (Thăng Long)', 'Hồng Đức Thiện Chính Thư', 'Nho giáo hưng thịnh, trang phục Giao Lĩnh, Đối Khâm, Mũ Đinh Tự và Thường xếp li phát triển rực rỡ.'),
('nguyen', 'Thời Nguyễn', 1802, 1945, 'Phú Xuân (Huế)', 'Khâm Định Đại Nam Hội Điển Sự Lệ', 'Cải cách Áo Ngũ Thân năm 1744 & 1827, định hình Áo Dài, Áo Tấc, Nhật Bình và Khăn Vấn cung đình.');

INSERT INTO cultural_validation_rules (id, rule_code, name, rule_type, severity, description, historical_rationale, historical_citation) VALUES
('rule_outer_without_robe', 'RULE_LAYER_OUTER_WITHOUT_ROBE', 'Áo khoác ngoài thiếu áo thân trong', 'layer_order', 'error', 'Không thể khoác Nhật Bình hoặc Đối Khâm trực tiếp trên yếm trần.', 'Quy chế triều đình bắt buộc áo khoác ngoài phải đi cùng áo tấc hoặc ngũ thân cài khuy kín cổ bên trong.', 'Khâm Định Đại Nam Hội Điển Sự Lệ'),
('rule_missing_bottom', 'RULE_LAYER_NO_BOTTOM', 'Thiếu quần hoặc thường hạ thân', 'missing_essential', 'error', 'Áo ngũ thân hoặc lễ phục bắt buộc phải có quần hai ống hoặc thường quấn bên dưới.', 'Định chế Chúa Nguyễn Phúc Khoát 1744 quy định phụ nữ và nam giới phải mặc quần dài hạ thân.', 'Đại Nam Thực Lục'),
('rule_court_with_peasant', 'RULE_FORMALITY_COURT_PEASANT_CLASH', 'Triều phục phối cùng đồ thường dân', 'formality_clash', 'error', 'Cấm phối Áo Nhật Bình hoặc Triều phục với guốc mộc dân dã hoặc nón lá.', 'Đi vào triều đình phải mang hài thêu phượng, đội khăn vấn hoàng kim hoặc mũ bình thiên.', 'Điều lệ Nghi Vệ Cung Phủ');
`;

export interface SchemaTableInfo {
  name: string;
  description: string;
  columns: Array<{ name: string; type: string; constraints: string; description: string }>;
}

export const SCHEMA_TABLES: SchemaTableInfo[] = [
  {
    name: 'dynasties',
    description: 'Bảng quản lý triều đại lịch sử Việt Nam và các chiếu dụ y phục liên quan.',
    columns: [
      { name: 'id', type: 'VARCHAR(32)', constraints: 'PRIMARY KEY', description: 'Mã định danh triều đại (ly_tran, hau_le, nguyen)' },
      { name: 'name', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Tên triều đại hiển thị' },
      { name: 'era_start_year', type: 'INT', constraints: 'NOT NULL', description: 'Năm khởi đầu triều đại' },
      { name: 'era_end_year', type: 'INT', constraints: 'NOT NULL', description: 'Năm kết thúc triều đại' },
      { name: 'capital_city', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Kinh đô lịch sử' },
      { name: 'dress_code_edict', type: 'VARCHAR(255)', constraints: 'NULLABLE', description: 'Chiếu chỉ/điển chế y phục nổi bật' }
    ]
  },
  {
    name: 'garments',
    description: 'Bảng chứa toàn bộ dữ liệu y phục Việt Cổ, tầng lớp (layer slot), phẩm trật và chất liệu.',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', constraints: 'PRIMARY KEY', description: 'Mã khóa chính của món trang phục' },
      { name: 'name', type: 'VARCHAR(150)', constraints: 'NOT NULL', description: 'Tên thuần Việt của y phục' },
      { name: 'category', type: 'ENUM', constraints: 'NOT NULL', description: 'Phân loại (robe, outerwear, bottom, headwear...)' },
      { name: 'layer_slot', type: 'NUMERIC(3,1)', constraints: 'NOT NULL, >= 1.0', description: 'Thứ tự lớp y phục từ trong ra ngoài (1=Lót, 2=Áo chính, 3=Khoác ngoài...)' },
      { name: 'dynasty_id', type: 'VARCHAR(32)', constraints: 'FOREIGN KEY -> dynasties(id)', description: 'Niên đại lịch sử y phục' },
      { name: 'formality', type: 'ENUM', constraints: 'NOT NULL', description: 'Phẩm cấp nghi lễ: Thường Phục, Lễ Phục, Triều Phục' },
      { name: 'social_rank', type: 'ENUM', constraints: 'NOT NULL', description: 'Cấp bậc xã hội: Hoàng tộc, Quan lại, Thứ dân' },
      { name: 'color_hex', type: 'VARCHAR(7)', constraints: 'REGEX CHECK', description: 'Mã màu sắc chủ đạo' }
    ]
  },
  {
    name: 'cultural_validation_rules',
    description: 'Động cơ quy tắc văn hóa kiểm tra tính chân xác lịch sử, niên đại, phân tầng và phẩm trật.',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', constraints: 'PRIMARY KEY', description: 'Mã quy tắc định danh' },
      { name: 'rule_code', type: 'VARCHAR(64)', constraints: 'UNIQUE, NOT NULL', description: 'Mã code (vd: RULE_LAYER_OUTER_WITHOUT_ROBE)' },
      { name: 'rule_type', type: 'ENUM', constraints: 'NOT NULL', description: 'Loại quy tắc: layer_order, dynasty_mismatch, formality_clash...' },
      { name: 'severity', type: 'ENUM', constraints: 'NOT NULL', description: 'Mức độ cảnh báo: error, warning, info' },
      { name: 'historical_rationale', type: 'TEXT', constraints: 'NOT NULL', description: 'Giải thích học thuật và cứ liệu lịch sử' },
      { name: 'historical_citation', type: 'VARCHAR(255)', constraints: 'NULLABLE', description: 'Nguồn sử liệu trích dẫn (Đại Nam Hội Điển Sự Lệ, Ngàn Năm Áo Mũ...)' }
    ]
  },
  {
    name: 'outfit_validation_logs',
    description: 'Bảng ghi vết kiểm thử các bộ phối y phục và đánh giá độ chính xác (authenticity score).',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY, DEFAULT uuid', description: 'Mã phiên kiểm định' },
      { name: 'equipped_garment_ids', type: 'TEXT[]', constraints: 'NOT NULL', description: 'Danh sách ID trang phục người dùng kết hợp' },
      { name: 'is_valid', type: 'BOOLEAN', constraints: 'NOT NULL', description: 'Bộ trang phục có hợp lệ 100% không' },
      { name: 'authenticity_score', type: 'INT', constraints: 'CHECK (0-100)', description: 'Điểm số chuẩn xác văn hóa' }
    ]
  }
];
