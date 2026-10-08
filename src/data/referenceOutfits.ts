export interface ReferenceOutfitImage {
  id: string;
  title: string;
  imageUrl: string;
  sourceName: string;
  category: 'remix' | 'traditional';
  garmentId: string;
  tags: string[];
  matchScore: number;
  matchReason: string;
  sourceUrl?: string;
  attribution?: string;
  license?: string;
  isUpload?: boolean;
  originalImageUrl?: string;
  thumbnailUrl?: string;
}

export interface SimilarImagesResult {
  images: ReferenceOutfitImage[];
  remixSearchQuery: string;
  traditionalSearchQuery: string;
  styleSearchQuery: string;
  queryMode: 'gemini' | 'fallback' | 'custom';
  rankingMode: 'gemini' | 'fallback';
  searchMode: 'web' | 'offline' | 'catalog';
  candidates?: Array<{ imageUrl: string; matchScore: number; matchReason: string }>;
  fetchedAt?: string;
  warning?: string;
}

// Scores are calculated per outfit, never stored as fabricated confidence values.
// Commons photos are vendored unchanged; attribution and source links travel with each image.
const commons = (id: string, title: string, file: string, garmentId: string, tags: string[], attribution: string, license: string): ReferenceOutfitImage => ({
  id: `catalog-${id}`, title, imageUrl: `/reference-outfits/traditional-${id}.jpg`,
  sourceName: 'Wikimedia Commons', sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replaceAll(' ', '_'))}`,
  category: 'traditional', garmentId, tags, attribution, license, matchScore: 0, matchReason: '',
});
const editorial = (id: string, title: string, imageUrl: string, garmentId: string, tags: string[], sourceName: string, sourceUrl: string): ReferenceOutfitImage => ({
  id, title, imageUrl, garmentId, tags, sourceName, sourceUrl,
  category: 'remix', matchScore: 0, matchReason: '',
});

export const REFERENCE_OUTFITS_CATALOG: ReferenceOutfitImage[] = [
  commons('0', 'Ngũ thân — ảnh tư liệu Vi Văn Định', 'Portrait of Mandarin Vi Văn Định.jpg', 'ngu_than', ['cổ phục', 'khăn đóng', 'ảnh tư liệu'], 'Unknown photographer', 'Public domain'),
  commons('1', 'Áo Tấc đỏ, quần lụa trắng', 'Rio mã châu áo tấc.jpg', 'ao_tac', ['đỏ', 'quần lụa', 'trắng', 'cổ phục'], 'Ptdtch', 'CC BY-SA 4.0'),
  commons('2', 'Nhật Bình — ảnh tư liệu Vi Kim Ngọc', 'Vietnamese woman wearing Áo Nhật Bình.jpg', 'nhat_binh', ['cổ phục', 'khăn vấn', 'ảnh tư liệu'], 'Family of professor Nguyễn Văn Huyên', 'CC BY-SA 4.0'),
  commons('3', 'Giao Lĩnh tím, cổ chéo trắng', 'Z1979333419734 16c12c5a51e6493d59e81f619aad2aee.jpg', 'giao_linh', ['tím', 'trắng', 'thắt lưng', 'cổ phục'], 'Designlifevn', 'CC BY-SA 4.0'),
  commons('4', 'Tứ Thân xanh — người mặc bên trái', 'Áo tứ thân.jpg', 'tu_than', ['xanh lá', 'váy', 'đen', 'cổ phục'], 'Lionel Ng', 'CC BY-SA 2.0'),
  commons('5', 'Áo Dài hoa xanh, nón lá', 'In front of palace-crop.JPG', 'ao_dai', ['trắng', 'xanh lam', 'quần lụa', 'nón lá'], 'Kauffner', 'CC BY-SA 3.0'),
  { ...editorial('traditional-ngu-than', 'Ngũ Thân đen, quần trắng và quạt', '/reference-outfits/traditional-ngu-than.jpg', 'ngu_than', ['đen', 'trắng', 'cổ phục'], 'Znews / Đông Tây Promotion', 'https://lifestyle.zingnews.vn/buoi-ghi-hinh-o-han-quoc-cua-running-man-post1271237.html'), category: 'traditional' },
  { ...editorial('traditional-nhat-binh', 'Nhật Bình đỏ tại Huế — góc nhìn sau', '/reference-outfits/traditional-nhat-binh.jpg', 'nhat_binh', ['đỏ', 'quần lụa', 'trắng', 'khăn vấn', 'cổ phục'], 'VnExpress', 'https://vnexpress.net/bien-hinh-thanh-phi-tan-trieu-nguyen-4153645.html'), category: 'traditional' },
  editorial('remix-jeans-pink', 'Áo Dài hồng phối jeans trắng', '/reference-outfits/remix-jeans-pink.jpg', 'ao_dai', ['hồng', 'trắng', 'quần jeans', 'cách tân'], 'Áo Dài Hạnh', 'https://aodaihanh.com/cach-phoi-ao-dai-cach-tan-mac-voi-quan-vay'),
  editorial('remix-jeans-blue', 'Áo Dài xanh hoa phối jeans rách', '/reference-outfits/remix-jeans-blue.jpg', 'ao_dai', ['xanh lam', 'đen', 'quần jeans', 'cách tân'], 'Áo Dài Hạnh', 'https://aodaihanh.com/cach-phoi-ao-dai-cach-tan-mac-voi-quan-vay'),
  editorial('remix-black-glasses', 'Áo Dài nam đen phối kính hiện đại', '/reference-outfits/remix-glasses.jpg', 'ao_dai', ['đen', 'kính râm', 'cách tân'], 'Znews / Đông Tây Promotion', 'https://lifestyle.zingnews.vn/buoi-ghi-hinh-o-han-quoc-cua-running-man-post1271237.html'),
  editorial('remix-sneaker-bag', 'Áo Dài cam, sneaker và túi đeo chéo', '/reference-outfits/remix-sneaker.webp', 'ao_dai', ['cam', 'trắng', 'sneaker', 'túi', 'cách tân'], 'Bảo Bảo / Lemon8', 'https://www.lemon8-app.com/baobaolioo/7246707165518397954?region=vn'),
];
