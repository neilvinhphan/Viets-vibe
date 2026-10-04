import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Landmark, 
  Sun, 
  CloudSun, 
  Snowflake, 
  Music, 
  Coffee, 
  GraduationCap, 
  Building2, 
  ChevronDown,
  Check
} from 'lucide-react';
import { HistoricalScene } from '../data/historicalScenes';
import { EventType, WeatherType } from '../types';
import { useOnClickOutside } from '../hooks/useOnClickOutside';

export interface SceneSelectorProps {
  scenes: HistoricalScene[];
  activeScene: HistoricalScene;
  opacityLevel: 'ultra_faint' | 'subtle';
  onSelectScene: (scene: HistoricalScene) => void;
  onToggleOpacityLevel: () => void;
  activeEvent: EventType;
  onSelectEvent: (event: EventType) => void;
  activeWeather: WeatherType;
  onSelectWeather: (weather: WeatherType) => void;
  isZenMode?: boolean;
  activePopover?: string | null;
  isIntroActive?: boolean;
}

export const EVENTS_CONFIG: Array<{
  id: EventType;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    id: 'le_chua',
    label: 'Đi Lễ Chùa / Di Tích',
    shortLabel: 'Lễ Chùa',
    icon: Building2,
    description: 'Yêu cầu trang nghiêm, tôn kính, váy/quần dài quá gối',
  },
  {
    id: 'concert',
    label: 'Đi Concert Âm Nhạc',
    shortLabel: 'Concert',
    icon: Music,
    description: 'Bùng nổ phong cách Streetwear Gen Z Remix năng động',
  },
  {
    id: 'ky_yeu',
    label: 'Chụp Kỷ Yếu',
    shortLabel: 'Kỷ Yếu',
    icon: GraduationCap,
    description: 'Thanh lịch lưu giữ thanh xuân trường lớp với tà áo truyền thống',
  },
  {
    id: 'cafe',
    label: 'Dạo Phố Cafe',
    shortLabel: 'Phố Cafe',
    icon: Coffee,
    description: 'Thoải mái, phóng khoáng, chụp ảnh check-in nghệ thuật',
  },
];

export const WEATHER_CONFIG: Array<{
  id: WeatherType;
  label: string;
  shortLabel: string;
  temp: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}> = [
  {
    id: 'nang_35',
    label: 'Nắng 35°C',
    shortLabel: '35°C',
    temp: 'Nắng gắt hè',
    icon: Sun,
    colorClass: 'text-amber-500',
  },
  {
    id: 'mat_24',
    label: 'Mát 24°C',
    shortLabel: '24°C',
    temp: 'Tiết thu mát',
    icon: CloudSun,
    colorClass: 'text-sky-500',
  },
  {
    id: 'lanh_16',
    label: 'Se Lạnh 16°C',
    shortLabel: '16°C',
    temp: 'Gió đông lạnh',
    icon: Snowflake,
    colorClass: 'text-indigo-500',
  },
];

export const SceneSelector: React.FC<SceneSelectorProps> = ({
  scenes,
  activeScene,
  opacityLevel,
  onSelectScene,
  onToggleOpacityLevel,
  activeEvent,
  onSelectEvent,
  activeWeather,
  onSelectWeather,
  isZenMode = false,
  activePopover,
  isIntroActive = false,
}) => {
  const [isSceneDropdownOpen, setIsSceneDropdownOpen] = useState(false);
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const [isWeatherDropdownOpen, setIsWeatherDropdownOpen] = useState(false);

  // Automatically close all SceneSelector dropdowns when another menu is opened
  useEffect(() => {
    if (activePopover) {
      setIsSceneDropdownOpen(false);
      setIsEventDropdownOpen(false);
      setIsWeatherDropdownOpen(false);
    }
  }, [activePopover]);

  const sceneDropdownRef = useRef<HTMLDivElement>(null);
  const eventDropdownRef = useRef<HTMLDivElement>(null);
  const weatherDropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(sceneDropdownRef, () => setIsSceneDropdownOpen(false));
  useOnClickOutside(eventDropdownRef, () => setIsEventDropdownOpen(false));
  useOnClickOutside(weatherDropdownRef, () => setIsWeatherDropdownOpen(false));

  const currentIndex = scenes.findIndex(s => s.id === activeScene.id);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIndex = (currentIndex - 1 + scenes.length) % scenes.length;
    onSelectScene(scenes[prevIndex]);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIndex = (currentIndex + 1) % scenes.length;
    onSelectScene(scenes[nextIndex]);
  };

  const currentEventConfig = EVENTS_CONFIG.find(e => e.id === activeEvent) || EVENTS_CONFIG[0];
  const currentWeatherConfig = WEATHER_CONFIG.find(w => w.id === activeWeather) || WEATHER_CONFIG[1];

  const EventIcon = currentEventConfig.icon;
  const WeatherIcon = currentWeatherConfig.icon;

  return (
    <div
      id="scene-selector-carousel"
      onClick={(e) => e.stopPropagation()}
      className={`absolute top-2.5 sm:top-4 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center transition-all duration-500 select-none w-full max-w-[calc(100vw-16px)] sm:w-auto px-2 ${
        isZenMode || isIntroActive ? 'opacity-0 pointer-events-none' : 'opacity-95 hover:opacity-100'
      }`}
    >
      <div className="inline-flex items-center gap-1 sm:gap-1.5 p-1 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-stone-200/90 shadow-xs text-xs text-stone-700 transition-all duration-300 max-w-full overflow-visible whitespace-nowrap">
        {/* --- 1. LOCAL HERITAGE SCENE SELECTION --- */}
        <div className="relative" ref={sceneDropdownRef}>
          <div className="inline-flex items-center">
            {/* Prev */}
            <button
              id="scene-prev-btn"
              onClick={handlePrev}
              className="hidden sm:inline-flex p-1 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
              title="Bối cảnh di tích trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Scene Name and Dropdown Trigger */}
            <button
              id="scene-cycle-btn"
              onClick={() => {
                setIsSceneDropdownOpen(prev => !prev);
                setIsEventDropdownOpen(false);
                setIsWeatherDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full hover:bg-stone-100 transition-colors text-left group"
              title={`${activeScene.subtitle} - Bấm để chọn danh sách 6 bối cảnh`}
            >
              <Landmark className="w-3.5 h-3.5 text-[#996515] shrink-0" />
              <span className="font-royal font-semibold text-[11.5px] sm:text-[12.5px] tracking-wide text-stone-900 group-hover:text-[#996515] transition-colors max-w-[105px] sm:max-w-none truncate inline-block">
                {activeScene.name}
              </span>
              <ChevronDown className="w-3 h-3 text-stone-400 group-hover:text-stone-700" />
            </button>

            {/* Next */}
            <button
              id="scene-next-btn"
              onClick={handleNext}
              className="hidden sm:inline-flex p-1 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
              title="Bối cảnh di tích tiếp theo"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scene Dropdown Menu */}
          {isSceneDropdownOpen && (
            <div className="fixed sm:absolute left-3 right-3 sm:left-0 sm:right-auto top-[104px] sm:top-full sm:mt-2 w-auto sm:w-72 bg-white border border-stone-200 shadow-xl ring-1 ring-black/5 rounded-2xl p-2 z-[60] animate-fadeIn text-stone-800">
              <div className="px-2.5 py-1 text-[11px] font-semibold text-stone-500 uppercase tracking-wider border-b border-stone-100 mb-1">
                6 Bối Cảnh Địa Phương & Lịch Sử
              </div>
              <div className="space-y-0.5 max-h-[60vh] sm:max-h-none overflow-y-auto sm:overflow-visible">
                {scenes.map(s => {
                  const isSelected = s.id === activeScene.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        onSelectScene(s);
                        setIsSceneDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                        isSelected
                          ? 'bg-amber-50 text-amber-950 font-medium border border-amber-200/80'
                          : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                          <Landmark className="w-3 h-3 text-[#996515]" />
                          {s.name}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate max-w-[200px]">
                          {s.era} • {s.subtitle}
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <span className="w-px h-3.5 bg-stone-200 shrink-0" />

        {/* --- 2. EVENT SELECTOR (SỰ KIỆN) --- */}
        <div className="relative" ref={eventDropdownRef}>
          <button
            id="event-selector-btn"
            onClick={() => {
              setIsEventDropdownOpen(prev => !prev);
              setIsSceneDropdownOpen(false);
              setIsWeatherDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full hover:bg-stone-100 transition-colors text-stone-700 group"
            title="Chọn bối cảnh sự kiện thực tế"
          >
            <EventIcon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="text-[11px] sm:text-[12px] font-medium text-stone-800 whitespace-nowrap sm:hidden">
              {currentEventConfig.shortLabel}
            </span>
            <span className="text-[11px] sm:text-[12px] font-medium text-stone-800 whitespace-nowrap hidden sm:inline">
              {currentEventConfig.label}
            </span>
            <ChevronDown className="w-3 h-3 text-stone-400 group-hover:text-stone-700" />
          </button>

          {isEventDropdownOpen && (
            <div className="fixed sm:absolute left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto top-[104px] sm:top-full sm:mt-2 w-auto sm:w-64 bg-white border border-stone-200 shadow-xl ring-1 ring-black/5 rounded-2xl p-2 z-[60] animate-fadeIn text-stone-800">
              <div className="px-2.5 py-1 text-[11px] font-semibold text-stone-500 uppercase tracking-wider border-b border-stone-100 mb-1">
                Ngữ Cảnh Sự Kiện
              </div>
              <div className="space-y-0.5">
                {EVENTS_CONFIG.map(ev => {
                  const isSelected = ev.id === activeEvent;
                  const Icon = ev.icon;
                  return (
                    <button
                      key={ev.id}
                      onClick={() => {
                        onSelectEvent(ev.id);
                        setIsEventDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                        isSelected
                          ? 'bg-amber-50 text-amber-950 font-medium border border-amber-200/80'
                          : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#996515]" />
                        <div>
                          <div className="font-semibold text-stone-900">{ev.label}</div>
                          <div className="text-[10px] text-stone-500">{ev.description}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <span className="w-px h-3.5 bg-stone-200 shrink-0" />

        {/* --- 3. WEATHER SELECTOR (THỜI TIẾT) --- */}
        <div className="relative" ref={weatherDropdownRef}>
          <button
            id="weather-selector-btn"
            onClick={() => {
              setIsWeatherDropdownOpen(prev => !prev);
              setIsSceneDropdownOpen(false);
              setIsEventDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full hover:bg-stone-100 transition-colors text-stone-700 group"
            title="Chọn điều kiện thời tiết"
          >
            <WeatherIcon className={`w-3.5 h-3.5 ${currentWeatherConfig.colorClass} shrink-0`} />
            <span className="text-[11px] sm:text-[12px] font-medium text-stone-800 whitespace-nowrap sm:hidden">
              {currentWeatherConfig.shortLabel}
            </span>
            <span className="text-[11px] sm:text-[12px] font-medium text-stone-800 whitespace-nowrap hidden sm:inline">
              {currentWeatherConfig.label}
            </span>
            <ChevronDown className="w-3 h-3 text-stone-400 group-hover:text-stone-700" />
          </button>

          {isWeatherDropdownOpen && (
            <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[104px] sm:top-full sm:mt-2 w-auto sm:w-56 bg-white border border-stone-200 shadow-xl ring-1 ring-black/5 rounded-2xl p-2 z-[60] animate-fadeIn text-stone-800">
              <div className="px-2.5 py-1 text-[11px] font-semibold text-stone-500 uppercase tracking-wider border-b border-stone-100 mb-1">
                Thời Tiết & Khí Hậu
              </div>
              <div className="space-y-0.5">
                {WEATHER_CONFIG.map(w => {
                  const isSelected = w.id === activeWeather;
                  const Icon = w.icon;
                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        onSelectWeather(w.id);
                        setIsWeatherDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                        isSelected
                          ? 'bg-amber-50 text-amber-950 font-medium border border-amber-200/80'
                          : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${w.colorClass}`} />
                        <div>
                          <div className="font-semibold text-stone-900">{w.label}</div>
                          <div className="text-[10px] text-stone-500">{w.temp}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Separator - hidden on mobile */}
        <span className="hidden sm:inline-block w-px h-3.5 bg-stone-200 shrink-0" />

        {/* --- 4. WATERMARK OPACITY TOGGLE --- */}
        <button
          id="scene-opacity-toggle-btn"
          onClick={e => {
            e.stopPropagation();
            onToggleOpacityLevel();
          }}
          className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono tracking-tight text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
          title={`Độ mờ thủy ấn bối cảnh: ${opacityLevel === 'ultra_faint' ? '5% (Siêu mờ)' : '10% (Nét phác)'} - Nhấp để chuyển`}
        >
          {opacityLevel === 'ultra_faint' ? '5%' : '10%'}
        </button>
      </div>
    </div>
  );
};
