import { useEffect, useRef, useState } from 'react';
import { Avatar2D } from './Avatar2D';
import { serializeAvatarSvg } from '../utils/exportLookbookPng';
import { ERA_LIGHTING_THEMES, getOutfitEra } from '../utils/eraLighting';
import type { LookbookSnapshot } from '../utils/lookbookSnapshot';

type PreviewOutfit = Pick<LookbookSnapshot, 'garments' | 'gender' | 'skinTone' | 'previewImage'>;
export function LookbookThumbnail({ outfit, title }: { outfit: PreviewOutfit; title: string }) {
  const avatarRef = useRef<HTMLSpanElement>(null);
  const [generated, setGenerated] = useState('');
  const [storedFailed, setStoredFailed] = useState(false);
  const source = (!storedFailed && outfit.previewImage) || generated;
  useEffect(() => {
    if (source) return;
    const svg = avatarRef.current?.querySelector('#avatar-mannequin')?.closest('svg');
    if (!svg) return;
    // Old saves have no PNG. Isolate the saved avatar in an image so that
    // SVG definition IDs do not interfere with other collection cards.
    setGenerated('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serializeAvatarSvg(svg)));
  }, [source, outfit]);
  return (
    <span className="lookbook-thumbnail">
      {source ? <img src={source} alt={'Bản phối ' + title} loading="lazy" decoding="async"
        onError={() => { if (!storedFailed) setStoredFailed(true); }} /> : (
        <span ref={avatarRef} className="lookbook-thumbnail-avatar lookbook-avatar" inert aria-hidden="true">
          <Avatar2D equippedGarments={outfit.garments} gender={outfit.gender}
            skinTone={outfit.skinTone} eraTheme={ERA_LIGHTING_THEMES[getOutfitEra(outfit.garments)]}
            isZenMode isCustomizerOpen={false} />
        </span>
      )}
    </span>
  );
}
