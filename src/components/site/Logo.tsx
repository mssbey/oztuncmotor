import Image from "next/image";

type Props = {
  logo?: { url: string; width: number; height: number; alt: string } | null;
  compact?: boolean;
  tone?: "light" | "dark";
};

/** Yüklenmiş logo varsa onu, yoksa yazı logosunu gösterir. */
export function Logo({ logo, compact = false, tone = "light" }: Props) {
  if (logo) {
    const h = compact ? 32 : 40;
    return (
      <Image
        src={logo.url}
        alt="Öztunç Motor"
        width={Math.round((logo.width / logo.height) * h)}
        height={h}
        className="h-8 w-auto lg:h-10"
        priority
      />
    );
  }
  return (
    <span
      className={`font-display inline-flex items-center gap-2 leading-none uppercase select-none ${
        tone === "light" ? "text-white" : "text-text"
      }`}
    >
      <span aria-hidden className="h-6 w-1.5 -skew-x-12 bg-accent" />
      <span
        className={`font-bold tracking-[0.04em] transition-[font-size] duration-200 ${
          compact ? "text-[1.45rem]" : "text-[1.7rem]"
        }`}
      >
        Öztunç
      </span>
      <span
        className={`font-medium tracking-[0.22em] transition-[font-size] duration-200 ${
          compact ? "text-[0.95rem]" : "text-[1.05rem]"
        } ${tone === "light" ? "text-muted-dark" : "text-muted"}`}
      >
        Motor
      </span>
    </span>
  );
}
