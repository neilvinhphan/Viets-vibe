export type GarmentCategory = 
  | 'headwear' 
  | 'undergarment' 
  | 'robe' 
  | 'outerwear' 
  | 'bottom' 
  | 'footwear' 
  | 'accessory';

export type DynastyId = 'ly_tran' | 'hau_le' | 'nguyen' | 'modern';

export type FormalityLevel = 'thuong_phuc' | 'le_phuc' | 'trieu_phuc';

export type SocialRank = 'royal' | 'mandarin' | 'commoner';

export type GenderTarget = 'unisex' | 'female' | 'male';

export type EventType = 'le_chua' | 'concert' | 'ky_yeu' | 'cafe';

export type WeatherType = 'nang_35' | 'mat_24' | 'lanh_16';

export type ValidationMode = 'strict_historical' | 'genz_remix';

export interface Garment {
  id: string;
  name: string;
  nameEn: string;
  category: GarmentCategory;
  layerSlot: number; // 1: undergarment, 1.5: bottom, 2: robe/tunic, 3: outerwear, 4: accessory/sash, 5: headwear, 6: footwear
  dynasty: DynastyId;
  dynastyName: string;
  eraYears: string;
  formality: FormalityLevel;
  formalityName: string;
  socialRank: SocialRank;
  socialRankName: string;
  gender: GenderTarget;
  colorName: string;
  colorHex: string;
  secondaryColorHex?: string;
  accentColorHex?: string;
  patternType?: 'phuong_hoang' | 'long_van' | 'hoa_sen' | 'thuy_ba' | 'ngu_hanh' | 'plain' | 'dam_may' | 'modern_minimal';
  description: string;
  historicalContext: string;
  fabric: string;
  symbolism: string;
  citations: string[];
  svgGraphicType: string;
}

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  ruleCode: string;
  type: 
    | 'dynasty_mismatch' 
    | 'layer_order' 
    | 'formality_clash' 
    | 'social_status_clash' 
    | 'missing_essential_layer'
    | 'cultural_context_violation'
    | 'weather_clash'
    | 'structural_flaw';
  severity: IssueSeverity;
  title: string;
  message: string;
  historicalExplanation: string;
  citation?: string;
  garmentIds: string[];
  suggestedFix?: string;
}

export interface AuthenticityMetrics {
  overallScore: number; // 0 - 100
  dynastyPurity: number; // 0 - 100
  layerIntegrity: number; // 0 - 100
  formalityHarmony: number; // 0 - 100
  status: 'authentic' | 'advisory' | 'historically_invalid';
}

export interface RemixBalance {
  traditionalPercent: number; // 0 - 100
  modernPercent: number; // 0 - 100
  label: string; // e.g. "70% Cổ Điển - 30% Gen Z Remix"
}

export interface ValidationResult {
  isValid: boolean;
  metrics: AuthenticityMetrics;
  issues: ValidationIssue[];
  eraSummary: string;
  garmentCount: number;
  recommendations: string[];
  validationMode: ValidationMode;
  remixBalance: RemixBalance;
  colorHarmonyScore: number; // 0 - 100
  contextFitScore: number; // 0 - 100
}

export interface OutfitPreset {
  id: string;
  name: string;
  dynastyName: string;
  description: string;
  gender: GenderTarget;
  garmentIds: string[];
  presetType?: 'historical' | 'genz_remix';
  suggestedEvent?: EventType;
  suggestedWeather?: WeatherType;
}

export interface ImageAnalysisResult {
  identifiedGarments: Array<{
    name: string;
    dynastyEstimate: string;
    category: string;
    confidence: number;
    description: string;
  }>;
  dynastyAssessment: string;
  formalityAssessment: string;
  authenticityNotes: string;
  culturalObservations: string[];
  suggestedWardrobeIds: string[];
}

export interface SavedOutfitVariant {
  id: string;
  title: string;
  timestamp: number;
  garmentIds: string[];
  sceneId: string;
  eventType: EventType;
  weatherType: WeatherType;
  validationResult: ValidationResult;
}
