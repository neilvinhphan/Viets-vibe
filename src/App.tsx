import React, { useState, useEffect, useMemo, useRef } from "react";
import { TryOnWebsiteLink } from "./components/TryOnWebsiteLink";
import {
  Garment,
  OutfitPreset,
  ValidationResult,
  GarmentCategory,
  EventType,
  WeatherType,
  ValidationMode,
} from "./types";
import {
  GARMENTS,
  OUTFIT_PRESETS,
  GALLERY_3D_TO_2D_MAP,
} from "./data/garments";
import { HISTORICAL_SCENES, HistoricalScene } from "./data/historicalScenes";
import { validateOutfit } from "./services/culturalValidationEngine";
import { getOutfitEra, ERA_LIGHTING_THEMES } from "./utils/eraLighting";
import { useOnClickOutside } from "./hooks/useOnClickOutside";
import { Avatar2D } from "./components/Avatar2D";
import { Wardrobe } from "./components/Wardrobe";
import { ValidationPanel } from "./components/ValidationPanel";
import { HistoricalInfoModal } from "./components/HistoricalInfoModal";
import { GeminiImageAnalyzerModal } from "./components/GeminiImageAnalyzerModal";
import { SceneBackground } from "./components/SceneBackground";
import { SceneSelector } from "./components/SceneSelector";
import { LookbookAndCompareModal } from "./components/LookbookAndCompareModal";
import type { ReferenceOutfitImage } from "./data/referenceOutfits";
import { LookbookPage } from "./components/LookbookPage";
import type { LookbookSnapshot } from "./utils/lookbookSnapshot";
import { useLookbookCollection } from "./hooks/useLookbookCollection";
import { IntroOnboardingModal } from "./components/IntroOnboardingModal";
import { VietPhucGallery } from "./components/VietPhucGallery";
import { zenSoundscape } from "./services/zenSoundscape";
import {
  Sparkles,
  Camera,
  RotateCcw,
  Share2,
  Check,
  Layers,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  Dices,
  Wand2,
  X,
  Sliders,
  Volume2,
  VolumeX,
  Send,
  Loader2,
  GitCompare,
  CircleHelp,
} from "lucide-react";

function VibePromptSection({
  isVibeLoading,
  onApplyVibe,
  onRandomRemix,
  equippedGarmentIds,
  onApplyPreset,
}: {
  isVibeLoading: boolean;
  onApplyVibe: (prompt?: string) => void;
  onRandomRemix: () => void;
  equippedGarmentIds: string[];
  onApplyPreset: (preset: OutfitPreset) => void;
}) {
  const [vibePrompt, setVibePrompt] = useState<string>("");

  return (
    <>
      <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#996515]" />✨ AI Phối Theo Vibe
          </span>
          <span className="text-[9.5px] text-amber-800/80 font-mono">
            Gemini 2.5 Flash
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={vibePrompt}
            onChange={(e) => setVibePrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onApplyVibe(vibePrompt);
            }}
            placeholder="VD: Đi concert trời mát, thích Áo Ngũ Thân..."
            className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-amber-300/80 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <button
            onClick={() => onApplyVibe(vibePrompt)}
            disabled={isVibeLoading}
            className="p-1.5 rounded-lg bg-[#996515] hover:bg-amber-800 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Gợi ý tổ hợp y phục theo vibe"
          >
            {isVibeLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* 1-Click Quick Vibe Chips */}
        <div className="flex flex-wrap gap-1 pt-1">
          {[
            {
              label: "🎸 Đi Concert",
              prompt:
                "Đi concert quẩy âm nhạc trời mát, phối Áo Ngũ Thân streetwear với jeans và tai nghe",
            },
            {
              label: "☕ Cafe Hoài Cổ",
              prompt:
                "Dạo phố cafe hoài cổ với Áo Giao Lĩnh Hậu Lê, kính râm Y2K và boots da",
            },
            {
              label: "🎓 Kỷ Yếu Tân Thời",
              prompt:
                "Chụp kỷ yếu tốt nghiệp với Áo Dài Tân Thời cách tân màu xanh pastel và sneaker",
            },
            {
              label: "⛩️ Lễ Chùa Thanh Tịnh",
              prompt:
                "Đi lễ chùa thanh tịnh trang nghiêm với Áo Tấc tay thụng ngọc bích và hài thêu",
            },
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => onApplyVibe(chip.prompt)}
              className="px-2 py-0.5 rounded-full bg-white hover:bg-amber-100/90 text-stone-700 hover:text-amber-950 border border-amber-200/60 text-[10px] transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Random Remix action */}
      <button
        onClick={onRandomRemix}
        className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs text-amber-950 hover:bg-amber-50/80 transition-colors group border border-stone-200/80"
      >
        <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 group-hover:scale-110 transition-transform">
          <Dices className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="font-semibold text-stone-900">
            Phối Ngẫu Nhiên (Remix)
          </div>
          <div className="text-[10px] text-stone-500">
            Thử nghiệm tổ hợp để kiểm định văn hóa
          </div>
        </div>
      </button>

      {/* Preset List */}
      <div className="pt-1">
        <div className="px-1 text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-1">
          Bộ sưu tập có sẵn:
        </div>

        <div className="space-y-1">
          {OUTFIT_PRESETS.map((preset) => {
            const isEquipped = preset.garmentIds.every((id) =>
              equippedGarmentIds.includes(id),
            );
            const isGenZ = preset.presetType === "genz_remix";
            return (
              <button
                key={preset.id}
                onClick={() => onApplyPreset(preset)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                  isEquipped
                    ? "bg-amber-50 text-amber-950 font-semibold border border-amber-200/80"
                    : "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                <div className="truncate pr-2">
                  <div className="flex items-center gap-1.5">
                    {isGenZ && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">
                        GEN Z
                      </span>
                    )}
                    <span className="truncate">{preset.name}</span>
                  </div>
                  <div className="text-[9.5px] text-stone-500 truncate">
                    {preset.dynastyName}
                  </div>
                </div>
                {isEquipped && (
                  <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [show3DDisclaimer, setShow3DDisclaimer] = useState(false);

  // 3D Showroom <-> 2D Gen Z Remix Studio 2-way mode
  const [activeView, setActiveView] = useState<
    "studio_2d" | "gallery_3d" | "lookbook"
  >("studio_2d");

  useEffect(() => {
    const is3DView = activeView === "gallery_3d";

    // Mỗi khi chuyển vào View 3D, LUÔN LUÔN bật Pop-up lên (Không cache)
    if (is3DView) {
      setShow3DDisclaimer(true);
    } else {
      // Tắt Pop-up đi nếu chuyển sang view khác (vd: quay lại 2D) để tránh lỗi đọng state
      setShow3DDisclaimer(false);
    }
  }, [activeView]);

  const handleAccept3DDisclaimer = () => {
    // Chỉ đơn giản là đóng modal, không lưu gì vào storage
    setShow3DDisclaimer(false);
  };
  // Start with default authentic preset or Gen Z remix
  const defaultPreset = OUTFIT_PRESETS[0];
  const [equippedGarmentIds, setEquippedGarmentIds] = useState<string[]>(
    defaultPreset.garmentIds,
  );
  const referenceOutfitKey = [...equippedGarmentIds].sort().join("|");
  const [referenceSelection, setReferenceSelection] = useState<{
    outfitKey: string;
    image: ReferenceOutfitImage;
  } | null>(null);
  useEffect(() => {
    setReferenceSelection(null);
  }, [referenceOutfitKey]);

  // Scene, Event, Weather & Validation Mode states
  const [activeScene, setActiveScene] = useState<HistoricalScene>(
    HISTORICAL_SCENES[0],
  );
  const [sceneOpacity, setSceneOpacity] = useState<"ultra_faint" | "subtle">(
    "subtle",
  );
  const [activeEvent, setActiveEvent] = useState<EventType>("concert");
  const [activeWeather, setActiveWeather] = useState<WeatherType>("mat_24");
  const [validationMode, setValidationMode] =
    useState<ValidationMode>("genz_remix");

  // Character customization state (Female/Male, Skin Tone)
  const [characterGender, setCharacterGender] = useState<"female" | "male">(
    "female",
  );
  const [characterSkinTone, setCharacterSkinTone] = useState<string>("#f6d8be");

  // First-impression Onboarding state
  const [isIntroActive, setIsIntroActive] = useState<boolean>(true);

  const [galleryTargetId, setGalleryTargetId] = useState<string>("overview");
  const {
    snapshots,
    storageNotice,
    selectedId,
    selectSnapshot,
    saveSnapshot,
    renameSnapshot,
    toggleFavorite,
    deleteSnapshot,
  } = useLookbookCollection();

  // Single exclusive active state for all popovers, menus, and modals
  // Possible values: 'remix' | 'tools' | 'character_customizer' | 'wardrobe' | 'validation' | 'lookbook' | 'gemini' | 'historical_info' | null
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [lookbookTab, setLookbookTab] = useState<"compare" | "reference">(
    "reference",
  );
  const openLookbookModal = (tab: "compare" | "reference" = "reference") => {
    setLookbookTab(tab);
    setActivePopover("lookbook");
  };
  const switchView = (view: "studio_2d" | "gallery_3d" | "lookbook") => {
    setActivePopover(null);
    setIsZenMode(false);
    setActiveView(view);
  };

  const [selectedGarmentForInfo, setSelectedGarmentForInfo] =
    useState<Garment | null>(null);

  // Split A/B comparison saved variant
  const [savedVariantA, setSavedVariantA] = useState<{
    garments: Garment[];
    validationResult: ValidationResult;
    scene: HistoricalScene;
    event: EventType;
    weather: WeatherType;
    timestamp: number;
  } | null>(null);

  // AI Vibe-to-outfit prompt state
  const [isVibeLoading, setIsVibeLoading] = useState<boolean>(false);
  const [vibeStatusMessage, setVibeStatusMessage] = useState<string | null>(
    null,
  );

  // Initial validation result
  const [validationResult, setValidationResult] = useState<ValidationResult>(
    () =>
      validateOutfit(defaultPreset.garmentIds, {
        validationMode: "genz_remix",
        sceneId: HISTORICAL_SCENES[0].id,
        eventType: "concert",
        weatherType: "mat_24",
      }),
  );

  // Derived booleans from the single activePopover state
  const isRemixMenuOpen = activePopover === "remix";
  const isToolsMenuOpen = activePopover === "tools";
  const isCharacterCustomizerOpen = activePopover === "character_customizer";
  const isWardrobeOpen = activePopover === "wardrobe";
  const isValidationModalOpen = activePopover === "validation";
  const isLookbookModalOpen = activePopover === "lookbook";
  const isGeminiModalOpen = activePopover === "gemini";
  const isHistoricalInfoOpen =
    activePopover === "historical_info" && selectedGarmentForInfo !== null;

  // DOM refs for click-outside detection
  const remixMenuRef = useRef<HTMLDivElement>(null);
  const remixBtnRef = useRef<HTMLButtonElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const toolsBtnRef = useRef<HTMLButtonElement>(null);

  // Click outside to dismiss header popovers
  useOnClickOutside(
    remixMenuRef,
    () => {
      if (activePopover === "remix") setActivePopover(null);
    },
    remixBtnRef,
  );

  useOnClickOutside(
    toolsMenuRef,
    () => {
      if (activePopover === "tools") setActivePopover(null);
    },
    toolsBtnRef,
  );

  const [wardrobeCategory, setWardrobeCategory] = useState<
    GarmentCategory | "all"
  >("all");
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [isZenAudioMuted, setIsZenAudioMuted] = useState<boolean>(() => {
    return localStorage.getItem("zen_soundscape_muted") === "true";
  });

  // Zen Soundscape: Plays soft, ambient traditional Vietnamese instruments (cầm, tranh)
  useEffect(() => {
    if (isZenMode && !isZenAudioMuted) {
      zenSoundscape.start();
    } else {
      zenSoundscape.stop();
    }
  }, [isZenMode, isZenAudioMuted]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      zenSoundscape.stop();
    };
  }, []);

  // Keyboard shortcut: Escape exits active popover or Zen Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activePopover !== null) {
          setActivePopover(null);
        } else if (isZenMode) {
          setIsZenMode(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePopover, isZenMode]);

  const handleToggleZenAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZenAudioMuted((prev) => {
      const next = !prev;
      localStorage.setItem("zen_soundscape_muted", String(next));
      return next;
    });
  };

  // Trigger Cultural Validation whenever equipped garments, mode, scene, event, or weather change
  useEffect(() => {
    const options = {
      validationMode,
      sceneId: activeScene.id,
      eventType: activeEvent,
      weatherType: activeWeather,
    };

    // Immediate client-side validation
    const clientResult = validateOutfit(equippedGarmentIds, options);
    setValidationResult(clientResult);

    // Sync with backend Express API
    fetch("/api/validate-outfit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        garmentIds: equippedGarmentIds,
        ...options,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.result) {
          setValidationResult(data.result);
        }
      })
      .catch((err) => {
        console.warn("Backend validation fallback to client engine:", err);
      });
  }, [
    equippedGarmentIds,
    validationMode,
    activeScene.id,
    activeEvent,
    activeWeather,
  ]);

  const equippedGarments = useMemo(() => {
    return equippedGarmentIds
      .map((id) => GARMENTS.find((g) => g.id === id))
      .filter((g): g is Garment => g !== undefined);
  }, [equippedGarmentIds]);

  // Dynamic ambient lighting theme based on the historical era of the equipped outfit
  const currentEra = useMemo(
    () => getOutfitEra(equippedGarments),
    [equippedGarments],
  );
  const eraLighting = ERA_LIGHTING_THEMES[currentEra];

  // Toggle equipping / unequipping a garment
  const handleToggleGarment = (garment: Garment) => {
    setEquippedGarmentIds((prev) => {
      if (prev.includes(garment.id)) {
        return prev.filter((id) => id !== garment.id);
      } else {
        let filtered = [...prev];
        if (
          ["robe", "outerwear", "bottom", "headwear", "footwear"].includes(
            garment.category,
          )
        ) {
          filtered = filtered.filter((id) => {
            const existing = GARMENTS.find((g) => g.id === id);
            return existing?.category !== garment.category;
          });
        }
        return [...filtered, garment.id];
      }
    });
  };

  const handleApplyPreset = (preset: OutfitPreset) => {
    setEquippedGarmentIds(preset.garmentIds);
    if (preset.suggestedEvent) setActiveEvent(preset.suggestedEvent);
    if (preset.suggestedWeather) setActiveWeather(preset.suggestedWeather);
    setActivePopover(null);
  };

  const handleGenderChange = (newGender: "female" | "male") => {
    setCharacterGender(newGender);

    setEquippedGarmentIds((prevIds) => {
      let updatedIds = [...prevIds];

      if (newGender === "male") {
        // 1. Swap female Five-panel tunic to male Five-panel tunic
        updatedIds = updatedIds.map((id) => {
          if (id === "ao_ngu_than_tay_chen_nu")
            return "ao_ngu_than_tay_chen_nam";
          return id;
        });

        // 2. Remove female-only undergarments and skirts without resetting rest of outfit
        const femaleOnlyToRemove = [
          "yem_do_co_tron",
          "yem_bach_hoang_gia",
          "chan_vay_ngan_genz",
        ];
        updatedIds = updatedIds.filter(
          (id) => !femaleOnlyToRemove.includes(id),
        );
      } else {
        // 1. Swap male Five-panel tunic to female Five-panel tunic
        updatedIds = updatedIds.map((id) => {
          if (id === "ao_ngu_than_tay_chen_nam")
            return "ao_ngu_than_tay_chen_nu";
          return id;
        });
      }

      // Preserve all unisex items (Jeans, Sneakers, Boots, Headwear, Accessories, Ao Dai) intact!
      return updatedIds;
    });
  };

  const handleRandomRemix = () => {
    const categoriesToPick = ["robe", "bottom", "footwear", "headwear"];
    const randomIds: string[] = [];

    categoriesToPick.forEach((cat) => {
      const itemsInCat = GARMENTS.filter((g) => g.category === cat);
      if (itemsInCat.length > 0) {
        const randomItem =
          itemsInCat[Math.floor(Math.random() * itemsInCat.length)];
        randomIds.push(randomItem.id);
      }
    });

    // 60% chance of adding an accessory
    const accessories = GARMENTS.filter((g) => g.category === "accessory");
    if (Math.random() > 0.4 && accessories.length > 0) {
      randomIds.push(
        accessories[Math.floor(Math.random() * accessories.length)].id,
      );
    }

    setEquippedGarmentIds(randomIds);
    setActivePopover(null);
  };

  const handleResetOutfit = () => {
    setEquippedGarmentIds([]);
  };

  const handleSaveCurrentAsVariantA = () => {
    setSavedVariantA({
      garments: [...equippedGarments],
      validationResult: { ...validationResult },
      scene: activeScene,
      event: activeEvent,
      weather: activeWeather,
      timestamp: Date.now(),
    });
  };

  const handleApplyVariantA = () => {
    if (savedVariantA) {
      setEquippedGarmentIds(savedVariantA.garments.map((g) => g.id));
      setActiveScene(savedVariantA.scene);
      setActiveEvent(savedVariantA.event);
      setActiveWeather(savedVariantA.weather);
    }
  };

  // AI Vibe-to-Outfit Handler
  const handleApplyVibe = async (customPrompt?: string) => {
    const promptToUse = (customPrompt || "").trim();
    if (!promptToUse) return;

    setIsVibeLoading(true);
    setVibeStatusMessage("Đang thiết kế bản phối theo vibe...");

    try {
      const res = await fetch("/api/vibe-to-outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptToUse }),
      });
      const data = await res.json();

      if (data.success) {
        if (Array.isArray(data.garmentIds) && data.garmentIds.length > 0) {
          setEquippedGarmentIds(data.garmentIds);
        }
        if (data.sceneId) {
          const matchedScene = HISTORICAL_SCENES.find(
            (s) => s.id === data.sceneId,
          );
          if (matchedScene) setActiveScene(matchedScene);
        }
        if (data.eventType) setActiveEvent(data.eventType);
        if (data.weatherType) setActiveWeather(data.weatherType);

        setActivePopover(null);
      }
    } catch (err) {
      console.warn("Vibe generation error:", err);
    } finally {
      setIsVibeLoading(false);
      setVibeStatusMessage(null);
    }
  };

  const handleApplyIdentifiedGarments = (garmentIds: string[]) => {
    const validIds = garmentIds.filter((id) =>
      GARMENTS.some((g) => g.id === id),
    );
    if (validIds.length > 0) {
      setEquippedGarmentIds(validIds);
    }
  };

  const handleApplyLookbookSnapshot = (snapshot: LookbookSnapshot) => {
    setEquippedGarmentIds(snapshot.garments.map((item) => item.id));
    const scene = HISTORICAL_SCENES.find(
      (item) => item.id === snapshot.scene.id,
    );
    if (scene) setActiveScene(scene);
    setSceneOpacity(snapshot.sceneOpacity);
    setCharacterGender(snapshot.gender);
    setCharacterSkinTone(snapshot.skinTone);
    setActiveEvent(snapshot.eventType);
    setActiveWeather(snapshot.weatherType);
    setValidationMode(snapshot.validationMode);
    switchView("studio_2d");
  };

  const handleEnterFromIntro = (view: "studio_2d" | "gallery_3d") => {
    setActivePopover(null);
    setIsZenMode(false);
    setGalleryTargetId("overview");
    setActiveView(view);
    setIsIntroActive(false);
  };

  const handleReplayIntro = () => {
    setActivePopover(null);
    setIsZenMode(false);
    setActiveView("studio_2d");
    setIsIntroActive(true);
  };

  // Two-way bridge: Seamlessly load garment & scene from 3D showroom into 2D studio
  const handleRemixFrom3D = (galleryId: string) => {
    const config = GALLERY_3D_TO_2D_MAP[galleryId];
    if (config) {
      setEquippedGarmentIds(config.garmentIds);
      setCharacterGender(config.gender);
      const targetScene = HISTORICAL_SCENES.find(
        (s) => s.id === config.sceneId,
      );
      if (targetScene) setActiveScene(targetScene);
    }
    setActiveView("studio_2d");
    zenSoundscape.playDanTranhPluck(587.33, undefined, 0.7);
  };

  const { metrics, issues, eraSummary } = validationResult;

  // Render floating status pill based on validation result
  const renderValidationStatusPill = () => {
    if (equippedGarments.length === 0) {
      return (
        <button
          id="floating-validation-pill"
          onClick={() =>
            setActivePopover((prev) =>
              prev === "validation" ? null : "validation",
            )
          }
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-stone-100 hover:bg-stone-200/80 border border-stone-200 text-xs font-medium text-stone-600 backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-2xs whitespace-nowrap shrink-0"
          title="Nhấp để xem động cơ kiểm định văn hóa"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-stone-500 shrink-0" />
          <span className="hidden sm:inline">Chưa Vận Y Phục</span>
          <span className="sm:hidden font-medium">Chưa Mặc</span>
        </button>
      );
    }

    if (metrics.status === "authentic") {
      return (
        <button
          id="floating-validation-pill"
          onClick={() =>
            setActivePopover((prev) =>
              prev === "validation" ? null : "validation",
            )
          }
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300/80 text-emerald-900 text-[11px] sm:text-xs font-medium backdrop-blur-md shadow-2xs transition-all hover:scale-105 active:scale-95 group whitespace-nowrap shrink-0"
          title="Nhấp để xem chi tiết kiểm định văn hóa & độ hài hòa màu sắc"
        >
          <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-royal text-[13px] font-semibold tracking-wide hidden sm:inline">
            {metrics.overallScore}%{" "}
            {validationMode === "genz_remix" ? "Đạt Chuẩn Remix" : "Chuẩn Sử"}
          </span>
          <span className="font-royal text-[11px] font-semibold sm:hidden">
            {metrics.overallScore}% Chuẩn
          </span>
          <span className="text-[10.5px] text-emerald-700/80 font-normal hidden md:inline">
            (Hài hòa: {validationResult.colorHarmonyScore}%)
          </span>
        </button>
      );
    }

    if (metrics.status === "advisory") {
      return (
        <button
          id="floating-validation-pill"
          onClick={() =>
            setActivePopover((prev) =>
              prev === "validation" ? null : "validation",
            )
          }
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full bg-amber-50 hover:bg-amber-100/90 border border-amber-300/80 text-amber-900 text-[11px] sm:text-xs font-medium backdrop-blur-md shadow-2xs transition-all hover:scale-105 active:scale-95 group whitespace-nowrap shrink-0"
          title="Nhấp để xem các khuyến nghị và khảo cứu"
        >
          <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="font-royal text-[13px] font-semibold tracking-wide hidden sm:inline">
            {metrics.overallScore}% Cần Khảo Cứu
          </span>
          <span className="font-royal text-[11px] font-semibold sm:hidden">
            {metrics.overallScore}% Lưu ý
          </span>
          <span className="text-[10.5px] text-amber-700/80 font-normal hidden md:inline">
            ({issues.length} lưu ý)
          </span>
        </button>
      );
    }

    return (
      <button
        id="floating-validation-pill"
        onClick={() =>
          setActivePopover((prev) =>
            prev === "validation" ? null : "validation",
          )
        }
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full bg-rose-50 hover:bg-rose-100/90 border border-rose-300/80 text-rose-900 text-[11px] sm:text-xs font-medium backdrop-blur-md shadow-2xs transition-all hover:scale-105 active:scale-95 group whitespace-nowrap shrink-0"
        title="Nhấp để xem vi phạm điển chế và hướng xử lý"
      >
        <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span className="font-royal text-[13px] font-semibold tracking-wide hidden sm:inline">
          {metrics.overallScore}% Sai Lệch Văn Hóa
        </span>
        <span className="font-royal text-[11px] font-semibold sm:hidden">
          {metrics.overallScore}% Lỗi
        </span>
        <span className="text-[10.5px] text-rose-700/80 font-normal hidden md:inline">
          ({issues.length} cảnh báo)
        </span>
      </button>
    );
  };

  return (
    <>
      <div
        inert={isIntroActive}
        className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col bg-[#faf8f5] text-stone-800 font-sans selection:bg-amber-100 selection:text-amber-900"
      >
        {/* Top Navbar */}
        <header
          className={`relative z-50 min-h-[54px] w-full shrink-0 bg-[#faf8f5] border-b border-stone-200/80 px-3.5 py-2.5 md:px-6 md:py-2 flex flex-wrap items-center justify-between gap-2 transition-all duration-500 transform ${activeView === "lookbook" ? "flex-wrap" : ""} ${
            isZenMode || isIntroActive
              ? "-translate-y-full opacity-0 pointer-events-none"
              : "translate-y-0 opacity-100"
          }`}
        >
          {/* Left: Branding & 2D/3D Mode Switcher */}
          <div className="contents md:flex md:items-center md:gap-3.5 whitespace-nowrap shrink-0">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <h1 className="text-base md:text-lg font-semibold font-royal tracking-wide text-stone-900 whitespace-nowrap">
                <span className="md:hidden">Việt Phục</span>
                <span className="hidden md:inline">Việt Vibe</span>
              </h1>
              <span className="hidden lg:inline text-xs font-serif italic text-stone-500">
                — Gen Z Studio
              </span>
            </div>

            {/* Mode Switcher: 2D Studio <-> 3D Showroom */}
            <div className="flex items-center p-0.5 rounded-full bg-stone-200/90 border border-stone-300/80 text-xs font-semibold shadow-2xs shrink-0">
              <button
                id="view-switch-2d-btn"
                type="button"
                onClick={() => switchView("studio_2d")}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs ${
                  activeView === "studio_2d"
                    ? "bg-white text-stone-900 shadow-2xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                title="Chuyển sang Bàn Phối Trang Phục 2D Gen Z"
              >
                <span className="hidden md:inline">🎨</span>
                <span className="hidden lg:inline">Bàn Phối 2D</span>
                <span className="lg:hidden">2D</span>
              </button>
              <button
                id="view-switch-3d-btn"
                type="button"
                onClick={() => {
                  setGalleryTargetId("overview");
                  switchView("gallery_3d");
                }}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs ${
                  activeView === "gallery_3d"
                    ? "bg-amber-500 text-stone-950 shadow-2xs font-bold ring-1 ring-amber-400"
                    : "text-stone-600 hover:text-stone-900 hover:text-amber-800"
                }`}
                title="Khám phá Hành Lang Di Sản 3D Không Gian 360°"
              >
                <span className="hidden md:inline">🏛️</span>
                <span className="hidden lg:inline">Hành Lang 3D</span>
                <span className="lg:hidden">3D</span>
              </button>
              <button
                id="view-switch-lookbook-btn"
                type="button"
                onClick={() => switchView("lookbook")}
                aria-pressed={activeView === "lookbook"}
                className={`flex items-center justify-center px-3 py-1.5 rounded-full transition-all text-xs ${
                  activeView === "lookbook"
                    ? "bg-white text-[#913d2f] shadow-2xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Lookbook
              </button>
            </div>
          </div>
          {activeView === "lookbook" && (
            <TryOnWebsiteLink onOpen={() => setActivePopover(null)} />
          )}

          {/* Center: Validation Status Pill */}

          {/* Center: Validation Status Pill */}
          {activeView !== "lookbook" && (
            <div className="hidden md:flex items-center justify-center shrink-0 md:mx-1">
              {renderValidationStatusPill()}
            </div>
          )}

          {/* Right: Quick actions cluster */}
          <div
            className={`${activeView === "lookbook" ? "hidden" : "flex"} items-center gap-1.5 md:gap-2 shrink-0`}
          >
            {/* Remix / Presets Dropdown (includes ✨ AI Vibe-to-Outfit input) */}
            <div className="relative">
              <button
                id="nav-remix-btn"
                ref={remixBtnRef}
                onClick={() =>
                  setActivePopover((prev) =>
                    prev === "remix" ? null : "remix",
                  )
                }
                className={`w-8 h-8 flex items-center justify-center p-0 md:w-auto md:h-auto md:px-3 md:py-1.5 rounded-full text-xs font-medium border transition-all shrink-0 ${
                  isRemixMenuOpen
                    ? "bg-stone-900 text-stone-50 border-stone-900"
                    : "bg-white hover:bg-stone-100/90 text-stone-700 border-stone-200/90 shadow-2xs"
                }`}
                title="Phối mẫu trang phục theo sử liệu, Gen Z Remix hoặc AI Vibe"
              >
                <Wand2 className="w-3.5 h-3.5 text-[#996515]" />
                <span className="hidden md:inline md:ml-1.5">Phối Mẫu</span>
                <ChevronDown className="w-3 h-3 text-stone-400 hidden md:inline md:ml-1" />
              </button>

              {/* Remix Popover Menu */}
              {isRemixMenuOpen && (
                <div
                  id="nav-remix-popover"
                  ref={remixMenuRef}
                  className="fixed right-2 top-[54px] sm:absolute sm:right-0 sm:top-full sm:mt-2 w-[calc(100vw-16px)] sm:w-88 max-w-[340px] sm:max-w-none bg-white border border-stone-200 shadow-xl ring-1 ring-stone-900/5 rounded-2xl p-3 z-50 animate-fadeIn text-stone-800 space-y-2.5 max-h-[85vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                    <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5 font-royal">
                      <Sparkles className="w-3.5 h-3.5 text-[#996515]" />
                      Phối Mẫu & Trợ Lý Vibe AI
                    </span>
                    <button
                      onClick={() => setActivePopover(null)}
                      className="text-stone-400 hover:text-stone-700 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* --- 1. AI VIBE-TO-OUTFIT INPUT --- */}
                  <VibePromptSection
                    isVibeLoading={isVibeLoading}
                    onApplyVibe={handleApplyVibe}
                    onRandomRemix={handleRandomRemix}
                    equippedGarmentIds={equippedGarmentIds}
                    onApplyPreset={handleApplyPreset}
                  />
                </div>
              )}
            </div>

            {/* Reset / Cởi Bỏ Toàn Bộ */}
            <div className="relative">
              <button
                onClick={handleResetOutfit}
                className="w-8 h-8 flex items-center justify-center p-0 rounded-full border bg-white hover:bg-rose-50 text-rose-600 border-rose-200/90 shadow-2xs transition-all shrink-0 hover:scale-105 active:scale-95"
                title="Cởi Bỏ Toàn Bộ"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Zen Mode Button (The Single Clean Zen Toggle - Hidden on mobile) */}
            <button
              id="nav-zen-mode-btn"
              onClick={() => {
                setActivePopover(null);
                setIsZenMode(true);
              }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white hover:bg-stone-100/90 text-stone-700 border-stone-200/90 shadow-2xs text-xs font-medium transition-all shrink-0"
              title="Chế độ Chiêm Ngưỡng (Zen Mode với Âm Điệu Cầm, Tranh)"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#996515]" />
              <span className="hidden sm:inline">Chiêm Ngưỡng</span>
            </button>

            {/* Reference images and outfit comparison */}
            <button
              id="nav-lookbook-share-btn"
              onClick={() => {
                openLookbookModal();
              }}
              className="w-8 h-8 flex items-center justify-center p-0 md:w-auto md:h-auto md:px-3.5 md:py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-semibold transition-all shadow-xs hover:scale-105 active:scale-95 shrink-0"
              title="Tìm ảnh mẫu & so sánh phương án"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline md:ml-1.5">Ảnh mẫu & A/B</span>
            </button>
          </div>
        </header>

        {/* Mobile Validation Status Pill */}
        {activeView !== "lookbook" && (
          <div className="fixed bottom-[104px] left-1/2 -translate-x-1/2 z-[60] flex md:hidden items-center justify-center shrink-0">
            {renderValidationStatusPill()}
          </div>
        )}

        {/* Transparent backdrop for dismissing dropdown popovers when clicking outside */}
        {(isRemixMenuOpen || isToolsMenuOpen) && (
          <div
            id="popover-dismiss-backdrop"
            className="fixed inset-0 z-40 bg-transparent cursor-default"
            onClick={() => setActivePopover(null)}
          />
        )}

        {/* Main Stage Workspace: 2D Studio vs 3D Heritage Gallery */}
        {activeView === "lookbook" ? (
          <LookbookPage
            equippedGarments={equippedGarments}
            activeScene={activeScene}
            sceneOpacity={sceneOpacity}
            gender={characterGender}
            skinTone={characterSkinTone}
            activeEvent={activeEvent}
            activeWeather={activeWeather}
            validationMode={validationMode}
            snapshots={snapshots}
            storageNotice={storageNotice}
            selectedId={selectedId}
            onSelectSnapshot={selectSnapshot}
            onSaveSnapshot={saveSnapshot}
            onRenameSnapshot={renameSnapshot}
            onToggleFavorite={toggleFavorite}
            onDeleteSnapshot={deleteSnapshot}
            onApplySnapshot={handleApplyLookbookSnapshot}
            onBackToStudio={() => switchView("studio_2d")}
            onOpenOutfitCard={() => openLookbookModal()}
          />
        ) : activeView === "gallery_3d" ? (
          <main className="flex-1 min-h-0 relative overflow-hidden z-10 w-full bg-[#120c09]">
            <VietPhucGallery
              initialGarmentId={galleryTargetId}
              onBackToStudio={() => setActiveView("studio_2d")}
              onRemixGarment={handleRemixFrom3D}
            />
          </main>
        ) : (
          <main
            onClick={() => {
              if (activePopover !== null) setActivePopover(null);
              if (isZenMode) setIsZenMode(false);
            }}
            style={{
              backgroundColor: eraLighting.backgroundColor,
            }}
            className={`studio-stage flex-1 min-h-0 relative overflow-hidden z-10 w-full flex items-center justify-center transition-colors duration-700 ease-out ${
              isZenMode ? "cursor-pointer" : ""
            }`}
          >
            {/* Dynamic Background Radial Lighting */}
            <div
              id="era-radial-lighting-primary"
              className="absolute inset-0 pointer-events-none transition-all duration-700 ease-out"
              style={{
                background: `radial-gradient(circle at 50% 45%, ${eraLighting.primaryGlow}, transparent 65%)`,
              }}
            />

            <div
              id="era-radial-lighting-secondary"
              className="absolute inset-0 pointer-events-none transition-all duration-700 ease-out"
              style={{
                background: `radial-gradient(ellipse at 50% 68%, ${eraLighting.secondaryGlow}, transparent 78%)`,
              }}
            />

            <div
              id="era-radial-lighting-mist"
              className="absolute inset-0 pointer-events-none transition-all duration-700 ease-out"
              style={{
                background: `radial-gradient(circle at 50% 20%, ${eraLighting.ambientMist}, transparent 55%)`,
              }}
            />

            {/* --- MOUNTED SCENE BACKGROUND (MODULE BỐI CẢNH ĐỊA PHƯƠNG) --- */}
            <SceneBackground scene={activeScene} opacityLevel={sceneOpacity} />

            {/* --- MOUNTED SCENE SELECTOR (BỐI CẢNH, SỰ KIỆN, THỜI TIẾT) --- */}
            <SceneSelector
              scenes={HISTORICAL_SCENES}
              activeScene={activeScene}
              opacityLevel={sceneOpacity}
              onSelectScene={(scene) => setActiveScene(scene)}
              onToggleOpacityLevel={() =>
                setSceneOpacity((prev) =>
                  prev === "ultra_faint" ? "subtle" : "ultra_faint",
                )
              }
              activeEvent={activeEvent}
              onSelectEvent={(ev) => setActiveEvent(ev)}
              activeWeather={activeWeather}
              onSelectWeather={(w) => setActiveWeather(w)}
              isZenMode={isZenMode}
              activePopover={activePopover}
              isIntroActive={isIntroActive}
            />

            {/* Subtle Zen Mode Overlay with Audio Toggle & Exit Hint */}
            {isZenMode && (
              <div
                id="zen-mode-overlay"
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-3.5 sm:px-4 py-2 rounded-full bg-stone-900/90 backdrop-blur-md border border-stone-700/70 text-stone-200 shadow-xl select-none animate-fadeIn"
              >
                <button
                  id="zen-audio-toggle-btn"
                  onClick={handleToggleZenAudio}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    !isZenAudioMuted
                      ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40"
                      : "bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700"
                  }`}
                  title={
                    isZenAudioMuted
                      ? "Bật âm thanh thiền (Đàn Cầm, Đàn Tranh)"
                      : "Tắt âm thanh thiền"
                  }
                >
                  {!isZenAudioMuted ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
                      <span className="font-serif italic text-[11px]">
                        Cầm • Tranh
                      </span>
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
                      </span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="font-serif italic text-[11px]">
                        Tắt âm
                      </span>
                    </>
                  )}
                </button>

                <span className="w-px h-3.5 bg-stone-700 shrink-0" />

                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-800/80 border border-stone-700 text-[11px] text-stone-300">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${eraLighting.badgeDot}`}
                  />
                  <span className="font-royal">{activeScene.name}</span>
                  <span className="text-stone-500">•</span>
                  <span className="font-serif italic text-stone-300">
                    {activeEvent.toUpperCase()}
                  </span>
                </div>

                <span className="hidden sm:inline w-px h-3.5 bg-stone-700 shrink-0" />

                <div className="text-[11px] text-stone-300 font-sans flex items-center gap-1.5 whitespace-nowrap">
                  <span className="hidden sm:inline">
                    Nhấp phông nền hoặc bấm
                  </span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/15 font-mono text-[10px] text-white">
                    Esc
                  </kbd>
                  <span>để trở về</span>
                </div>
              </div>
            )}

            {/* 2D Vector Avatar Canvas with Exploded View & Mobile Dock */}
            <Avatar2D
              equippedGarments={equippedGarments}
              eraTheme={eraLighting}
              isCustomizerOpen={isCharacterCustomizerOpen}
              onToggleCustomizer={() =>
                setActivePopover((prev) =>
                  prev === "character_customizer"
                    ? null
                    : "character_customizer",
                )
              }
              onCloseCustomizer={() => {
                if (activePopover === "character_customizer")
                  setActivePopover(null);
              }}
              gender={characterGender}
              onGenderChange={handleGenderChange}
              skinTone={characterSkinTone}
              onSkinToneChange={setCharacterSkinTone}
              onGarmentClick={(garment) => {
                setSelectedGarmentForInfo(garment);
                setActivePopover("historical_info");
              }}
              onRemoveGarment={(id) =>
                setEquippedGarmentIds((prev) => prev.filter((x) => x !== id))
              }
              onSelectCategoryForWardrobe={(cat) => {
                setWardrobeCategory(cat);
                setActivePopover("wardrobe");
              }}
              isZenMode={isZenMode}
              onToggleZenMode={() => setIsZenMode((prev) => !prev)}
              isIntroActive={isIntroActive}
            />
          </main>
        )}

        {/* Wardrobe Drawer */}
        {isWardrobeOpen && (
          <>
            <div
              id="wardrobe-backdrop"
              className="fixed inset-0 z-60 bg-stone-900/30 backdrop-blur-xs transition-opacity animate-fadeIn"
              onClick={() => setActivePopover(null)}
            />

            <aside
              id="wardrobe-drawer-container"
              className="fixed top-0 left-0 bottom-0 z-[70] w-full sm:w-[460px] bg-[#faf8f5] shadow-2xl border-r border-stone-200/90 flex flex-col animate-slide-left text-stone-800"
            >
              <Wardrobe
                garments={GARMENTS}
                presets={OUTFIT_PRESETS}
                equippedGarmentIds={equippedGarmentIds}
                initialCategory={wardrobeCategory}
                onToggleGarment={handleToggleGarment}
                onInspectGarment={(garment) => {
                  setSelectedGarmentForInfo(garment);
                  setActivePopover("historical_info");
                }}
                onApplyPreset={handleApplyPreset}
                onClose={() => setActivePopover(null)}
              />
            </aside>
          </>
        )}

        {/* Cultural Validation Modal */}
        {isValidationModalOpen && (
          <div
            id="validation-modal-overlay"
            className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-stone-900/40 backdrop-blur-xs animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget) setActivePopover(null);
            }}
          >
            <div className="w-full max-w-2xl max-h-[88vh] bg-[#faf8f5] border border-stone-200/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn text-stone-800">
              <ValidationPanel
                validationResult={validationResult}
                equippedGarments={equippedGarments}
                validationMode={validationMode}
                onToggleValidationMode={(mode) => setValidationMode(mode)}
                onInspectGarmentById={(id) => {
                  const g = GARMENTS.find((item) => item.id === id);
                  if (g) {
                    setSelectedGarmentForInfo(g);
                    setActivePopover("historical_info");
                  }
                }}
                onClose={() => setActivePopover(null)}
              />
            </div>
          </div>
        )}

        {/* Historical Info Card Modal */}
        {isHistoricalInfoOpen && selectedGarmentForInfo && (
          <HistoricalInfoModal
            garment={selectedGarmentForInfo}
            isEquipped={equippedGarmentIds.includes(selectedGarmentForInfo.id)}
            onClose={() => {
              setSelectedGarmentForInfo(null);
              setActivePopover(null);
            }}
            onToggleEquip={handleToggleGarment}
            onInspect3D={(galleryId) => {
              setGalleryTargetId(galleryId);
              setActiveView("gallery_3d");
              setSelectedGarmentForInfo(null);
              setActivePopover(null);
            }}
          />
        )}

        {/* Reference images and split A/B comparison modal */}
        <LookbookAndCompareModal
          isOpen={isLookbookModalOpen}
          initialTab={lookbookTab}
          onClose={() => setActivePopover(null)}
          equippedGarments={equippedGarments}
          validationResult={validationResult}
          activeScene={activeScene}
          activeEvent={activeEvent}
          activeWeather={activeWeather}
          savedVariantA={savedVariantA}
          onSaveCurrentAsVariantA={handleSaveCurrentAsVariantA}
          onApplyVariantA={handleApplyVariantA}
          selectedReferenceImage={
            referenceSelection?.outfitKey === referenceOutfitKey
              ? referenceSelection.image
              : null
          }
          onSelectReferenceImage={(image) =>
            setReferenceSelection({ outfitKey: referenceOutfitKey, image })
          }
        />

        {/* Gemini AI Image Understanding Modal */}
        <GeminiImageAnalyzerModal
          isOpen={isGeminiModalOpen}
          onClose={() => setActivePopover(null)}
          onApplyIdentifiedGarments={handleApplyIdentifiedGarments}
        />

        {/* 2. Pop-up Welcome Cho Màn Hình 3D (Luôn hiện mỗi lần vào) */}
        {show3DDisclaimer && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm transition-opacity">
            <div className="bg-[#fcfaf8] max-w-md w-full rounded-2xl shadow-2xl overflow-hidden border border-amber-900/10 animate-in fade-in zoom-in duration-300">
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-6 h-6 text-amber-700"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-amber-950 mb-2 font-serif">
                  Lưu ý trước khi trải nghiệm 3D
                </h3>
                <p className="text-sm text-stone-600 mb-6 leading-relaxed">
                  Các mô hình 3D trong Hành lang được thiết kế nhằm{" "}
                  <strong>minh họa phom dáng (proxy)</strong> cho bản phối 2D.
                  Các chi tiết hoa văn, tỷ lệ viền hoặc chất liệu có thể chứa
                  sai lệch so với cổ phục thực tế và{" "}
                  <strong>chưa qua giám định chuyên môn</strong>.
                </p>
                <button
                  onClick={handleAccept3DDisclaimer}
                  className="w-full py-3 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-medium transition-colors shadow-md pointer-events-auto"
                >
                  Tôi đã hiểu và Tiến vào Hành lang
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {isIntroActive && (
        <IntroOnboardingModal
          onEnterStudio={() => handleEnterFromIntro("studio_2d")}
          onEnter3D={() => handleEnterFromIntro("gallery_3d")}
        />
      )}
    </>
  );
}
