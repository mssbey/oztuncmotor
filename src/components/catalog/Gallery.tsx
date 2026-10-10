"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { ProductImagePlaceholder } from "./ProductImagePlaceholder";

type Img = { id: string; url: string; width: number; height: number; alt: string };

export function Gallery({ images, title }: { images: Img[]; title: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index];
  const go = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <div>
      <div
        className="studio-floor relative aspect-[4/3] overflow-hidden rounded-[10px] border border-line"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
      >
        {current ? (
          <Image
            key={current.id}
            src={current.url}
            alt={current.alt || title}
            fill
            priority
            quality={85}
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="animate-fade-up object-contain p-4 sm:p-8"
            style={{ maxWidth: current.width, marginInline: "auto" }}
          />
        ) : (
          <ProductImagePlaceholder />
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/90 text-text shadow-sm hover:bg-white"
              aria-label="Önceki fotoğraf"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/90 text-text shadow-sm hover:bg-white"
              aria-label="Sonraki fotoğraf"
            >
              <ChevronRight size={22} />
            </button>
            <p className="absolute bottom-3 right-3 rounded bg-white/90 px-2 py-0.5 text-xs font-bold tabular-nums text-muted" aria-live="polite">
              {index + 1} / {images.length}
            </p>
          </>
        )}
      </div>
      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3" aria-label="Fotoğraf önizlemeleri">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Fotoğraf ${i + 1}${img.alt ? `: ${img.alt}` : ""}`}
                aria-current={i === index ? "true" : undefined}
                className={`studio-floor relative block aspect-[4/3] w-full overflow-hidden rounded-lg border-2 transition-colors ${
                  i === index ? "border-accent" : "border-transparent hover:border-line"
                }`}
              >
                <Image src={img.url} alt="" fill sizes="120px" className="object-contain p-1.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
