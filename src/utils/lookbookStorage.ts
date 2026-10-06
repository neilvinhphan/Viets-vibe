import { GARMENTS } from "../data/garments";
import { HISTORICAL_SCENES } from "../data/historicalScenes";
import type { Garment } from "../types";
import type { LookbookSnapshot } from "./lookbookSnapshot";

export interface LookbookEntry extends LookbookSnapshot {
  favorite: boolean;
  updatedAt: number;
}

export interface CollectionLoad {
  snapshots: LookbookEntry[];
  notice: string;
  blocked: boolean;
}

export const LOOKBOOK_STORAGE_KEY = "viet-phuc-remix.lookbook.v1";

const isObject = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value);

const isTime = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value > 0 &&
  value <= 8.64e15;

const isHex = (value: unknown): value is string =>
  typeof value === "string" &&
  /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);

function readGarment(value: unknown): Garment | null {
  if (!isObject(value)) return null;

  const base = GARMENTS.find((item) => item.id === value.id);

  if (
    !base ||
    !Array.isArray(value.citations) ||
    !value.citations.every((item) => typeof item === "string")
  ) {
    return null;
  }

  for (const [key, expected] of Object.entries(base)) {
    if (
      typeof expected === "string" &&
      (typeof value[key] !== "string" ||
        (value[key] as string).length > 20000)
    ) {
      return null;
    }

    if (
      typeof expected === "number" &&
      value[key] !== expected
    ) {
      return null;
    }
  }

  for (const key of [
    "category",
    "dynasty",
    "gender",
    "svgGraphicType",
  ] as const) {
    if (value[key] !== base[key]) return null;
  }

  if (!isHex(value.colorHex)) return null;

  for (const key of [
    "secondaryColorHex",
    "accentColorHex",
  ] as const) {
    if (value[key] !== undefined && !isHex(value[key])) {
      return null;
    }
  }

  if (
    value.patternType !== undefined &&
    typeof value.patternType !== "string"
  ) {
    return null;
  }

  const result = {
    ...base,
  } as unknown as Record<string, unknown>;

  for (const key of Object.keys(base)) {
    result[key] = value[key];
  }

  for (const key of [
    "secondaryColorHex",
    "accentColorHex",
    "patternType",
  ]) {
    if (value[key] !== undefined) {
      result[key] = value[key];
    }
  }

  result.citations = [...value.citations];

  return result as unknown as Garment;
}

function readEntry(value: unknown): LookbookEntry | null {
  if (
    !isObject(value) ||
    value.version !== 1 ||
    typeof value.id !== "string" ||
    !value.id.trim() ||
    value.id.length > 120 ||
    typeof value.title !== "string" ||
    !value.title.trim() ||
    value.title.length > 60 ||
    !isTime(value.createdAt) ||
    !isTime(value.updatedAt) ||
    typeof value.favorite !== "boolean" ||
    !isObject(value.scene) ||
    typeof value.scene.name !== "string" ||
    typeof value.scene.era !== "string" ||
    !HISTORICAL_SCENES.some(
      (scene) =>
        scene.id ===
        (value.scene as Record<string, unknown>).id,
    ) ||
    !["female", "male"].includes(String(value.gender)) ||
    !isHex(value.skinTone) ||
    !["subtle", "ultra_faint"].includes(
      String(value.sceneOpacity),
    ) ||
    !["le_chua", "concert", "ky_yeu", "cafe"].includes(
      String(value.eventType),
    ) ||
    !["nang_35", "mat_24", "lanh_16"].includes(
      String(value.weatherType),
    ) ||
    !["genz_remix", "strict_historical"].includes(
      String(value.validationMode),
    ) ||
    !Array.isArray(value.garments) ||
    !value.garments.length
  ) {
    return null;
  }

  const garments = value.garments.map(readGarment);

  if (
    garments.some((item) => !item) ||
    new Set(garments.map((item) => item!.id)).size !==
      garments.length
  ) {
    return null;
  }

  return {
    version: 1,
    id: value.id,
    title: value.title.trim(),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    favorite: value.favorite,
    garments: garments as Garment[],

    scene: {
      id: value.scene.id as string,
      name: value.scene.name,
      era: value.scene.era,
    },

    gender: value.gender as LookbookEntry["gender"],
    skinTone: value.skinTone,
    sceneOpacity:
      value.sceneOpacity as LookbookEntry["sceneOpacity"],
    eventType: value.eventType as LookbookEntry["eventType"],
    weatherType:
      value.weatherType as LookbookEntry["weatherType"],
    validationMode:
      value.validationMode as LookbookEntry["validationMode"],
  };
}

export function decodeLookbookCollection(
  raw: string | null,
): CollectionLoad {
  if (raw === null) {
    return {
      snapshots: [],
      notice: "",
      blocked: false,
    };
  }

  try {
    const data: unknown = JSON.parse(raw);

    if (
      !isObject(data) ||
      data.version !== 1 ||
      !Array.isArray(data.snapshots)
    ) {
      return {
        snapshots: [],
        notice:
          "Không đọc được định dạng bộ sưu tập. Dữ liệu hiện có được giữ nguyên.",
        blocked: true,
      };
    }

    const snapshots: LookbookEntry[] = [];
    const ids = new Set<string>();

    for (const value of data.snapshots) {
      const entry = readEntry(value);

      if (entry && !ids.has(entry.id)) {
        snapshots.push(entry);
        ids.add(entry.id);
      }
    }

    snapshots.sort((a, b) => b.createdAt - a.createdAt);

    const skipped = data.snapshots.length - snapshots.length;

    return {
      snapshots,
      notice: skipped
        ? `Đã bỏ qua ${skipped} bản phối có dữ liệu không hợp lệ.`
        : "",
      blocked: false,
    };
  } catch {
    return {
      snapshots: [],
      notice:
        "Dữ liệu bộ sưu tập không đọc được. Dữ liệu hiện có được giữ nguyên.",
      blocked: true,
    };
  }
}

export function loadLookbookCollection(): CollectionLoad {
  if (typeof window === "undefined") {
    return {
      snapshots: [],
      notice: "",
      blocked: false,
    };
  }

  try {
    return decodeLookbookCollection(
      window.localStorage.getItem(LOOKBOOK_STORAGE_KEY),
    );
  } catch {
    return {
      snapshots: [],
      notice: "Trình duyệt đang chặn truy cập bộ sưu tập.",
      blocked: true,
    };
  }
}

export function writeLookbookCollection(
  snapshots: LookbookEntry[],
): void {
  try {
    window.localStorage.setItem(
      LOOKBOOK_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        snapshots,
      }),
    );
  } catch {
    throw new Error(
      "Chưa lưu được thay đổi. Bộ nhớ trình duyệt có thể đã đầy hoặc đang bị chặn.",
    );
  }
}

export function validateLookbookTitle(value: string): string {
  const title = value.trim().replace(/\s+/g, " ");

  if (!title) {
    throw new Error("Hãy nhập tên bản phối.");
  }

  if (title.length > 60) {
    throw new Error("Tên bản phối tối đa 60 ký tự.");
  }

  return title;
}