import Image from "next/image";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textDark?: boolean;
  className?: string;
}

export function BrandLogo({
  size = "md",
  showText = true,
  textDark = true,
  className = "",
}: BrandLogoProps) {
  const emblemSizes = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  const px = emblemSizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="relative shrink-0 rounded-full p-0.5 shadow-sm border border-slate-200/80 bg-white flex items-center justify-center overflow-hidden"
        style={{ width: px, height: px }}
      >
        <Image
          src="/images/logo-kemnaker.svg"
          alt="Logo Kemnaker RI"
          width={px}
          height={px}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight leading-tight ${
                size === "sm"
                  ? "text-xs"
                  : size === "md"
                  ? "text-sm"
                  : size === "lg"
                  ? "text-base"
                  : "text-lg"
              } ${textDark ? "text-slate-900" : "text-white"}`}
            >
              SIMPEG
            </span>
            <span className="px-1.5 py-0.2 bg-[#FBBF24]/20 border border-[#FBBF24]/50 rounded text-[9px] font-bold text-[#D97706]">
              BPVP
            </span>
          </div>
          <p
            className={`text-[11px] font-semibold leading-tight tracking-tight truncate ${
              textDark ? "text-[#003399]" : "text-blue-100"
            }`}
          >
            BPVP Banda Aceh
          </p>
          <p
            className={`text-[9px] font-medium leading-none mt-0.5 truncate ${
              textDark ? "text-slate-500" : "text-blue-200/80"
            }`}
          >
            Kementerian Ketenagakerjaan RI
          </p>
        </div>
      )}
    </div>
  );
}
