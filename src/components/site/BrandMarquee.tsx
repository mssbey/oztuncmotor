import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import type { ShowcaseItem } from "@/server/catalog";

// Her markanın şeritteki renk kimliği (bilinmeyen marka nötr koyu tonu alır)
const BRAND_TONES: Record<string, { gradient: string; text: string; tile: string }> = {
  yuki: {
    gradient: "from-[#d62828] via-[#ec4a1c] to-[#ff8a1f]",
    text: "text-[#d62828]",
    tile: "from-[#fff1ea] to-[#ffd9c7]",
  },
  motolux: {
    gradient: "from-[#1e3a8a] via-[#2563eb] to-[#06b6d4]",
    text: "text-[#2563eb]",
    tile: "from-[#eaf3ff] to-[#cfe3ff]",
  },
};
const NEUTRAL = { gradient: "from-ink via-surface-2 to-ink", text: "text-text", tile: "from-paper to-line" };

type Brand = { name: string; slug: string; count: number };

function BrandBadge({ brand }: { brand: Brand }) {
  const tone = BRAND_TONES[brand.slug] ?? NEUTRAL;
  return (
    <span
      className={`relative mr-4 flex h-28 shrink-0 items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br ${tone.gradient} px-8 text-white shadow-[0_12px_30px_-12px_rgb(17_19_21/0.45)]`}
    >
      <span aria-hidden className="absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/15 blur-xl" />
      <span className="font-display text-5xl font-bold uppercase leading-none tracking-wide">{brand.name}</span>
      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-sm">
        {brand.count} model
      </span>
    </span>
  );
}

function ModelChip({ item }: { item: ShowcaseItem }) {
  const tone = BRAND_TONES[item.brand.slug] ?? NEUTRAL;
  return (
    <span className="mr-4 flex h-28 shrink-0 items-center gap-4 rounded-2xl border border-line bg-white py-2 pl-2 pr-6 shadow-[0_6px_20px_-12px_rgb(17_19_21/0.3)]">
      <span className={`relative h-24 w-28 overflow-hidden rounded-xl bg-gradient-to-br ${tone.tile}`}>
        <Image src={item.image.url} alt="" fill sizes="112px" className="object-cover object-center mix-blend-multiply" />
      </span>
      <span>
        <span className={`block text-[0.6875rem] font-extrabold uppercase tracking-[0.16em] ${tone.text}`}>{item.brand.name}</span>
        <span className="font-display mt-1 block whitespace-nowrap text-2xl font-bold uppercase leading-none">{item.model}</span>
      </span>
    </span>
  );
}

/**
 * Çalışılan markalar: iki sıra halinde, zıt yönlere sonsuz akan renkli marka rozetleri ve model kartları.
 * Kayan içerik ekran okuyuculardan gizlenir; erişilebilir bağlantılar üstteki başlık satırındadır.
 */
export function BrandMarquee({ brands, items }: { brands: Brand[]; items: ShowcaseItem[] }) {
  if (brands.length === 0) return null;

  // Her sıra: marka rozeti, ardından o sıranın modelleri; sıralar arasında modeller paylaştırılır
  const half = Math.ceil(items.length / 2);
  const rows = [items.slice(0, half), items.slice(half)].map((rowItems, r) => {
    const out: ({ kind: "brand"; brand: Brand } | { kind: "model"; item: ShowcaseItem })[] = [];
    rowItems.forEach((item, i) => {
      if (i % 3 === 0) out.push({ kind: "brand", brand: brands[(i / 3 + r) % brands.length] });
      out.push({ kind: "model", item });
    });
    return out;
  });

  return (
    <div className="mt-12 border-t border-line pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="eyebrow">Çalıştığımız markalar</p>
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {brands.map((b) => {
            const tone = BRAND_TONES[b.slug] ?? NEUTRAL;
            return (
              <li key={b.slug}>
                <Link href={`/motosikletler?marka=${b.slug}`} className="group inline-flex items-center gap-2 text-sm font-bold">
                  <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${tone.gradient}`} />
                  {b.name} modelleri
                  <span className="text-muted">({b.count})</span>
                  <ArrowRight size={15} className="text-accent transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div aria-hidden className="-mx-4 mt-8 grid gap-4 sm:-mx-6 xl:-mx-10">
        {rows.map((row, r) =>
          row.length === 0 ? null : (
            <div key={r} className={`marquee ${r % 2 ? "marquee-reverse" : ""}`}>
              <div className="marquee-track py-2" style={{ animationDuration: `${row.length * 4.5}s` }}>
                {[...row, ...row].map((entry, i) =>
                  entry.kind === "brand" ? (
                    <BrandBadge key={`b-${i}`} brand={entry.brand} />
                  ) : (
                    <ModelChip key={`m-${i}`} item={entry.item} />
                  ),
                )}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
