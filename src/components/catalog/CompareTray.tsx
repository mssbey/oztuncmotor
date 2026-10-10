"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Close } from "@/components/icons";
import { COMPARE_LIMIT, useCompare } from "./compare-store";

/** Seçili model varken ekranın altında beliren karşılaştırma çubuğu. */
export function CompareTray() {
  const { items, clear } = useCompare();
  const pathname = usePathname();
  if (items.length === 0 || pathname.startsWith("/karsilastir")) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 lg:bottom-6">
      <div className="container-x flex justify-center">
        <div
          role="region"
          aria-label="Karşılaştırma seçimi"
          className="on-dark animate-fade-up pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-[10px] border border-line-dark bg-surface p-2 pl-4 text-white shadow-[0_12px_32px_rgb(0_0_0/0.3)]"
        >
          <p className="flex-1 text-sm font-semibold">
            <span className="text-accent">{items.length}</span> / {COMPARE_LIMIT} model seçildi
          </p>
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Karşılaştırma seçimini temizle"
          >
            <Close size={18} />
          </button>
          <Link href={`/karsilastir?modeller=${items.join(",")}`} className="btn btn-primary btn-sm">
            Karşılaştır <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
