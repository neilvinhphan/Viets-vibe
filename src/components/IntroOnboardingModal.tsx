import React, { useState, useEffect, useCallback, useRef } from "react";

export interface IntroOnboardingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onComplete?: () => void;
  onStart?: () => void;
  onEnterStudio?: () => void;
  onEnter3D?: () => void;
  [key: string]: unknown;
}

type PortalPhase = "idle" | "locking" | "opening" | "done";

/**
 * Âm thanh Trống Đồng Đông Sơn & Chuông đồng ngân vang khi chạm khai mở
 */
function playBronzeDrumResonance() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // 1. Tiếng trống đồng trầm hùng (68Hz -> 32Hz)
    const drumOsc = ctx.createOscillator();
    const drumGain = ctx.createGain();
    drumOsc.type = "sine";
    drumOsc.frequency.setValueAtTime(68, now);
    drumOsc.frequency.exponentialRampToValueAtTime(32, now + 1.5);

    drumGain.gain.setValueAtTime(0.6, now);
    drumGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

    drumOsc.connect(drumGain);
    drumGain.connect(ctx.destination);
    drumOsc.start(now);
    drumOsc.stop(now + 1.65);

    // 2. Tiếng khớp khóa đồng & âm bội kim khí khi bung cổng (0.42s)
    [196, 293.66, 392, 587.33].forEach((freq, idx) => {
      const overtone = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      overtone.type = idx % 2 === 0 ? "triangle" : "sine";
      overtone.frequency.setValueAtTime(freq, now + 0.42);

      overtoneGain.gain.setValueAtTime(0.0001, now);
      overtoneGain.gain.setValueAtTime(0.11 / (idx + 1), now + 0.42);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      overtone.connect(overtoneGain);
      overtoneGain.connect(ctx.destination);
      overtone.start(now + 0.42);
      overtone.stop(now + 2.25);
    });
  } catch {
    // Bỏ qua nếu trình duyệt chặn âm thanh
  }
}

// Dữ liệu góc xoay cho các vành hoa văn Trống Đồng Ngọc Lũ
const SUN_RAYS_14 = Array.from({ length: 14 }, (_, i) => (i * 360) / 14);
const LAC_BIRDS_12 = Array.from({ length: 12 }, (_, i) => i * 30);
const MEANDER_24 = Array.from({ length: 24 }, (_, i) => i * 15);
const TANGENT_CIRCLES_36 = Array.from({ length: 36 }, (_, i) => i * 10);
const SAWTOOTH_72 = Array.from({ length: 72 }, (_, i) => i * 5);
const COMB_TICKS_144 = Array.from({ length: 144 }, (_, i) => i * 2.5);

export const IntroOnboardingModal: React.FC<IntroOnboardingModalProps> = ({
  isOpen = true,
  onClose,
  onComplete,
  onStart,
  onEnterStudio,
}) => {
  const [phase, setPhase] = useState<PortalPhase>("idle");
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const finishIntro = useCallback(() => {
    setPhase("done");
    if (onEnterStudio) onEnterStudio();
    else if (onStart) onStart();
    if (onComplete) onComplete();
    if (onClose) onClose();
  }, [onClose, onComplete, onEnterStudio, onStart]);

  const triggerPortalUnlock = useCallback(() => {
    if (phase !== "idle") return;

    playBronzeDrumResonance();

    // Pha 1: Xoay khớp khóa 3 vòng đồng tâm (0ms -> 520ms)
    setPhase("locking");

    // Pha 2: Bung giãn mặt trống xuyên tâm & vén mây (520ms -> 1650ms)
    const t1 = window.setTimeout(() => {
      setPhase("opening");
    }, 520);

    // Pha 3: Hoàn tất và vào thẳng không gian chính
    const t2 = window.setTimeout(() => {
      finishIntro();
    }, 1650);

    timersRef.current.push(t1, t2);
  }, [finishIntro, phase]);

  if (!isOpen || phase === "done") return null;

  const isLocking = phase === "locking";
  const isOpening = phase === "opening";

  return (
    <div
      onClick={triggerPortalUnlock}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") triggerPortalUnlock();
      }}
      aria-label="Chạm để khai mở không gian Việt Phục"
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden select-none cursor-pointer transition-opacity duration-700 ${
        isOpening ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(circle at 50% 50%, #261810 0%, #140c08 56%, #090504 100%)",
      }}
    >
      {/* --- QUầng SÁNG TÂM TRỐNG ĐỒNG --- */}
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-1000 ease-out ${
          isOpening
            ? "w-[200vw] h-[200vw] opacity-95 bg-amber-300/35 blur-3xl"
            : isLocking
              ? "w-[560px] h-[560px] opacity-85 bg-amber-500/30 blur-2xl"
              : "w-[380px] h-[380px] opacity-45 bg-amber-600/15 blur-2xl"
        }`}
      />

      {/* --- VÂN MÂY CỔ 2 BÊN VÉN MỞ SANG TRÁI / PHẢI --- */}
      {/* Cụm mây bên trái */}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-1/2 flex flex-col justify-between p-4 sm:p-10 transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpening
            ? "-translate-x-[130%] scale-110 opacity-0"
            : isLocking
              ? "-translate-x-4"
              : "translate-x-0"
        }`}
      >
        <svg
          viewBox="0 0 460 190"
          className="w-60 sm:w-96 md:w-[440px] text-amber-500/30 fill-none stroke-current"
        >
          <path
            d="M10,145 C42,92 102,92 128,128 C152,68 232,68 262,122 C298,86 358,104 382,145 C408,122 438,132 452,160"
            strokeWidth="1.6"
          />
          <path
            d="M28,166 C72,122 124,126 158,152 C192,104 258,108 288,148 C320,124 368,132 402,166"
            strokeWidth="1.1"
            strokeDasharray="5 4"
          />
          <path
            d="M85,112 C102,96 126,102 128,120 C130,134 112,142 100,132"
            strokeWidth="1.3"
          />
          <path
            d="M210,104 C232,86 258,94 260,114 C262,130 242,138 228,126"
            strokeWidth="1.3"
          />
        </svg>

        <svg
          viewBox="0 0 460 190"
          className="w-64 sm:w-[400px] md:w-[460px] text-amber-500/30 fill-none stroke-current transform -scale-y-100"
        >
          <path
            d="M10,145 C42,92 102,92 128,128 C152,68 232,68 262,122 C298,86 358,104 382,145 C408,122 438,132 452,160"
            strokeWidth="1.6"
          />
          <path
            d="M28,166 C72,122 124,126 158,152 C192,104 258,108 288,148"
            strokeWidth="1.1"
          />
          <path
            d="M150,108 C172,90 198,98 200,118 C202,134 182,142 168,130"
            strokeWidth="1.3"
          />
        </svg>
      </div>

      {/* Cụm mây bên phải */}
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-1/2 flex flex-col justify-between items-end p-4 sm:p-10 transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpening
            ? "translate-x-[130%] scale-110 opacity-0"
            : isLocking
              ? "translate-x-4"
              : "translate-x-0"
        }`}
      >
        <svg
          viewBox="0 0 460 190"
          className="w-60 sm:w-96 md:w-[440px] text-amber-500/30 fill-none stroke-current transform -scale-x-100"
        >
          <path
            d="M10,145 C42,92 102,92 128,128 C152,68 232,68 262,122 C298,86 358,104 382,145 C408,122 438,132 452,160"
            strokeWidth="1.6"
          />
          <path
            d="M28,166 C72,122 124,126 158,152 C192,104 258,108 288,148 C320,124 368,132 402,166"
            strokeWidth="1.1"
            strokeDasharray="5 4"
          />
          <path
            d="M210,104 C232,86 258,94 260,114 C262,130 242,138 228,126"
            strokeWidth="1.3"
          />
        </svg>

        <svg
          viewBox="0 0 460 190"
          className="w-64 sm:w-[400px] md:w-[460px] text-amber-500/30 fill-none stroke-current transform -scale-x-100 -scale-y-100"
        >
          <path
            d="M10,145 C42,92 102,92 128,128 C152,68 232,68 262,122 C298,86 358,104 382,145 C408,122 438,132 452,160"
            strokeWidth="1.6"
          />
          <path
            d="M28,166 C72,122 124,126 158,152 C192,104 258,108 288,148"
            strokeWidth="1.1"
          />
          <path
            d="M150,108 C172,90 198,98 200,118 C202,134 182,142 168,130"
            strokeWidth="1.3"
          />
        </svg>
      </div>

      {/* --- TRUNG TÂM: TRỐNG ĐỒNG ĐÔNG SƠN (NGỌC LŨ) & TÊN DỰ ÁN --- */}
      <div className="relative z-10 w-[330px] h-[330px] sm:w-[490px] sm:h-[490px] md:w-[580px] md:h-[580px] flex items-center justify-center group">
        {/* VÀNH NGOÀI (RING 3): Răng cưa, Răng lược & Vòng tròn đồng tâm tiếp tuyến */}
        <svg
          viewBox="0 0 600 600"
          className={`absolute inset-0 w-full h-full transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isOpening
              ? "duration-1000 scale-[14] rotate-[105deg] opacity-0"
              : isLocking
                ? "duration-500 scale-105 rotate-[45deg] text-amber-300"
                : "duration-700 scale-100 rotate-0 text-amber-500/75 group-hover:text-amber-400/95 group-hover:scale-[1.02]"
          }`}
        >
          <g
            className={
              phase === "idle"
                ? "origin-center animate-[spin_75s_linear_infinite_reverse]"
                : "origin-center"
            }
          >
            {/* Gờ mép trống đôi */}
            <circle
              cx="300"
              cy="300"
              r="294"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            />
            <circle
              cx="300"
              cy="300"
              r="288"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />

            {/* Vành hoa văn răng cưa (72 tam giác cân hướng tâm) */}
            {SAWTOOTH_72.map((deg) => (
              <polygon
                key={`saw_${deg}`}
                points="294,14 300,26 306,14"
                fill="currentColor"
                fillOpacity="0.7"
                transform={`rotate(${deg} 300 300)`}
              />
            ))}
            <circle
              cx="300"
              cy="300"
              r="274"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />

            {/* Vành văn răng lược (144 vạch ngắn song song) */}
            {COMB_TICKS_144.map((deg) => (
              <line
                key={`comb_${deg}`}
                x1="300"
                y1="27"
                x2="300"
                y2="37"
                stroke="currentColor"
                strokeWidth="1.2"
                transform={`rotate(${deg} 300 300)`}
              />
            ))}
            <circle
              cx="300"
              cy="300"
              r="262"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />

            {/* Vành vòng tròn đồng tâm chấm giữa có tiếp tuyến (36 mắt xích) */}
            {TANGENT_CIRCLES_36.map((deg) => (
              <g key={`tang_${deg}`} transform={`rotate(${deg} 300 300)`}>
                <circle
                  cx="300"
                  cy="50"
                  r="7.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <circle
                  cx="300"
                  cy="50"
                  r="3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.9"
                />
                <circle cx="300" cy="50" r="1.6" fill="currentColor" />
                <line
                  x1="305"
                  y1="44"
                  x2="338"
                  y2="57"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </g>
            ))}
            <circle
              cx="300"
              cy="300"
              r="238"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <circle
              cx="300"
              cy="300"
              r="232"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeDasharray="2 5"
            />
          </g>
        </svg>

        {/* VÀNH GIỮA (RING 2): 12 Chim Lạc Đông Sơn chuẩn khảo cổ & Vành Hồi Văn Chữ S */}
        <svg
          viewBox="0 0 600 600"
          className={`absolute inset-0 w-full h-full transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isOpening
              ? "duration-1000 scale-[9.5] -rotate-[130deg] opacity-0"
              : isLocking
                ? "duration-500 scale-95 -rotate-[60deg] text-amber-200"
                : "duration-700 scale-100 rotate-0 text-amber-400/90 group-hover:text-amber-300"
          }`}
        >
          <g
            className={
              phase === "idle"
                ? "origin-center animate-[spin_48s_linear_infinite]"
                : "origin-center"
            }
          >
            <circle
              cx="300"
              cy="300"
              r="224"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />

            {/* 12 Chim Lạc Đông Sơn (Mỏ dài, mào vươn sau, cánh khắc lông vũ, đuôi & chân dài) */}
            {LAC_BIRDS_12.map((deg) => (
              <g key={`lac_${deg}`} transform={`rotate(${deg} 300 300)`}>
                {/* Thân, cổ vươn và mỏ dài hướng ngược chiều kim đồng hồ */}
                <path
                  d="M326,102 L292,102 Q278,102 270,96 L246,96"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                />
                {/* Đầu chim & mắt chấm tròn */}
                <circle cx="272" cy="96" r="3" fill="currentColor" />
                {/* Mào chim Lạc uốn cong ra phía sau */}
                <path
                  d="M273,94 Q286,84 302,87"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* Cánh trên dang rộng và các nan lông vũ */}
                <path
                  d="M292,102 Q304,80 328,79 L318,98 Z"
                  fill="currentColor"
                  fillOpacity="0.28"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <line
                  x1="302"
                  y1="90"
                  x2="318"
                  y2="83"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <line
                  x1="306"
                  y1="95"
                  x2="322"
                  y2="89"
                  stroke="currentColor"
                  strokeWidth="1"
                />

                {/* Cánh dưới dang rộng và các nan lông vũ */}
                <path
                  d="M292,102 Q304,124 328,125 L318,106 Z"
                  fill="currentColor"
                  fillOpacity="0.28"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <line
                  x1="302"
                  y1="114"
                  x2="318"
                  y2="121"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <line
                  x1="306"
                  y1="109"
                  x2="322"
                  y2="115"
                  stroke="currentColor"
                  strokeWidth="1"
                />

                {/* Chân dài & Đuôi xòe phía sau */}
                <path
                  d="M318,100 L346,95 M318,104 L348,108 M318,102 L342,102"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />

                {/* Hoa văn chấm tròn đồng tâm xen giữa các chim Lạc */}
                <circle
                  cx="240"
                  cy="108"
                  r="4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.1"
                />
                <circle cx="240" cy="108" r="1.5" fill="currentColor" />
              </g>
            ))}

            <circle
              cx="300"
              cy="300"
              r="168"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <circle
              cx="300"
              cy="300"
              r="162"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />

            {/* Vành Hồi Văn Chữ S Gãy & Kỷ Hà (24 cụm) */}
            {MEANDER_24.map((deg) => (
              <g key={`meander_${deg}`} transform={`rotate(${deg} 300 300)`}>
                <path
                  d="M290,144 L298,144 L298,154 L308,154"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                />
                <circle cx="303" cy="147" r="1.3" fill="currentColor" />
                <circle cx="293" cy="151" r="1.3" fill="currentColor" />
              </g>
            ))}

            <circle
              cx="300"
              cy="300"
              r="138"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle
              cx="300"
              cy="300"
              r="131"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeDasharray="3 4"
            />
          </g>
        </svg>

        {/* TÂM TRỐNG (RING 1): Ngôi Sao 14 Cánh & Họa Tiết Lông Công Xen Kẽ */}
        <svg
          viewBox="0 0 600 600"
          className={`absolute inset-0 w-full h-full transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isOpening
              ? "duration-900 scale-[6] rotate-[90deg] opacity-0"
              : isLocking
                ? "duration-500 scale-110 rotate-[90deg] text-amber-100 drop-shadow-[0_0_28px_rgba(251,191,36,0.85)]"
                : "duration-500 scale-100 rotate-0 text-amber-300 group-hover:scale-105"
          }`}
        >
          <circle
            cx="300"
            cy="300"
            r="124"
            className="fill-[#180f0a]/95"
            stroke="currentColor"
            strokeWidth="2.2"
          />
          <circle
            cx="300"
            cy="300"
            r="118"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />

          {/* 14 Cánh Sao Nổi & 14 Họa Tiết Lông Công Kẹp Giữa */}
          {SUN_RAYS_14.map((deg) => (
            <g key={`star_${deg}`} transform={`rotate(${deg} 300 300)`}>
              {/* Cánh sao chính */}
              <polygon
                points="300,182 289,262 311,262"
                fill="currentColor"
                fillOpacity="0.92"
              />
              {/* Sống nổi giữa cánh sao */}
              <line
                x1="300"
                y1="182"
                x2="300"
                y2="300"
                stroke="#180f0a"
                strokeWidth="1.2"
              />

              {/* Họa tiết Lông Công (Peacock Feather Chevrons) xen giữa 2 cánh sao */}
              <g transform="rotate(12.857 300 300)">
                <path
                  d="M291,188 L300,224 L309,188"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M294,186 L300,210 L306,186"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.1"
                />
                <path
                  d="M297,185 L300,198 L303,185"
                  fill="currentColor"
                  fillOpacity="0.75"
                />
              </g>
            </g>
          ))}

          {/* U nổi tròn tâm trống bảo vệ chữ trung tâm */}
          <circle
            cx="300"
            cy="300"
            r="74"
            className="fill-[#120b07]/95"
            stroke="currentColor"
            strokeWidth="2.4"
          />
          <circle
            cx="300"
            cy="300"
            r="68"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        </svg>

        {/* --- TÊN DỰ ÁN NẰM CHÍNH GIỮA TÂM TRỐNG ĐỒNG --- */}
        <div
          className={`relative z-20 flex flex-col items-center justify-center text-center px-3 p-8 rounded-full bg-[radial-gradient(circle,rgba(20,10,5,0.85)_30%,rgba(20,10,5,0.4)_70%,transparent_100%)] pointer-events-none transition-all duration-500 ${
            isOpening
              ? "scale-150 opacity-0"
              : isLocking
                ? "scale-110 text-amber-100"
                : "scale-100 opacity-100"
          }`}
        >
          <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.28em] text-amber-400/90 font-semibold">
            Gen Z Studio
          </span>
          <h1 className="font-royal text-base sm:text-2xl md:text-[26px] font-bold text-amber-100 tracking-wider leading-tight my-0.5 sm:my-1 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
            VIỆT VIBE
          </h1>
          <div className="w-10 sm:w-14 h-px bg-gradient-to-r from-transparent via-amber-400/80 to-transparent my-0.5 sm:my-1" />
          <span className="text-[8.5px] sm:text-[10.5px] uppercase tracking-[0.2em] text-amber-300 font-medium animate-pulse mt-0.5">
            {isLocking ? "Đang Khai Mở..." : "Chạm Khai Mở"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default IntroOnboardingModal;
