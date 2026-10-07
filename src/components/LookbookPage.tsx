import React, { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  Layers,
  Palette,
  Share2,
  X,
} from "lucide-react";
import { Garment } from "../types";
import { HistoricalScene } from "../data/historicalScenes";
import { Avatar2D } from "./Avatar2D";
import {
  getOutfitEra,
  ERA_LIGHTING_THEMES,
} from "../utils/eraLighting";
import "./LookbookPage.css";

interface LookbookPageProps {
  equippedGarments: Garment[];
  activeScene: HistoricalScene;
  gender: "female" | "male";
  skinTone: string;
  onBackToStudio: () => void;
  onOpenOutfitCard: () => void;
}

type Popup = "details" | "collection" | null;

const CATEGORY_NAMES: Record<Garment["category"], string> = {
  headwear: "Khăn mũ",
  undergarment: "Lớp trong",
  robe: "Áo chính",
  outerwear: "Áo khoác",
  bottom: "Quần thường",
  footwear: "Hài guốc",
  accessory: "Phụ kiện",
};

export const LookbookPage: React.FC<LookbookPageProps> = ({
  equippedGarments,
  activeScene,
  gender,
  skinTone,
  onBackToStudio,
  onOpenOutfitCard,
}) => {
  const [popup, setPopup] = useState<Popup>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const popupTrigger = useRef<HTMLElement | null>(null);

  const theme = ERA_LIGHTING_THEMES[getOutfitEra(equippedGarments)];

  const palette = [
    ...new Map(
      equippedGarments.map((item) => [item.colorHex, item]),
    ).values(),
  ].slice(0, 4);

  const keyGarment =
    equippedGarments.find((item) => item.category === "outerwear") ??
    equippedGarments.find((item) => item.category === "robe");

  const isImperialOutfit =
    equippedGarments.some(
      (item) => item.id === "khan_van_hoang_gia",
    ) &&
    equippedGarments.some((item) => item.id.includes("nhat_binh"));

  const title = isImperialOutfit
    ? "Hoàng kim"
    : keyGarment?.name.split("(")[0].trim() || "Dấu ấn";

  const subtitle = isImperialOutfit
    ? "chốn cung đình."
    : "của riêng bạn.";

  const eraLabel = equippedGarments.length
    ? theme.name
    : "Chưa chọn trang phục";

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (popup && !dialog.open) {
      dialog.showModal();
    }

    if (!popup && dialog.open) {
      dialog.close();
      popupTrigger.current?.focus();
    }
  }, [popup]);

  const openPopup = (
    next: Exclude<Popup, null>,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    popupTrigger.current = event.currentTarget;
    setPopup(next);
  };

  return (
    <main className="lookbook-page" aria-label="Lookbook">
      <div className="lookbook-shell">
        <div className="lookbook-topline">
          <span>LOOKBOOK / BẢN PHỐI HIỆN TẠI</span>

          <button
            className="lookbook-outline"
            onClick={(event) => openPopup("collection", event)}
          >
            <BookOpen size={15} aria-hidden="true" />
            Bộ sưu tập
          </button>
        </div>

        <section
          className="lookbook-editorial"
          aria-labelledby="lookbook-title"
        >
          <span className="lookbook-watermark" aria-hidden="true">
            DI SẢN
          </span>

          <div className="lookbook-heading">
            <div className="lookbook-issue">Sắc Việt, nét riêng.</div>

            <h2 id="lookbook-title">
              {title}
              <em>{subtitle}</em>
            </h2>

            <p className="lookbook-subtitle">
              {eraLabel} · {activeScene.name}
            </p>

            <div className="lookbook-hairline" aria-hidden="true" />

            <span className="lookbook-motto">
              MỘT BẢN PHỐI. MỘT DẤU ẤN.
            </span>
          </div>

          <figure className="lookbook-portrait">
            <div className="lookbook-arch">
              <div
                className="lookbook-avatar"
                inert
                aria-hidden="true"
              >
                <Avatar2D
                  equippedGarments={equippedGarments}
                  gender={gender}
                  skinTone={skinTone}
                  eraTheme={theme}
                  isZenMode
                  isCustomizerOpen={false}
                />
              </div>
            </div>

            <figcaption className="lookbook-plate">
              <span>GEN Z STUDIO</span>
              <em>Bản nháp</em>

              <span className="lookbook-sr-only">
                Nhân vật {gender === "female" ? "nữ" : "nam"} mặc{" "}
                {equippedGarments.length} món trang phục đang chọn trong
                Studio.
              </span>
            </figcaption>

            <span className="lookbook-seal" aria-hidden="true">
              Việt
              <br />
              Phục
            </span>
          </figure>

          <div className="lookbook-note">
            <p className="lookbook-note-title">
              Y phục xưa,
              <br />
              tinh thần mới.
            </p>

            <div
              className="lookbook-palette"
              aria-label="Bảng màu trang phục"
            >
              {palette.map((item) => (
                <span
                  key={item.colorHex}
                  style={{ backgroundColor: item.colorHex }}
                  title={item.colorName}
                  role="img"
                  aria-label={item.colorName}
                />
              ))}
            </div>

            <button
              className="lookbook-detail-link"
              onClick={(event) => openPopup("details", event)}
            >
              Khám phá bản phối
              <span aria-hidden="true">＋</span>
            </button>
          </div>
        </section>

        <div className="lookbook-bottom">
          <button
            className="lookbook-back"
            onClick={onBackToStudio}
          >
            <ChevronLeft size={17} aria-hidden="true" />
            Về Studio
          </button>

          <span className="lookbook-bottom-motto">
            Y PHỤC XƯA · TINH THẦN MỚI
          </span>

          <div className="lookbook-actions">
            <button
              className="lookbook-outline lookbook-mobile-details"
              onClick={(event) => openPopup("details", event)}
            >
              <Layers size={15} aria-hidden="true" />
              Chi tiết
            </button>

            <button
              className="lookbook-outline"
              onClick={onOpenOutfitCard}
            >
              <Share2 size={15} aria-hidden="true" />
              Thẻ & so sánh
            </button>

            <button
              className="lookbook-primary"
              onClick={onBackToStudio}
            >
              Chỉnh bản phối
            </button>
          </div>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="lookbook-dialog"
        aria-labelledby="lookbook-popup-title"
        onCancel={(event) => {
          event.preventDefault();
          setPopup(null);
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;

          const rect = event.currentTarget.getBoundingClientRect();

          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          ) {
            setPopup(null);
          }
        }}
      >
        <div className="lookbook-dialog-head">
          <h3 id="lookbook-popup-title">
            {popup === "details"
              ? "Trong bản phối này"
              : "Bộ sưu tập của bạn"}
          </h3>

          <button
            className="lookbook-close"
            autoFocus
            onClick={() => setPopup(null)}
            aria-label="Đóng popup"
          >
            <X size={18} />
          </button>
        </div>

        {popup === "details" ? (
          <>
            <p className="lookbook-dialog-context">
              {eraLabel} · {activeScene.name}
            </p>

            {equippedGarments.length ? (
              <ul className="lookbook-garment-list">
                {equippedGarments.map((item) => (
                  <li key={item.id}>
                    <span
                      className="lookbook-garment-swatch"
                      style={{ backgroundColor: item.colorHex }}
                      aria-hidden="true"
                    />

                    <div>
                      <small>{CATEGORY_NAMES[item.category]}</small>
                      <span>{item.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="lookbook-empty">
                Hãy chọn trang phục trong Studio để bắt đầu bản phối.
              </p>
            )}

            <button
              className="lookbook-primary"
              onClick={onBackToStudio}
            >
              Chỉnh trong Studio
            </button>
          </>
        ) : (
          <>
            <button
              className="lookbook-draft"
              onClick={() => setPopup(null)}
            >
              <Palette size={24} aria-hidden="true" />

              <span>
                <strong>
                  {title} {subtitle}
                </strong>

                <small>
                  Bản nháp đang phối · {equippedGarments.length} món
                </small>
              </span>
            </button>

            <p className="lookbook-empty">
              Chưa có bản phối được lưu.
            </p>
          </>
        )}
      </dialog>
    </main>
  );
};