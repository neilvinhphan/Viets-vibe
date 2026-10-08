interface LookbookExportOptions {
  svg: SVGSVGElement;
  title: string;
  subtitle?: string;
  era: string;
  scene: string;
  colors: string[];
  signal?: AbortSignal;
}

const WIDTH = 1080;
const HEIGHT = 1350;
const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"Be Vietnam Pro", Arial, sans-serif';

function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException('Đã hủy xuất ảnh.', 'AbortError');
  }
}

export function lookbookFileName(title: string): string {
  const name = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');

  return `lookbook-${name || 'ban-phoi'}.png`;
}

function loadImage(
  url: string,
  signal?: AbortSignal,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    const cleanup = () => {
      clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      signal?.removeEventListener('abort', abort);
    };

    const abort = () => {
      cleanup();
      image.src = '';
      reject(new DOMException('Đã hủy xuất ảnh.', 'AbortError'));
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Tạo ảnh quá lâu. Hãy thử lại.'));
    }, 15000);

    image.onload = () => {
      cleanup();
      resolve(image);
    };

    image.onerror = () => {
      cleanup();
      reject(new Error('Chưa đọc được hình nhân vật.'));
    };

    signal?.addEventListener('abort', abort, { once: true });

    if (signal?.aborted) {
      abort();
      return;
    }

    image.src = url;
  });
}

function shortText(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
) {
  const result = text.trim().replace(/\s+/g, ' ');

  if (ctx.measureText(result).width <= width) return result;

  const characters = Array.from(result);

  while (
    characters.length &&
    ctx.measureText(characters.join('') + '…').width > width
  ) {
    characters.pop();
  }

  return characters.join('') + '…';
}

function titleLines(
  ctx: CanvasRenderingContext2D,
  title: string,
) {
  const words = title.trim().replace(/\s+/g, ' ').split(' ');

  for (let size = 72; size >= 36; size -= 2) {
    ctx.font = `500 ${size}px ${SERIF}`;

    const lines: string[] = [];
    let line = '';

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;

      if (line && ctx.measureText(candidate).width > 900) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line) lines.push(line);

    if (
      lines.length <= 2 &&
      lines.every(value => ctx.measureText(value).width <= 900)
    ) {
      return { lines, size };
    }
  }

  ctx.font = `500 36px ${SERIF}`;

  return {
    lines: [shortText(ctx, title, 900)],
    size: 36,
  };
}

function arch(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(304, 1070);
  ctx.lineTo(304, 632);
  ctx.arc(540, 632, 236, Math.PI, 0);
  ctx.lineTo(776, 1070);
  ctx.closePath();
}

function drawPoster(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  options: LookbookExportOptions,
) {
  ctx.fillStyle = '#f8f5ef';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textAlign = 'center';

  ctx.fillStyle = '#876e50';
  ctx.font = `20px ${SANS}`;
  ctx.fillText('LOOKBOOK / VIỆT PHỤC', 540, 64);

  ctx.font = `italic 30px ${SERIF}`;
  ctx.fillText('Sắc Việt, nét riêng.', 540, 112);

  const heading = titleLines(ctx, options.title);
  const twoLines = heading.lines.length > 1;

  ctx.fillStyle = '#3c3025';

  heading.lines.forEach((line, index) => {
    ctx.fillText(
      line,
      540,
      (twoLines ? 180 : 190) + index * (heading.size + 5),
    );
  });

  ctx.fillStyle = '#913d2f';
  ctx.font = `italic 38px ${SERIF}`;

  if (options.subtitle) {
    ctx.fillText(
      shortText(ctx, options.subtitle, 900),
      540,
      twoLines ? 310 : 272,
    );
  }

  ctx.fillStyle = '#806b53';
  ctx.font = `22px ${SANS}`;
  ctx.fillText(
    shortText(ctx, `${options.era} · ${options.scene}`, 920),
    540,
    twoLines ? 348 : 320,
  );

  // Khung chân dung nghiêng nhẹ.
  ctx.save();
  ctx.translate(540, 752);
  ctx.rotate(-2 * Math.PI / 180);
  ctx.translate(-540, -752);

  ctx.fillStyle = '#e9e1d3';
  ctx.fillRect(284, 386, 540, 780);

  ctx.fillStyle = '#f8f2e5';
  ctx.fillRect(270, 372, 540, 780);

  ctx.strokeStyle = '#c7b89e';
  ctx.lineWidth = 2;
  ctx.strokeRect(270, 372, 540, 780);

  ctx.strokeStyle = '#dcd0ba';
  ctx.lineWidth = 1;
  ctx.strokeRect(282, 384, 516, 756);

  const glow = ctx.createRadialGradient(
    540, 745, 20,
    540, 745, 390,
  );

  glow.addColorStop(0, '#ead2a0');
  glow.addColorStop(1, '#f8f2e6');

  arch(ctx);
  ctx.fillStyle = glow;
  ctx.fill();
  ctx.strokeStyle = '#e0d0b2';
  ctx.stroke();

  ctx.save();
  ctx.clip();
  ctx.drawImage(image, 324.23, 403, 431.54, 660);
  ctx.restore();

  ctx.fillStyle = '#806b50';
  ctx.font = `19px ${SANS}`;
  ctx.fillText('GEN Z STUDIO', 540, 1114);
  ctx.restore();

  // Con dấu Việt Phục.
  ctx.save();
  ctx.translate(816, 1010);
  ctx.rotate(13 * Math.PI / 180);

  ctx.fillStyle = '#f8f2e5';
  ctx.strokeStyle = '#9f4c3b';

  [51, 42].forEach(radius => {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    if (radius === 51) ctx.fill();
    ctx.stroke();
  });

  ctx.fillStyle = '#9f4c3b';
  ctx.font = `500 28px ${SERIF}`;
  ctx.fillText('Việt', 0, -3);
  ctx.fillText('Phục', 0, 24);
  ctx.restore();

  const colors = [...new Set(options.colors)]
    .filter(value =>
      /^#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.test(value),
    )
    .slice(0, 4);

  colors.forEach((color, index) => {
    ctx.beginPath();
    ctx.arc(
      540 + (index - (colors.length - 1) / 2) * 44,
      1210,
      12,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#cbbb9d';
    ctx.stroke();
  });

  ctx.fillStyle = '#876e50';
  ctx.font = `20px ${SANS}`;
  ctx.fillText('Y PHỤC XƯA · TINH THẦN MỚI', 540, 1290);
}

export async function exportLookbookPng(
  options: LookbookExportOptions,
): Promise<string> {
  checkAbort(options.signal);

  const captured = {
    ...options,
    colors: [...options.colors],
  };

  const markup = serializeAvatarSvg(options.svg);

  const svgUrl = URL.createObjectURL(
    new Blob([markup], {
      type: 'image/svg+xml;charset=utf-8',
    }),
  );

  try {
    const image = await loadImage(svgUrl, options.signal);
    checkAbort(options.signal);

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Trình duyệt chưa tạo được ảnh.');
    }

    drawPoster(ctx, image, captured);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(value => {
        if (value) resolve(value);
        else reject(new Error('Chưa tạo được file PNG.'));
      }, 'image/png');
    });

    checkAbort(options.signal);

    const filename = lookbookFileName(captured.title);
    const pngUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    try {
      link.href = pngUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      setTimeout(() => URL.revokeObjectURL(pngUrl), 60000);
    }

    return filename;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
export function serializeAvatarSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', '680');
  clone.setAttribute('height', '1040');
  clone.removeAttribute('class');
  clone.removeAttribute('style');

  clone.querySelectorAll('[class]').forEach(element => {
    element.removeAttribute('class');
  });

  if (clone.querySelector('image, foreignObject, script')) {
    throw new Error('Chưa xuất được hình nhân vật này.');
  }

  return new XMLSerializer().serializeToString(clone);

}

export async function createLookbookPreview(svg: SVGSVGElement, signal?: AbortSignal): Promise<string> {
  checkAbort(signal);
  const url = URL.createObjectURL(new Blob([serializeAvatarSvg(svg)], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = await loadImage(url, signal);
    checkAbort(signal);
    const canvas = document.createElement('canvas');
    canvas.width = 340;
    canvas.height = 520;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Trình duyệt chưa tạo được ảnh bản phối.');
    ctx.fillStyle = '#f8f5ef';
    ctx.fillRect(0, 0, 340, 520);
    ctx.drawImage(image, 0, 0, 340, 520);
    const preview = canvas.toDataURL('image/png');
    if (preview.length > 600000) throw new Error('Ảnh bản phối quá lớn. Hãy thử lại.');
    return preview;
  } finally { URL.revokeObjectURL(url); }
}
