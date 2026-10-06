import { ArrowUpRight, Camera } from 'lucide-react';

interface Props {
  onOpen?: () => void;
}

export function TryOnWebsiteLink({ onOpen }: Props) {
  return (
    <a
      id="nav-try-on-website-link"
      href="https://thudooo-rho.vercel.app/"
      target="_blank"
      rel="noopener noreferrer"
      onClick={onOpen}
      aria-label="Thử đồ với camera — mở trong tab mới"
      title="Mở phòng thử đồ trong tab mới"
      className="
        group inline-flex min-h-11 md:min-h-9 shrink-0
        items-center justify-center gap-2 rounded-full
        border border-[#b98d4f]/50 bg-[#f4e8d0]
        px-3.5 py-1 text-xs font-semibold text-[#765020]
        shadow-xs transition-colors
        hover:border-[#996515] hover:bg-[#ecdbb8]
        focus-visible:outline-2
        focus-visible:outline-offset-4
        focus-visible:outline-[#996515]
      "
    >
      <span
        className="
          flex size-6 shrink-0 items-center justify-center
          rounded-full bg-[#996515] text-[#fff8ed]
        "
      >
        <Camera size={14} aria-hidden="true" />
      </span>

      <span className="hidden sm:inline">
        Thử đồ với camera
      </span>
      <span className="sm:hidden">Thử đồ</span>

      <ArrowUpRight
        size={15}
        aria-hidden="true"
        className="shrink-0"
      />
    </a>
  );
}