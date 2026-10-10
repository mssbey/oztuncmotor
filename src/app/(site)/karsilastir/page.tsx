import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ComparePicker } from "@/components/catalog/ComparePicker";
import { ProductImagePlaceholder } from "@/components/catalog/ProductImagePlaceholder";
import { DemoBadge, StockBadge } from "@/components/catalog/StockBadge";
import { PageHero } from "@/components/ui/PageHero";
import { formatPrice } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";
import { specRows } from "@/lib/specs";
import { getCompareOptions, getMotorcyclesBySlugs } from "@/server/catalog";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Model Karşılaştırma",
    description: "En fazla üç motosiklet modelinin girilmiş teknik özelliklerini yan yana karşılaştırın.",
    path: "/karsilastir",
  }),
  robots: { index: false, follow: true },
};

export default async function ComparePage({ searchParams }: PageProps<"/karsilastir">) {
  const sp = await searchParams;
  const raw = typeof sp.modeller === "string" ? sp.modeller : "";
  const slugs = [...new Set(raw.split(",").filter((s) => /^[a-z0-9-]+$/.test(s)))].slice(0, 3);
  const [items, options] = await Promise.all([getMotorcyclesBySlugs(slugs), getCompareOptions()]);

  // Yalnızca en az bir modelde girilmiş özellikler satır olur; boş hücre "—" gösterilir, tahmin edilmez.
  const rowsPerItem = items.map((m) => new Map(specRows(m.specs).map((r) => [r.label, r.value])));
  const labels: string[] = [];
  for (const rows of rowsPerItem) for (const label of rows.keys()) if (!labels.includes(label)) labels.push(label);

  const cols = items.length === 3 ? "grid-cols-3" : items.length === 2 ? "grid-cols-2" : "grid-cols-1";

  return (
    <>
      <PageHero crumb="Karşılaştır" title="Model karşılaştırma" lead="En fazla üç modeli seçin; girilmiş teknik özellikler yan yana listelenir." />
      <section className="bg-paper">
        <div className="container-x py-10 lg:py-14">
          <ComparePicker
            selected={items.map((i) => i.slug)}
            options={options.map((o) => ({ slug: o.slug, label: `${o.brand.name} ${o.model}` }))}
          />

          {items.length === 0 ? (
            <div className="card mt-8 p-8 text-center sm:p-12">
              <p className="font-display text-3xl font-bold uppercase">Karşılaştırılacak model seçilmedi</p>
              <p className="mx-auto mt-2 max-w-md text-muted">
                Yukarıdan model seçin veya katalogda kartların altındaki “Karşılaştır” kutusunu işaretleyin.
              </p>
              <Link href="/motosikletler" className="btn btn-dark mt-6">
                Kataloğa git
              </Link>
            </div>
          ) : (
            <div className="card mt-8 overflow-hidden">
              {/* Model başlıkları */}
              <div className="grid md:grid-cols-[14rem_1fr]">
                <div className="hidden border-r border-line md:block" />
                <div className={`grid ${cols} divide-x divide-line`}>
                  {items.map((m) => (
                    <div key={m.id} className="min-w-0 p-3 sm:p-5">
                      <div className="studio-floor relative aspect-[4/3] overflow-hidden rounded-lg">
                        {m.image ? (
                          <Image src={m.image.url} alt={m.image.alt || `${m.brand} ${m.model}`} fill sizes="(min-width: 768px) 25vw, 33vw" className="object-contain p-2" />
                        ) : (
                          <ProductImagePlaceholder label="" />
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {m.isDemo && <DemoBadge />}
                        <p className="truncate text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted sm:text-xs">{m.brand}</p>
                      </div>
                      <h2 className="font-display mt-0.5 break-words text-lg font-bold uppercase leading-tight sm:text-2xl">
                        <Link href={`/motosikletler/${m.slug}`} className="hover:text-accent">
                          {m.model}
                        </Link>
                      </h2>
                    </div>
                  ))}
                </div>
              </div>

              <dl className="border-t border-line">
                <CompareRow label="Fiyat" cols={cols} values={items.map((m) => formatPrice(m.priceTL) ?? "Fiyat bilgisi alın")} />
                <div className="grid border-b border-line md:grid-cols-[14rem_1fr]">
                  <dt className="bg-paper px-3 pt-3 text-xs font-extrabold uppercase tracking-[0.1em] text-muted md:border-r md:border-line md:bg-transparent md:p-4 md:text-sm md:normal-case md:tracking-normal md:font-semibold">
                    Stok durumu
                  </dt>
                  <div className={`grid ${cols} divide-x divide-line`}>
                    {items.map((m) => (
                      <dd key={m.id} className="min-w-0 p-3 md:p-4">
                        <StockBadge status={m.stockStatus} />
                      </dd>
                    ))}
                  </div>
                </div>
                {labels.map((label) => (
                  <CompareRow key={label} label={label} cols={cols} values={rowsPerItem.map((r) => r.get(label) ?? "—")} />
                ))}
              </dl>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function CompareRow({ label, values, cols }: { label: string; values: string[]; cols: string }) {
  return (
    <div className="grid border-b border-line last:border-b-0 md:grid-cols-[14rem_1fr]">
      <dt className="bg-paper px-3 pt-3 text-xs font-extrabold uppercase tracking-[0.1em] text-muted md:border-r md:border-line md:bg-transparent md:p-4 md:text-sm md:font-semibold md:normal-case md:tracking-normal">
        {label}
      </dt>
      <div className={`grid ${cols} divide-x divide-line`}>
        {values.map((v, i) => (
          <dd key={i} className={`min-w-0 break-words p-3 text-sm font-semibold md:p-4 md:text-[0.9375rem] ${v === "—" ? "text-muted" : ""}`}>
            {v}
          </dd>
        ))}
      </div>
    </div>
  );
}
