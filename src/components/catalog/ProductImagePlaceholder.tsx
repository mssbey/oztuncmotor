/** Ürüne henüz fotoğraf eklenmediğinde gösterilen sade yer tutucu. */
export function ProductImagePlaceholder({ label = "Fotoğraf yakında" }: { label?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#a3a69f]">
      <svg width="96" height="56" viewBox="0 0 96 56" fill="none" aria-hidden>
        <circle cx="20" cy="38" r="14" stroke="currentColor" strokeWidth="3" />
        <circle cx="76" cy="38" r="14" stroke="currentColor" strokeWidth="3" />
        <path d="M20 38 34 18h22l20 20M56 18l-6-10h-8M58 10h10l4 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-xs font-bold uppercase tracking-[0.16em]">{label}</span>
    </div>
  );
}
