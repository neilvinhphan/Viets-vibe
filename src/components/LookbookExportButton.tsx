import { useEffect, useRef, useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import { exportLookbookPng } from '../utils/exportLookbookPng';

interface Props {
  getAvatarSvg: () => SVGSVGElement | null;
  title: string;
  subtitle?: string;
  era: string;
  scene: string;
  colors: string[];
  disabled?: boolean;
}

export function LookbookExportButton({
  getAvatarSvg,
  title,
  subtitle,
  era,
  scene,
  colors,
  disabled,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => request.current?.abort();
  }, []);

  const download = async () => {
    if (request.current || disabled) return;

    const controller = new AbortController();
    request.current = controller;

    setBusy(true);
    setError('');
    setNotice('');

    try {
      const svg = getAvatarSvg();

      if (!svg) {
        throw new Error('Nhân vật chưa sẵn sàng. Hãy thử lại.');
      }

      const filename = await exportLookbookPng({
        svg,
        title,
        subtitle,
        era,
        scene,
        colors,
        signal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setNotice(`Đã tạo ảnh ${filename}.`);
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Chưa xuất được ảnh.',
        );
      }
    } finally {
      request.current = null;

      if (!controller.signal.aborted) {
        setBusy(false);
      }
    }
  };

  return (
    <div className="lookbook-export-control">
      <button
        type="button"
        disabled={disabled || busy}
        aria-busy={busy}
        onClick={download}
      >
        {busy ? (
          <LoaderCircle
            size={20}
            className="lookbook-export-spinner"
            aria-hidden="true"
          />
        ) : (
          <Download size={20} aria-hidden="true" />
        )}

        <span>
          {busy ? 'Đang tạo ảnh…' : 'Tải ảnh Lookbook'}
        </span>
        <small>PNG</small>
      </button>

      {error && (
        <p className="lookbook-error" role="alert">
          {error}
        </p>
      )}

      <p className="lookbook-export-notice" role="status">
        {notice}
      </p>
    </div>
  );
}