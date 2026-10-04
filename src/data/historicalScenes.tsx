import React from 'react';

export interface HistoricalScene {
  id: string;
  name: string;
  shortLabel: string;
  subtitle: string;
  era: string;
  dynastyPeriod: string;
  description: string;
  renderArtwork: () => React.ReactNode;
}

export const HISTORICAL_SCENES: HistoricalScene[] = [
  {
    id: 'hue_citadel',
    name: 'Đại Nội Huế',
    shortLabel: 'Ngọ Môn',
    subtitle: 'Ngọ Môn & Lầu Ngũ Phụng • Cố Đô Huế',
    era: 'Thời Nguyễn',
    dynastyPeriod: '1802 - 1945',
    description: 'Cửa chính phía nam Hoàng Thành Huế với đài cao chữ U bằng đá thanh và lầu Ngũ Phụng mái hoàng lưu ly soi bóng hồ Thái Dịch.',
    renderArtwork: () => (
      <svg viewBox="0 0 1200 800" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor">
        <g strokeWidth="1.2" stroke="#292524" fill="none">
          {/* Distant Mountains & Clouds */}
          <path d="M 0,380 Q 250,320 500,360 Q 750,300 1000,350 Q 1100,330 1200,370" opacity="0.4" strokeDasharray="4 4" />
          <path d="M 100,280 Q 180,260 260,280 Q 320,295 400,280" opacity="0.3" />
          <path d="M 800,260 Q 900,240 1000,265 Q 1080,280 1150,260" opacity="0.3" />

          {/* Imperial Clouds Motif (Vân Mây Cung Đình) */}
          <g opacity="0.45">
            <path d="M 120,220 Q 140,200 170,210 Q 195,190 230,205 Q 260,195 280,220" />
            <path d="M 920,210 Q 950,190 985,205 Q 1020,185 1060,215" />
          </g>

          {/* Meridian Gate (Ngọ Môn) Massive Stone Platform (Đài Ngọ Môn Chữ U) */}
          {/* Main Stone Base Base Lines */}
          <polygon points="200,660 1000,660 980,510 220,510" strokeWidth="1.8" />
          <line x1="200" y1="660" x2="1000" y2="660" strokeWidth="2.2" />
          
          {/* Horizontal Ashlar Stone Blocks Pattern */}
          <line x1="205" y1="630" x2="995" y2="630" strokeWidth="0.8" opacity="0.6" />
          <line x1="210" y1="600" x2="990" y2="600" strokeWidth="0.8" opacity="0.6" />
          <line x1="215" y1="570" x2="985" y2="570" strokeWidth="0.8" opacity="0.6" />
          <line x1="220" y1="540" x2="980" y2="540" strokeWidth="0.8" opacity="0.6" />

          {/* Five Arched Entrances (Ngũ Môn) */}
          {/* 1. Center Arch: Ngọ Môn (Reserved exclusively for the Emperor) */}
          <path d="M 560,660 L 560,575 A 40,40 0 0,1 640,575 L 640,660 Z" strokeWidth="2" />
          <path d="M 565,660 L 565,580 A 35,35 0 0,1 635,580 L 635,660" strokeWidth="0.8" opacity="0.7" />

          {/* 2 & 3. Tả Giáp Môn & Hữu Giáp Môn (For Mandarins) */}
          <path d="M 450,660 L 450,590 A 28,28 0 0,1 506,590 L 506,660 Z" strokeWidth="1.5" />
          <path d="M 694,660 L 694,590 A 28,28 0 0,1 750,590 L 750,660 Z" strokeWidth="1.5" />

          {/* 4 & 5. Tả Dịch Môn & Hữu Dịch Môn (For Soldiers & Horses) */}
          <path d="M 320,660 L 320,605 A 24,24 0 0,1 368,605 L 368,660 Z" strokeWidth="1.2" opacity="0.85" />
          <path d="M 832,660 L 832,605 A 24,24 0 0,1 880,605 L 880,660 Z" strokeWidth="1.2" opacity="0.85" />

          {/* Pavilion of Five Phoenixes (Lầu Ngũ Phụng) Upper Structure */}
          {/* Lower Balustrade */}
          <rect x="230" y="495" width="740" height="15" strokeWidth="1.2" />
          <path d="M 230,495 H 970" strokeWidth="1.5" />
          {/* Pillars of Upper Balcony */}
          {Array.from({ length: 25 }).map((_, i) => (
            <line key={`bal_${i}`} x1={240 + i * 30} y1="495" x2={240 + i * 30} y2="510" strokeWidth="0.8" opacity="0.6" />
          ))}

          {/* First Tier Columns & Screens */}
          {Array.from({ length: 15 }).map((_, i) => (
            <rect key={`col_${i}`} x={280 + i * 45} y="445" width="8" height="50" strokeWidth="1" />
          ))}

          {/* Lower Sweeping Imperial Roof with Curved Eaves */}
          <path d="M 220,448 Q 235,445 270,445 L 930,445 Q 965,445 980,448 Q 995,440 985,420 L 910,405 L 290,405 L 215,420 Q 205,440 220,448 Z" strokeWidth="1.8" />
          
          {/* Tiled Roof Ridges (Hàng ngói âm dương / Lưu ly) */}
          {Array.from({ length: 31 }).map((_, i) => (
            <line key={`tile1_${i}`} x1={295 + i * 20} y1="406" x2={280 + i * 21} y2="445" strokeWidth="0.6" opacity="0.5" />
          ))}

          {/* Second Tier (Middle Higher Pavilion) */}
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={`col2_${i}`} x={420 + i * 45} y="365" width="8" height="40" strokeWidth="1" />
          ))}

          {/* Central Top Emperor's Crown Roof (Mái Lầu Ngũ Phụng - Hoàng Lưu Ly) */}
          <path d="M 370,368 Q 390,365 420,365 L 780,365 Q 810,365 830,368 Q 845,360 835,340 L 760,320 Q 600,312 440,320 L 365,340 Q 355,360 370,368 Z" strokeWidth="2" />
          
          {/* Roof Ridge with Dragon Finials (Bờ Nóc Rồng Chầu) */}
          <path d="M 430,320 Q 600,310 770,320" strokeWidth="2" />
          {/* Sun/Moon Emblem (Mặt Nguyệt) */}
          <circle cx="600" cy="308" r="7" strokeWidth="1.5" />
          <path d="M 590,308 L 575,302 M 610,308 L 625,302" strokeWidth="1.2" />
          {/* Dragon Heads at Roof Tips */}
          <path d="M 435,320 Q 420,305 410,315 Q 425,325 440,322" strokeWidth="1.2" />
          <path d="M 765,320 Q 780,305 790,315 Q 775,325 760,322" strokeWidth="1.2" />

          {/* Thai Dich Lake Lotus & Water Mirror in Foreground */}
          <path d="M 0,720 Q 300,705 600,715 Q 900,705 1200,720" strokeWidth="1.5" opacity="0.7" />
          <path d="M 150,750 Q 350,740 550,748 M 650,748 Q 850,738 1050,750" strokeWidth="0.8" strokeDasharray="6 4" opacity="0.5" />
          
          {/* Lotus Pods on Lake */}
          <path d="M 260,735 C 255,725 275,720 280,735" strokeWidth="0.9" />
          <path d="M 880,740 C 875,730 895,725 900,740" strokeWidth="0.9" />
        </g>
      </svg>
    )
  },
  {
    id: 'thang_long',
    name: 'Hoàng Thành Thăng Long',
    shortLabel: 'Đoan Môn',
    subtitle: 'Đoan Môn & Bậc Rồng • Thăng Long Nghìn Năm',
    era: 'Thời Lý - Lê',
    dynastyPeriod: '1010 - 1789',
    description: 'Cổng Đoan Môn sừng sững dẫn vào Cấm Thành Thăng Long, xây dựng bằng gạch vồ thời Lê sơ với 5 vòm cuốn uy nghiêm.',
    renderArtwork: () => (
      <svg viewBox="0 0 1200 800" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor">
        <g strokeWidth="1.2" stroke="#292524" fill="none">
          {/* Hanoi Flag Tower (Kỳ Đài Thăng Long) in the distance */}
          <g opacity="0.4" strokeWidth="1">
            <polygon points="150,420 220,420 210,340 160,340" />
            <polygon points="165,340 205,340 200,280 170,280" />
            <polygon points="175,280 195,280 190,230 180,230" />
            <line x1="185" y1="230" x2="185" y2="160" strokeWidth="1.5" />
            <path d="M 185,160 Q 210,150 205,170 Q 185,175 185,185" strokeWidth="1" />
          </g>

          {/* Flying Swallows (Chim Én Mùa Xuân Thăng Long) */}
          <g opacity="0.5" strokeWidth="1">
            <path d="M 300,180 Q 315,170 330,185 Q 345,170 360,180" />
            <path d="M 850,150 Q 865,140 880,155 Q 895,140 910,150" />
            <path d="M 940,190 Q 952,182 965,195 Q 978,182 990,190" />
          </g>

          {/* Đoan Môn Main Bastion Wall (Tường Thành Gạch Vồ Xám) */}
          <polygon points="180,680 1020,680 1000,520 200,520" strokeWidth="2" />
          <line x1="180" y1="680" x2="1020" y2="680" strokeWidth="2.4" />

          {/* Brickwork Texture (Gạch Vồ Thời Lê) */}
          <line x1="185" y1="640" x2="1015" y2="640" strokeWidth="0.7" opacity="0.5" />
          <line x1="190" y1="600" x2="1010" y2="600" strokeWidth="0.7" opacity="0.5" />
          <line x1="195" y1="560" x2="1005" y2="560" strokeWidth="0.7" opacity="0.5" />

          {/* Five Grand Archways of Doan Mon */}
          {/* Central Imperial Arch */}
          <path d="M 550,680 L 550,580 A 50,50 0 0,1 650,580 L 650,680 Z" strokeWidth="2.2" />
          <path d="M 556,680 L 556,585 A 44,44 0 0,1 644,585 L 644,680" strokeWidth="0.8" opacity="0.7" />

          {/* Side Arches */}
          <path d="M 430,680 L 430,600 A 35,35 0 0,1 500,600 L 500,680 Z" strokeWidth="1.6" />
          <path d="M 700,680 L 700,600 A 35,35 0 0,1 770,600 L 770,680 Z" strokeWidth="1.6" />

          {/* Outer Arches */}
          <path d="M 310,680 L 310,615 A 30,30 0 0,1 370,615 L 370,680 Z" strokeWidth="1.4" opacity="0.9" />
          <path d="M 830,680 L 830,615 A 30,30 0 0,1 890,615 L 890,680 Z" strokeWidth="1.4" opacity="0.9" />

          {/* Upper Watch Pavilion (Vọng Lâu Đoan Môn) */}
          <rect x="280" y="500" width="640" height="20" strokeWidth="1.2" />
          {/* Battlements / Crenellations */}
          {Array.from({ length: 22 }).map((_, i) => (
            <rect key={`cren_${i}`} x={285 + i * 28} y="488" width="16" height="12" strokeWidth="0.9" />
          ))}

          {/* Pavilion Columns & Walls */}
          {Array.from({ length: 11 }).map((_, i) => (
            <rect key={`col_dm_${i}`} x={360 + i * 48} y="420" width="7" height="68" strokeWidth="1.2" />
          ))}

          {/* Sweeping Eaves of Doan Mon Pavilion (Đao Cong Thăng Long) */}
          <path d="M 310,422 Q 330,420 370,420 L 830,420 Q 870,420 890,422 Q 915,405 900,385 L 820,365 L 380,365 L 300,385 Q 285,405 310,422 Z" strokeWidth="2" />
          
          {/* Second Upper Roof Tier */}
          <path d="M 410,365 L 430,320 L 770,320 L 790,365 Z" strokeWidth="1.5" />
          <path d="M 390,322 Q 410,318 450,318 L 750,318 Q 790,318 810,322 Q 830,305 815,290 L 730,275 L 470,275 L 385,290 Q 370,305 390,322 Z" strokeWidth="1.8" />
          
          {/* Curved Eaves Up-turn (Đao Cong Vút) */}
          <path d="M 385,290 Q 360,270 380,260 Q 400,280 430,280" strokeWidth="1.3" />
          <path d="M 815,290 Q 840,270 820,260 Q 800,280 770,280" strokeWidth="1.3" />

          {/* Ancient Dragon Balustrade (Rồng Đá Điện Kính Thiên) in Foreground */}
          <g opacity="0.6">
            <path d="M 480,720 Q 520,700 560,710 Q 600,700 640,715" strokeWidth="1.6" />
            <path d="M 500,735 Q 550,725 600,730 Q 650,725 700,735" strokeWidth="1.2" strokeDasharray="8 4" />
          </g>
        </g>
      </svg>
    )
  },
  {
    id: 'van_mieu',
    name: 'Văn Miếu Quốc Tử Giám',
    shortLabel: 'Khuê Văn Các',
    subtitle: 'Khuê Văn Các & Giếng Thiên Quang • 1070',
    era: 'Thời Lý - Lê',
    dynastyPeriod: '1070 - Nay',
    description: 'Gác Khuê Văn tròn sao vuông đất biểu trưng cho đỉnh cao hiếu học, soi bóng bên giếng Thiên Quang và vườn bia tiến sĩ ngàn năm.',
    renderArtwork: () => (
      <svg viewBox="0 0 1200 800" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor">
        <g strokeWidth="1.2" stroke="#292524" fill="none">
          {/* Ancient Frangipani & Banyan Branches (Cây Đại Cổ Thụ Văn Miếu) */}
          <g opacity="0.4" strokeWidth="1.1">
            <path d="M 120,450 Q 180,380 240,360 Q 280,300 250,230" />
            <path d="M 240,360 Q 300,340 330,280" />
            <circle cx="250" cy="225" r="5" strokeWidth="0.8" />
            <circle cx="280" cy="275" r="4" strokeWidth="0.8" />
            <path d="M 1080,450 Q 1020,380 960,360 Q 920,300 950,230" />
            <path d="M 960,360 Q 900,340 870,280" />
          </g>

          {/* Square Earth Base (Trụ Đá Vuông Đất Bốn Cột) */}
          <polygon points="400,680 800,680 780,510 420,510" strokeWidth="1.8" />
          <line x1="420" y1="510" x2="780" y2="510" strokeWidth="1.8" />
          {/* Four Stone Pillars */}
          <rect x="440" y="510" width="40" height="170" strokeWidth="1.4" />
          <rect x="520" y="530" width="28" height="150" strokeWidth="1" opacity="0.8" />
          <rect x="652" y="530" width="28" height="150" strokeWidth="1" opacity="0.8" />
          <rect x="720" y="510" width="40" height="170" strokeWidth="1.4" />

          {/* Wooden Upper Pavilion (Lầu Gác Bằng Gỗ Sơn Son) */}
          <rect x="420" y="400" width="360" height="110" strokeWidth="1.6" />
          
          {/* Iconic Round Sunburst Windows (Cửa Sổ Tròn Sao Khuê Tỏa Rạng) */}
          {/* Outer Sun Ring */}
          <circle cx="600" cy="455" r="38" strokeWidth="2" />
          <circle cx="600" cy="455" r="32" strokeWidth="1" strokeDasharray="3 3" />
          {/* Radiating Wooden Rays of the Constellation of Literature */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 600 + Math.cos(angle) * 12;
            const y1 = 455 + Math.sin(angle) * 12;
            const x2 = 600 + Math.cos(angle) * 32;
            const y2 = 455 + Math.sin(angle) * 32;
            return <line key={`ray_${i}`} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.2" />;
          })}
          <circle cx="600" cy="455" r="9" strokeWidth="1.5" />

          {/* Ornate Wooden Brackets & Railings */}
          <path d="M 410,400 H 790" strokeWidth="1.5" />
          <path d="M 430,510 H 770" strokeWidth="1.5" />
          <line x1="420" y1="485" x2="780" y2="485" strokeWidth="0.8" />

          {/* Double-Layered Hipped Roof (Mái Chồng Diêm Gác Khuê Văn) */}
          {/* Lower Roof */}
          <path d="M 370,400 Q 400,395 440,395 L 760,395 Q 800,395 830,400 Q 855,385 835,370 L 760,350 L 440,350 L 365,370 Q 345,385 370,400 Z" strokeWidth="1.8" />
          
          {/* Upper Pavilion Attic */}
          <rect x="460" y="315" width="280" height="35" strokeWidth="1.2" />

          {/* Upper Crown Roof with Ornate Finial */}
          <path d="M 410,315 Q 440,310 470,310 L 730,310 Q 760,310 790,315 Q 815,295 795,275 L 720,255 L 480,255 L 405,275 Q 385,295 410,315 Z" strokeWidth="2" />
          
          {/* Constellation Star Finial on Top (Bình Cam Lộ / Đỉnh Tháp) */}
          <path d="M 590,255 L 600,230 L 610,255 Z" strokeWidth="1.5" />
          <circle cx="600" cy="225" r="4" strokeWidth="1.2" />

          {/* Giếng Thiên Quang (Square Mirror Lake of Heavenly Clarity) */}
          <polygon points="260,750 940,750 900,695 300,695" strokeWidth="1.4" opacity="0.8" />
          <line x1="310" y1="720" x2="890" y2="720" strokeWidth="0.8" strokeDasharray="5 5" opacity="0.6" />
          
          {/* Stone Turtle Stele Silhouette in the Courtyard (Rùa Đội Bia Tiến Sĩ) */}
          <g opacity="0.5" strokeWidth="1">
            <rect x="220" y="610" width="18" height="32" rx="2" />
            <ellipse cx="229" cy="646" rx="16" ry="6" />
            <rect x="960" y="610" width="18" height="32" rx="2" />
            <ellipse cx="969" cy="646" rx="16" ry="6" />
          </g>
        </g>
      </svg>
    )
  },
  {
    id: 'chua_mot_cot',
    name: 'Chùa Một Cột',
    shortLabel: 'Diên Hựu Tự',
    subtitle: 'Liên Hoa Đài • Thời Lý (1049)',
    era: 'Thời Lý',
    dynastyPeriod: '1049 - 1400',
    description: 'Đóa sen nghìn năm ngự trên trụ đá độc nhất giữa hồ Linh Chiểu, do Vua Lý Thái Tông khởi dựng sau giấc mộng Bồ Tát Quan Âm.',
    renderArtwork: () => (
      <svg viewBox="0 0 1200 800" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor">
        <g strokeWidth="1.2" stroke="#292524" fill="none">
          {/* Soft Ancient Bamboo & Willows (Rặng Tre Ngà & Liễu Rủ) */}
          <g opacity="0.35" strokeWidth="1">
            <path d="M 80,600 Q 140,400 110,200" />
            <path d="M 120,620 Q 180,420 160,220" />
            <path d="M 1080,600 Q 1020,400 1050,200" />
            <path d="M 1120,620 Q 1060,420 1090,220" />
          </g>

          {/* Linh Chieu Lake (Hồ Linh Chiểu Nước Trong Xanh) */}
          <polygon points="150,740 1050,740 980,620 220,620" strokeWidth="1.5" />
          <path d="M 230,660 Q 600,650 970,660" strokeWidth="0.8" opacity="0.6" />
          <path d="M 180,700 Q 600,690 1020,700" strokeWidth="0.8" strokeDasharray="6 4" opacity="0.5" />

          {/* Abundant Lotus Flowers & Leaves in Lake (Ao Sen Nở Rộ) */}
          <g opacity="0.7" strokeWidth="1">
            <ellipse cx="320" cy="670" rx="35" ry="12" />
            <ellipse cx="400" cy="710" rx="45" ry="15" />
            <ellipse cx="800" cy="680" rx="40" ry="14" />
            <ellipse cx="880" cy="720" rx="48" ry="16" />
            {/* Lotus Blooms */}
            <path d="M 360,670 C 350,650 370,640 375,670" strokeWidth="1.3" />
            <path d="M 840,680 C 830,658 855,648 860,680" strokeWidth="1.3" />
          </g>

          {/* Single Stone Pillar (Trụ Đá Độc Nhất Đường Kính 1m2 Thời Lý) */}
          <rect x="565" y="470" width="70" height="170" strokeWidth="2" />
          {/* Stone Texture & Joints */}
          <line x1="565" y1="530" x2="635" y2="530" strokeWidth="1" opacity="0.7" />
          <line x1="565" y1="590" x2="635" y2="590" strokeWidth="1" opacity="0.7" />

          {/* Lotus Bracket Cantilevers (Hệ Thống Đấu Củng Cánh Sen Vươn Lên) */}
          {/* Diagonal Wooden Brackets supporting the shrine */}
          <path d="M 565,510 L 460,420" strokeWidth="2" />
          <path d="M 635,510 L 740,420" strokeWidth="2" />
          <path d="M 580,540 L 490,440" strokeWidth="1.6" />
          <path d="M 620,540 L 710,440" strokeWidth="1.6" />

          {/* Petals of the Lotus Form (Cánh Sen Ôm Chân Chùa) */}
          <path d="M 460,440 Q 520,490 565,470" strokeWidth="1.5" />
          <path d="M 740,440 Q 680,490 635,470" strokeWidth="1.5" />

          {/* Lianhua Pavilion (Liên Hoa Đài - Ngôi Chùa Vuông Gỗ) */}
          <rect x="470" y="340" width="260" height="90" strokeWidth="2" />
          <line x1="470" y1="415" x2="730" y2="415" strokeWidth="1" />
          
          {/* Sanctuary Doors (Cửa Bức Bàn Thời Lý) */}
          <rect x="560" y="350" width="80" height="65" strokeWidth="1.5" />
          <line x1="600" y1="350" x2="600" y2="415" strokeWidth="1" />

          {/* Elegant Four-Sided Curved Roof (Mái Chùa Đao Cong Vút) */}
          <path d="M 420,345 Q 460,340 500,340 L 700,340 Q 740,340 780,345 Q 825,315 790,285 L 700,250 L 500,250 L 410,285 Q 375,315 420,345 Z" strokeWidth="2.2" />
          
          {/* Curved Eaves Upward Turn (Đao Bay Uốn Lượn) */}
          <path d="M 410,285 Q 365,255 395,240 Q 425,265 460,265" strokeWidth="1.6" />
          <path d="M 790,285 Q 835,255 805,240 Q 775,265 740,265" strokeWidth="1.6" />

          {/* Sacred Flame Lotus Finial (Bầu Rượu Cam Lộ Ngọn Lửa Thiêng) */}
          <path d="M 590,250 L 600,215 L 610,250 Z" strokeWidth="1.8" />
          <circle cx="600" cy="208" r="5" strokeWidth="1.4" />
          
          {/* Dragon Ridge Lines */}
          <line x1="500" y1="250" x2="600" y2="215" strokeWidth="1.2" />
          <line x1="700" y1="250" x2="600" y2="215" strokeWidth="1.2" />
        </g>
      </svg>
    )
  },
  {
    id: 'hoa_lu',
    name: 'Cố Đô Hoa Lư',
    shortLabel: 'Nghi Môn Đá',
    subtitle: 'Đền Vua Đinh - Lê • Núi Non Trùng Điệp',
    era: 'Thời Đinh - Tiền Lê',
    dynastyPeriod: '968 - 1009',
    description: 'Kinh đô đá hiểm trở giữa muôn trùng non nước Trường Yên, dấu ấn thời kỳ Vua Đinh Tiên Hoàng dựng nước Đại Cồ Việt.',
    renderArtwork: () => (
      <svg viewBox="0 0 1200 800" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor">
        <g strokeWidth="1.2" stroke="#292524" fill="none">
          {/* Karst Limestone Mountains of Hoa Lu (Dãy Núi Mã Yên & Trường Yên) */}
          <path d="M 0,420 Q 150,220 280,260 Q 400,160 520,300 Q 650,140 800,280 Q 950,180 1080,290 L 1200,380" strokeWidth="1.8" opacity="0.45" />
          <path d="M 80,430 Q 220,300 340,330 Q 460,250 580,360 Q 720,220 860,340 Q 1000,260 1140,390" strokeWidth="1.2" strokeDasharray="6 4" opacity="0.3" />

          {/* Ancient Dragon Boat River (Sông Sào Khê Dưới Chân Núi) */}
          <path d="M 0,560 Q 300,520 600,540 Q 900,520 1200,560" strokeWidth="1" opacity="0.5" />
          <path d="M 120,590 Q 400,570 700,585 M 800,585 Q 1000,575 1150,590" strokeWidth="0.7" opacity="0.4" />

          {/* Three-Entrance Stone Gate (Nghi Môn Ngoại Cố Đô Hoa Lư) */}
          {/* Heavy Stone Foundation */}
          <rect x="250" y="650" width="700" height="25" strokeWidth="2" />
          <line x1="250" y1="675" x2="950" y2="675" strokeWidth="2.5" />

          {/* Central Gate Columns & Arch */}
          <rect x="520" y="470" width="35" height="180" strokeWidth="1.8" />
          <rect x="645" y="470" width="35" height="180" strokeWidth="1.8" />
          <path d="M 520,540 Q 600,510 680,540" strokeWidth="2" />
          <line x1="520" y1="470" x2="680" y2="470" strokeWidth="2" />

          {/* Side Wing Columns (Tả Hữu Môn) */}
          <rect x="360" y="520" width="28" height="130" strokeWidth="1.5" />
          <rect x="440" y="520" width="28" height="130" strokeWidth="1.5" />
          <path d="M 360,570 Q 414,550 468,570" strokeWidth="1.5" />

          <rect x="732" y="520" width="28" height="130" strokeWidth="1.5" />
          <rect x="812" y="520" width="28" height="130" strokeWidth="1.5" />
          <path d="M 732,570 Q 786,550 840,570" strokeWidth="1.5" />

          {/* Curved Tiled Roof of the Center Gate */}
          <path d="M 480,470 Q 520,465 550,465 L 650,465 Q 680,465 720,470 Q 745,445 725,430 L 660,415 L 540,415 L 475,430 Q 455,445 480,470 Z" strokeWidth="2" />
          
          {/* Side Roofs */}
          <path d="M 330,520 Q 414,510 498,520 Q 515,500 500,490 L 460,480 L 370,480 L 328,490 Q 315,500 330,520 Z" strokeWidth="1.6" />
          <path d="M 702,520 Q 786,510 870,520 Q 885,500 870,490 L 830,480 L 740,480 L 700,490 Q 685,500 702,520 Z" strokeWidth="1.6" />

          {/* King Dinh's Ancient Dragon Stone Bed (Sập Đá Rồng Hoa Lư) */}
          <g opacity="0.6">
            <polygon points="500,725 700,725 680,695 520,695" strokeWidth="1.8" />
            <path d="M 520,705 Q 600,695 680,705" strokeWidth="1.2" />
          </g>
        </g>
      </svg>
    )
  },
  {
    id: 'pure_canvas',
    name: 'Canvas Tinh Khôi',
    shortLabel: 'Thanh Khiết',
    subtitle: 'Bạch Sa • Nền Lụa Tự Nhiên Không Bối Cảnh',
    era: 'Đại Việt Cổ Phục',
    dynastyPeriod: 'Đương Đại',
    description: 'Không gian tĩnh lặng nguyên bản, làm nổi bật trọn vẹn từng thớ lụa, đường chỉ và hoa văn y phục cổ.',
    renderArtwork: () => (
      <svg viewBox="0 0 1200 800" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor">
        <g strokeWidth="0.8" stroke="#292524" opacity="0.2" fill="none">
          {/* Minimalist Vietnamese Border Keyfret Watermark (Hoa Văn Hồi Văn Kỷ Hà) */}
          <rect x="40" y="40" width="1120" height="720" strokeWidth="0.6" strokeDasharray="16 8" />
          <rect x="52" y="52" width="1096" height="696" strokeWidth="0.4" />
          {/* Four Corner Ancient Cloud Motifs */}
          <path d="M 60,90 Q 75,70 100,75 Q 120,60 140,80" />
          <path d="M 1140,90 Q 1125,70 1100,75 Q 1080,60 1060,80" />
          <path d="M 60,710 Q 75,730 100,725 Q 120,740 140,720" />
          <path d="M 1140,710 Q 1125,730 1100,725 Q 1080,740 1060,720" />
        </g>
      </svg>
    )
  }
];
