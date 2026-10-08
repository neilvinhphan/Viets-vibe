import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Camera, ChevronLeft, ChevronRight, Heart, Layers, MoreHorizontal, Palette, Pencil, Share2, Trash2, X } from 'lucide-react';
import type { EventType, Garment, ValidationMode, WeatherType } from '../types';
import type { HistoricalScene } from '../data/historicalScenes';
import { Avatar2D } from './Avatar2D';
import { LookbookExportButton } from './LookbookExportButton';
import { LookbookThumbnail } from './LookbookThumbnail';
import { createLookbookPreview } from '../utils/exportLookbookPng';
import { EVENTS_CONFIG, WEATHER_CONFIG } from './SceneSelector';
import { getOutfitEra, ERA_LIGHTING_THEMES } from '../utils/eraLighting';
import { createLookbookSnapshot, getLookbookHeading } from '../utils/lookbookSnapshot';
import type { LookbookSnapshot } from '../utils/lookbookSnapshot';
import type { LookbookEntry } from '../utils/lookbookStorage';
import './LookbookPage.css';

interface LookbookPageProps {
  equippedGarments: Garment[];
  activeScene: HistoricalScene;
  sceneOpacity: LookbookSnapshot['sceneOpacity'];
  gender: 'female' | 'male';
  skinTone: string;
  activeEvent: EventType;
  activeWeather: WeatherType;
  validationMode: ValidationMode;
  snapshots: LookbookEntry[];
  selectedId: string | null;
  storageNotice: string;
  onSelectSnapshot: (id: string | null) => void;
  onSaveSnapshot: (snapshot: LookbookSnapshot) => void;
  onRenameSnapshot: (id: string, title: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteSnapshot: (id: string) => void;
  onApplySnapshot: (snapshot: LookbookSnapshot) => void;
  onBackToStudio: () => void;
  onOpenOutfitCard: () => void;
}

type Popup = 'actions' | 'details' | 'collection' | 'capture' | 'rename' | 'delete' | null;
const CATEGORY_NAMES: Record<Garment['category'], string> = {
  headwear: 'Khăn mũ', undergarment: 'Lớp trong', robe: 'Áo chính',
  outerwear: 'Áo khoác', bottom: 'Quần thường', footwear: 'Hài guốc', accessory: 'Phụ kiện',
};

export const LookbookPage: React.FC<LookbookPageProps> = ({
  equippedGarments, activeScene, sceneOpacity, gender, skinTone,
  activeEvent, activeWeather, validationMode, snapshots, selectedId, storageNotice,
  onSelectSnapshot, onSaveSnapshot, onRenameSnapshot, onToggleFavorite, onDeleteSnapshot,
  onApplySnapshot, onBackToStudio, onOpenOutfitCard,
}) => {
  const [popup, setPopup] = useState<Popup>(null);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [saving, setSaving] = useState(false);
  const captureRequest = useRef<AbortController | null>(null);
  useEffect(() => () => captureRequest.current?.abort(), []);
  const pageRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const mainActionRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const popupTrigger = useRef<HTMLElement | null>(null);
  const selected = snapshots.find(item => item.id === selectedId) ?? null;
  const target = snapshots.find(item => item.id === targetId) ?? null;
  const index = snapshots.findIndex(item => item.id === selectedId);
  const visibleEntries = favoriteOnly ? snapshots.filter(item => item.favorite) : snapshots;
  const garments = selected?.garments ?? equippedGarments;
  const scene = selected?.scene ?? activeScene;
  const displayGender = selected?.gender ?? gender;
  const displaySkinTone = selected?.skinTone ?? skinTone;
  const eventType = selected?.eventType ?? activeEvent;
  const weatherType = selected?.weatherType ?? activeWeather;
  const displayMode = selected?.validationMode ?? validationMode;
  const theme = ERA_LIGHTING_THEMES[getOutfitEra(garments)];
  const heading = getLookbookHeading(garments);
  const title = selected?.title ?? heading.title;
  const subtitle = selected ? '' : heading.subtitle;
  const eraLabel = garments.length ? theme.name : 'Chưa chọn trang phục';
  const palette = [...new Map(garments.map(item => [item.colorHex, item])).values()].slice(0, 4);
  const eventLabel = EVENTS_CONFIG.find(item => item.id === eventType)?.label ?? eventType;
  const weatherLabel = WEATHER_CONFIG.find(item => item.id === weatherType)?.label ?? weatherType;
  const capturedAt = selected ? new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(selected.createdAt) : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (popup) {
      if (!dialog.open) dialog.showModal();
      dialog.scrollTop = 0;
    }
    if (!popup && dialog.open) {
      dialog.close();
      const trigger = popupTrigger.current;
      const returnTarget = trigger?.isConnected && trigger.getClientRects().length ? trigger : mainActionRef.current;
      const disabled = returnTarget instanceof HTMLButtonElement && returnTarget.disabled;
      (disabled ? pageRef.current : returnTarget)?.focus({ preventScroll: true });
    }
    if (popup === 'capture' || popup === 'rename') nameRef.current?.focus();
    if (popup === 'delete') cancelRef.current?.focus();
    if (popup === 'collection' || popup === 'details' || popup === 'actions') closeRef.current?.focus({ preventScroll: true });
  }, [popup]);

  const isPopupOpen = popup !== null;
  useEffect(() => {
    const page = pageRef.current;
    if (!page || !isPopupOpen) return;
    const previousOverflow = page.style.overflow;
    page.style.overflow = 'hidden';
    return () => { page.style.overflow = previousOverflow; };
  }, [isPopupOpen]);

  const dismissPopup = () => {
    captureRequest.current?.abort();
    captureRequest.current = null;
    setSaving(false);
    setError('');
    setPopup(popup === 'rename' || popup === 'delete' ? 'collection' : null);
  };

  const openPopup = (next: Exclude<Popup, null>, event: React.MouseEvent<HTMLButtonElement>) => {
    popupTrigger.current = event.currentTarget;
    setError('');
    if (next === 'capture') {
      const draftHeading = getLookbookHeading(equippedGarments);
      setName(`${draftHeading.title} ${draftHeading.subtitle}`.slice(0, 60));
    }
    setPopup(next);
  };

  const capture = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (captureRequest.current) return;
    const controller = new AbortController();
    captureRequest.current = controller;
    setSaving(true);
    try {
      const next = createLookbookSnapshot({
        title: name, garments: equippedGarments, scene: activeScene, sceneOpacity,
        gender, skinTone, eventType: activeEvent, weatherType: activeWeather, validationMode,
      });
      const svg = pageRef.current?.querySelector('.lookbook-shell #avatar-mannequin')?.closest('svg');
      if (!svg) throw new Error('Nhân vật chưa sẵn sàng. Hãy thử lại.');
      next.previewImage = await createLookbookPreview(svg, controller.signal);
      controller.signal.throwIfAborted();
      onSaveSnapshot(next);
      setPopup('collection');
      setAnnouncement('Đã lưu bản phối ' + next.title + '.');
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : 'Chưa lưu được bản phối.');
        nameRef.current?.focus();
      }
    } finally {
      if (captureRequest.current === controller) captureRequest.current = null;
      if (!controller.signal.aborted) setSaving(false);
    }
  };

  const manage = (mode: 'rename' | 'delete', entry: LookbookEntry, event: React.MouseEvent<HTMLButtonElement>) => {
    popupTrigger.current = event.currentTarget;
    setTargetId(entry.id);
    setName(entry.title);
    setError('');
    setPopup(mode);
  };
  const rename = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (!target) throw new Error('Bản phối này không còn trong bộ sưu tập.');
      onRenameSnapshot(target.id, name);
      setPopup('collection');
      setError('');
      setAnnouncement('Đã đổi tên bản phối.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa đổi được tên.'); }
  };
  const remove = () => {
    try {
      if (!target) throw new Error('Bản phối này không còn trong bộ sưu tập.');
      onDeleteSnapshot(target.id);
      setPopup('collection');
      setError('');
      setAnnouncement('Đã xóa bản phối.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa xóa được bản phối.'); }
  };
  const favorite = (id: string) => {
    try { onToggleFavorite(id); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa lưu được yêu thích.'); }
  };
  const move = (direction: number) => {
    if (snapshots.length < 2 || index < 0) return;
    const next = snapshots[(index + direction + snapshots.length) % snapshots.length];
    onSelectSnapshot(next.id);
    setAnnouncement(`Đang xem ${next.title}.`);
  };

  return (
    <main ref={pageRef} className="lookbook-page" aria-label="Lookbook" tabIndex={0}
      aria-describedby={selected && snapshots.length > 1 ? 'lookbook-keyboard-hint' : undefined}
      onKeyDown={event => {
        if (popup || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (!(event.target instanceof Element) || event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="combobox"]')) return;
        if (!selected || snapshots.length < 2) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          move(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}>
      <span id="lookbook-keyboard-hint" className="lookbook-sr-only">Dùng phím mũi tên trái hoặc phải để chuyển bản phối đã lưu.</span>
      <div className="lookbook-shell">
        <div className="lookbook-topline">
          <span>LOOKBOOK / {selected ? 'BẢN ĐÃ LƯU' : 'BẢN PHỐI HIỆN TẠI'}</span>
          <button className="lookbook-outline" onClick={event => openPopup('collection', event)}>
            <BookOpen size={15} aria-hidden="true" /> Bộ sưu tập ({snapshots.length})
          </button>
        </div>
        <section className="lookbook-editorial" aria-labelledby="lookbook-title">
          <span className="lookbook-watermark" aria-hidden="true">DI SẢN</span>
          <div className="lookbook-heading">
            <div className="lookbook-issue">Sắc Việt, nét riêng.</div>
            <h2 id="lookbook-title">{title}{subtitle && <em>{subtitle}</em>}</h2>
            <p className="lookbook-subtitle">{eraLabel} · {scene.name}</p>
            <div className="lookbook-hairline" aria-hidden="true" />
            <span className="lookbook-motto">MỘT BẢN PHỐI. MỘT DẤU ẤN.</span>
          </div>
          <figure key={selected?.id ?? 'draft'} className="lookbook-portrait">
            <div className="lookbook-arch">
              <div className="lookbook-avatar" inert aria-hidden="true">
                <Avatar2D key={selected?.id ?? 'draft'} equippedGarments={garments}
                  gender={displayGender} skinTone={displaySkinTone} eraTheme={theme}
                  isZenMode isCustomizerOpen={false} />
              </div>
            </div>
            <figcaption className="lookbook-plate">
              <span>GEN Z STUDIO</span><em>{selected ? `Nº ${String(index + 1).padStart(2, '0')}` : 'Bản nháp'}</em>
              <span className="lookbook-sr-only">Nhân vật {displayGender === 'female' ? 'nữ' : 'nam'} mặc {garments.length} món trong {selected ? 'bản đã lưu' : 'bản đang phối'}.</span>
            </figcaption>
            <span className="lookbook-seal" aria-hidden="true">Việt<br />Phục</span>
          </figure>
          <div className="lookbook-note">
            <p className="lookbook-note-title">Y phục xưa,<br />tinh thần mới.</p>
            <div className="lookbook-palette" aria-label="Bảng màu trang phục">
              {palette.map(item => <span key={item.colorHex} style={{ backgroundColor: item.colorHex }}
                title={item.colorName} role="img" aria-label={item.colorName} />)}
            </div>
            <button className="lookbook-detail-link" onClick={event => openPopup('details', event)}>
              Khám phá bản phối <span aria-hidden="true">＋</span>
            </button>
          </div>
        </section>
        <div className="lookbook-bottom">
          <button className="lookbook-back" onClick={onBackToStudio}>
            <ChevronLeft size={17} aria-hidden="true" /> Về Studio
          </button>
          {selected ? <div className="lookbook-pager">
            <button aria-label="Bản phối trước" disabled={snapshots.length < 2} onClick={() => move(-1)}><ChevronLeft size={17} /></button>
            <span>{index + 1} / {snapshots.length}</span>
            <button aria-label="Bản phối tiếp theo" disabled={snapshots.length < 2} onClick={() => move(1)}><ChevronRight size={17} /></button>
          </div> : <span className="lookbook-bottom-motto">Y PHỤC XƯA · TINH THẦN MỚI</span>}
          <div className="lookbook-actions">
            {selected && <button className={`lookbook-icon ${selected.favorite ? 'lookbook-loved' : ''}`}
              aria-label={selected.favorite ? 'Bỏ yêu thích' : 'Yêu thích'} aria-pressed={selected.favorite}
              onClick={() => favorite(selected.id)}><Heart size={18} fill={selected.favorite ? 'currentColor' : 'none'} /></button>}
            <button className="lookbook-outline lookbook-mobile-details" onClick={event => openPopup('details', event)}>
              <Layers size={15} aria-hidden="true" /> Chi tiết
            </button>
            {selected ? (
              <button className="lookbook-outline lookbook-secondary-action" onClick={() => { onSelectSnapshot(null); setAnnouncement('Đang xem bản phối hiện tại.'); }}>
                Bản đang phối
              </button>
            ) : (
              <button className="lookbook-outline lookbook-secondary-action" onClick={onOpenOutfitCard}>
                <Share2 size={15} aria-hidden="true" /> Ảnh mẫu & so sánh
              </button>
            )}
            <button className="lookbook-outline lookbook-more" onClick={event => openPopup('actions', event)}>
              <MoreHorizontal size={18} aria-hidden="true" /> Tùy chọn
            </button>
            {selected ? (
              <button ref={mainActionRef} className="lookbook-primary" onClick={() => onApplySnapshot(selected)}>Áp dụng vào Studio</button>
            ) : (
              <button ref={mainActionRef} className="lookbook-primary" disabled={!equippedGarments.length}
                onClick={event => openPopup('capture', event)}>
                <Camera size={15} aria-hidden="true" /> Lưu bản phối
              </button>
            )}
          </div>
        </div>
        {error && !popup && <p className="lookbook-error" role="alert">{error}</p>}
        <div className="lookbook-sr-only" role="status">{announcement}</div>
      </div>
      <dialog ref={dialogRef} className={'lookbook-dialog' + (popup === 'collection' ? ' lookbook-collection-dialog' : '')} aria-labelledby="lookbook-popup-title"
        onCancel={event => { event.preventDefault(); dismissPopup(); }}
        onClick={event => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dismissPopup();
        }}>
        <div className="lookbook-dialog-head">
          <h3 id="lookbook-popup-title">{popup === 'actions' ? 'Tùy chọn bản phối' : popup === 'capture' ? 'Lưu một dấu ấn' : popup === 'rename' ? 'Đổi tên bản phối' : popup === 'delete' ? 'Xóa bản phối?' : popup === 'details' ? 'Trong bản phối này' : 'Bộ sưu tập của bạn'}</h3>
          <button ref={closeRef} className="lookbook-close" autoFocus onClick={dismissPopup} aria-label="Đóng popup"><X size={18} /></button>
        </div>
        {popup === 'capture' || popup === 'rename' ? (
          <form onSubmit={popup === 'rename' ? rename : capture}>
            <label className="lookbook-field" htmlFor="lookbook-name">Tên bản phối</label>
            <input ref={nameRef} className="lookbook-name-input" id="lookbook-name" value={name}
              onChange={event => { setName(event.target.value); setError(''); }} maxLength={60} required disabled={saving}
              aria-invalid={Boolean(error)} aria-describedby={error ? 'lookbook-name-error' : undefined} />
            {error && <p className="lookbook-error" id="lookbook-name-error" role="alert">{error}</p>}
            {popup === 'capture' && <p className="lookbook-empty">Giữ lại trang phục, nhân vật và bối cảnh đang phối. Bộ sưu tập được lưu trên trình duyệt này.</p>}
            {storageNotice && <p className="lookbook-error" role="alert">{storageNotice}</p>}
            <div className="lookbook-form-actions">
              <button type="button" className="lookbook-outline" onClick={() => { if (popup === 'rename') { setError(''); setPopup('collection'); } else dismissPopup(); }}>Hủy</button>
              <button type="submit" className="lookbook-primary" disabled={saving} aria-busy={saving}>{saving ? 'Đang lưu ảnh…' : popup === 'rename' ? 'Lưu tên mới' : 'Lưu bản phối'}</button>
            </div>
          </form>
        ) : popup === 'delete' ? (
          <>
            <p className="lookbook-empty">Xóa “{target?.title ?? 'bản phối này'}” khỏi bộ sưu tập? Trang phục đang mặc trong Studio vẫn được giữ nguyên.</p>
            {error && <p className="lookbook-error" role="alert">{error}</p>}
            <div className="lookbook-form-actions">
              <button ref={cancelRef} className="lookbook-outline" onClick={() => { setError(''); setPopup('collection'); }}>Hủy</button>
              <button className="lookbook-danger" onClick={remove}>Xóa bản phối</button>
            </div>
          </>
        ) : popup === 'actions' ? (
          <div className="lookbook-option-list">
            <LookbookExportButton
              getAvatarSvg={() => pageRef.current?.querySelector('#avatar-mannequin')?.closest('svg') ?? null}
              title={title}
              subtitle={subtitle}
              era={eraLabel}
              scene={scene.name}
              colors={palette.map(item => item.colorHex)}
              disabled={!garments.length}
            />
            <button onClick={() => setPopup('details')}><Layers size={20} aria-hidden="true" /><span>Chi tiết bản phối</span><ChevronRight size={17} aria-hidden="true" /></button>
            <button onClick={() => setPopup('collection')}><BookOpen size={20} aria-hidden="true" /><span>Bộ sưu tập ({snapshots.length})</span><ChevronRight size={17} aria-hidden="true" /></button>
            {selected ? (
              <button onClick={() => { onSelectSnapshot(null); setPopup(null); setAnnouncement('Đang xem bản phối hiện tại.'); }}><Palette size={20} aria-hidden="true" /><span>Xem bản đang phối</span><ChevronRight size={17} aria-hidden="true" /></button>
            ) : (
              <button onClick={() => { setPopup(null); onOpenOutfitCard(); }}><Share2 size={20} aria-hidden="true" /><span>Ảnh mẫu & so sánh</span><ChevronRight size={17} aria-hidden="true" /></button>
            )}
            <button onClick={onBackToStudio}><ChevronLeft size={20} aria-hidden="true" /><span>Về Studio</span><ChevronRight size={17} aria-hidden="true" /></button>
          </div>
        ) : popup === 'details' ? (
          <>
            <dl className="lookbook-context-grid">
              <div><dt>Bối cảnh</dt><dd>{scene.name}</dd></div>
              <div><dt>Dịp</dt><dd>{eventLabel}</dd></div>
              <div><dt>Thời tiết</dt><dd>{weatherLabel}</dd></div>
              <div><dt>Nhân vật</dt><dd>{displayGender === 'female' ? 'Nữ phục' : 'Nam phục'}<span className="lookbook-skin-swatch" style={{ backgroundColor: displaySkinTone }} role="img" aria-label={`Màu da ${displaySkinTone}`} /></dd></div>
              <div><dt>Kiểm định</dt><dd>{displayMode === 'genz_remix' ? 'Gen Z Remix' : 'Chuẩn sử'}</dd></div>
              {capturedAt && <div><dt>Đã lưu lúc</dt><dd>{capturedAt}</dd></div>}
            </dl>
            {garments.length ? <ul className="lookbook-garment-list">
              {garments.map(item => <li key={item.id}>
                <span className="lookbook-garment-swatch" style={{ backgroundColor: item.colorHex }} aria-hidden="true" />
                <div><small>{CATEGORY_NAMES[item.category]}</small><span>{item.name}</span></div>
              </li>)}
            </ul> : <p className="lookbook-empty">Hãy chọn trang phục trong Studio để bắt đầu bản phối.</p>}
            <button className="lookbook-primary" onClick={() => selected ? onApplySnapshot(selected) : onBackToStudio()}>
              {selected ? 'Áp dụng vào Studio' : 'Chỉnh trong Studio'}
            </button>
          </>
        ) : popup === 'collection' ? (
          <>
            <div className="lookbook-filter" aria-label="Lọc bộ sưu tập">
              <button className={!favoriteOnly ? 'active' : ''} aria-pressed={!favoriteOnly} onClick={() => setFavoriteOnly(false)}>Tất cả</button>
              <button className={favoriteOnly ? 'active' : ''} aria-pressed={favoriteOnly} onClick={() => setFavoriteOnly(true)}>Yêu thích</button>
            </div>
            {storageNotice && <p className="lookbook-error" role="alert">{storageNotice}</p>}
            {error && <p className="lookbook-error" role="alert">{error}</p>}
            <div className="lookbook-collection-list">
              <button className={`lookbook-draft ${!selected ? 'lookbook-selected' : ''}`} onClick={() => { onSelectSnapshot(null); setPopup(null); }}>
                <LookbookThumbnail key={JSON.stringify([equippedGarments, gender, skinTone])} outfit={{ garments: equippedGarments, gender, skinTone }} title="Bản đang phối" />
                <span className="lookbook-entry-caption"><strong>Bản đang phối</strong><small>{equippedGarments.length} món · {activeScene.name}</small><small>Chưa lưu</small></span>
              </button>
              {visibleEntries.map(entry => <article className={`lookbook-entry ${entry.id === selectedId ? 'lookbook-selected' : ''}`} key={entry.id}>
                <button className="lookbook-entry-open" onClick={() => { onSelectSnapshot(entry.id); setPopup(null); }}>
                  <LookbookThumbnail outfit={entry} title={entry.title} />
                  <span className="lookbook-entry-caption"><strong>{entry.title}</strong><small>{entry.garments.length} món · {entry.scene.name}</small><small>{new Date(entry.createdAt).toLocaleDateString('vi-VN')}</small></span>
                </button>
                <div className="lookbook-entry-tools">
                  <button className={`lookbook-icon ${entry.favorite ? 'lookbook-loved' : ''}`} aria-label={`${entry.favorite ? 'Bỏ yêu thích' : 'Yêu thích'} ${entry.title}`}
                    aria-pressed={entry.favorite} onClick={() => favorite(entry.id)}><Heart size={17} fill={entry.favorite ? 'currentColor' : 'none'} /></button>
                  <button className="lookbook-icon" aria-label={`Đổi tên ${entry.title}`} onClick={event => manage('rename', entry, event)}><Pencil size={17} /></button>
                  <button className="lookbook-icon" aria-label={`Xóa ${entry.title}`} onClick={event => manage('delete', entry, event)}><Trash2 size={17} /></button>
                </div>
              </article>)}
              {!visibleEntries.length && <p className="lookbook-empty">{favoriteOnly ? 'Chưa có bản phối yêu thích.' : 'Chưa có bản đã lưu. Đặt tên và lưu bản phối để bắt đầu bộ sưu tập.'}</p>}
            </div>
          </>
        ) : null}
      </dialog>
    </main>
  );
};
