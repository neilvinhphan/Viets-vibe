import type { ReferenceOutfitImage } from '../data/referenceOutfits';

const extensions: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/gif': 'gif', 'image/avif': 'avif',
};

export async function downloadReferenceImage(image: ReferenceOutfitImage) {
  // Web results already use the same-origin, SSRF-safe image proxy.
  const response = await fetch(image.imageUrl, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Không tải được ảnh từ nguồn. Hãy thử lại hoặc chọn ảnh khác.');
  const blob = await response.blob();
  const extension = extensions[blob.type.toLowerCase()];
  if (!extension || !blob.size || blob.size > 8 * 1024 * 1024) {
    throw new Error('Ảnh tải về không hợp lệ hoặc vượt quá 8 MB.');
  }
  const filename = image.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd').replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 80) || 'anh-mau';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  try {
    link.href = url;
    link.download = filename + '.' + extension;
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    // Allow the browser time to begin consuming the download.
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}
