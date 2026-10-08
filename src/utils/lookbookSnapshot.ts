import type {
  EventType,
  Garment,
  ValidationMode,
  WeatherType,
} from "../types";

import type { HistoricalScene } from "../data/historicalScenes";

export interface LookbookSnapshot {
  version: 1;
  id: string;
  title: string;
  createdAt: number;
  previewImage?: string;
  garments: Garment[];

  scene: Pick<HistoricalScene, "id" | "name" | "era">;

  sceneOpacity: "ultra_faint" | "subtle";
  gender: "female" | "male";
  skinTone: string;
  eventType: EventType;
  weatherType: WeatherType;
  validationMode: ValidationMode;
}

export interface SnapshotInput {
  title: string;
  garments: Garment[];
  scene: HistoricalScene;
  sceneOpacity: LookbookSnapshot["sceneOpacity"];
  gender: LookbookSnapshot["gender"];
  skinTone: string;
  eventType: EventType;
  weatherType: WeatherType;
  validationMode: ValidationMode;
}

export function getLookbookHeading(garments: Garment[]) {
  const imperial =
    garments.some((item) => item.id === "khan_van_hoang_gia") &&
    garments.some((item) => item.id.includes("nhat_binh"));

  const garment =
    garments.find((item) => item.category === "outerwear") ??
    garments.find((item) => item.category === "robe");

  return {
    title: imperial
      ? "Hoàng kim"
      : garment?.name.split("(")[0].trim() || "Dấu ấn",

    subtitle: imperial
      ? "chốn cung đình."
      : "của riêng bạn.",
  };
}

export function createLookbookSnapshot(
  input: SnapshotInput,
): LookbookSnapshot {
  const title = input.title.trim().replace(/\s+/g, " ");

  if (!title) {
    throw new Error("Hãy nhập tên bản phối.");
  }

  if (title.length > 60) {
    throw new Error("Tên bản phối tối đa 60 ký tự.");
  }

  if (!input.garments.length) {
    throw new Error(
      "Hãy chọn ít nhất một món trang phục trong Studio.",
    );
  }

  return {
    version: 1,

    id:
      globalThis.crypto?.randomUUID?.() ??
      `look-${Date.now()}-${Math.random().toString(36).slice(2)}`,

    title,
    createdAt: Date.now(),

    garments: input.garments.map((item) => ({
      ...item,
      citations: [...item.citations],
    })),

    scene: {
      id: input.scene.id,
      name: input.scene.name,
      era: input.scene.era,
    },

    sceneOpacity: input.sceneOpacity,
    gender: input.gender,
    skinTone: input.skinTone,
    eventType: input.eventType,
    weatherType: input.weatherType,
    validationMode: input.validationMode,
  };
}