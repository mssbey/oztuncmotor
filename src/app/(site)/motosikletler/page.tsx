import type { Metadata } from "next";
import Link from "next/link";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { MotorcycleCard } from "@/components/catalog/MotorcycleCard";
import { ChevronLeft, ChevronRight, Close } from "@/components/icons";
import {
  CC_RANGES,
  POWERTRAIN_OPTIONS,
  STOCK_OPTIONS,
  catalogQueryString,
  formatPrice,
  hasActiveFilters,
  parseCatalogParams,
  type CatalogFilters as Filters,
} from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";
import { getVisibleBrands, getVisibleCategories, searchCatalog } from "@/server/catalog";
import { getSeo } from "@/server/site";

export async function generateMetadata({ searchParams }: PageProps<"/motosikletler">): Promise<Metadata> {
  const seo = await getSeo("motorcycles");
  const filtered = hasActiveFilters(parseCatalogParams(await searchParams));
  return {
    ...buildMetadata({
      title: seo?.title || "Motosikletler | Düzce Motosiklet Satışı",
      description:
        seo?.description ||
        "Öztunc Motor showroom’undaki motosiklet modelleri: marka, kategori, motor hacmi, fiyat ve stok durumuna göre filtreleyin; Düzce’de yerinde inceleyin.",
      path: "/motosikletler",
    }),
    // Filtreli sonuç sayfaları ana katalog sayfasına canonical verir; dizine eklenmez
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CatalogPage({ searchParams }: PageProps<"/motosikletler">) {
  const params = await searchParams;
  const filters = parseCatalogParams(params);
  const requestedPage = Number(String(params.sayfa ?? "1").replace(/\D/g, "")) || 1;
  const [{ items: results, total, page, pages }, brands, categories] = await Promise.all([
    searchCatalog(filters, requestedPage),
    getVisibleBrands(),
    getVisibleCategories(),
  ]);
  const active = activeChips(filters, brands, categories);

  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="container-x pb-8 pt-10 lg:pb-10 lg:pt-14">
          <nav aria-label="Sayfa yolu" className="text-sm text-muted">
            <ol className="flex gap-2">
              <li>
                <Link href="/" className="hover:text-text">
                  Ana Sayfa
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="font-semibold text-text">
                Motosikletler
              </li>
            </ol>
          </nav>
          <h1 className="font-display mt-4 text-5xl font-bold uppercase leading-[0.92] sm:text-6xl lg:text-7xl">
            Motosikletler
          </h1>
          <p className="mt-4 max-w-2xl text-[1.0625rem] leading-relaxed text-muted">
            Düzce’deki showroom’umuzda yer alan modeller. Fiyatı listelenmeyen modeller ve güncel kampanyalar için bilgi
            talebi bırakabilir veya bizi arayabilirsiniz.
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <div className="container-x py-8 lg:py-10">
          <CatalogFilters
            filters={filters}
            brands={brands.map((b) => ({ value: b.slug, label: b.name }))}
            categories={categories.map((c) => ({ value: c.slug, label: c.name }))}
            resultCount={total}
          >
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
              <p className="text-[0.9375rem]">
                <strong className="font-extrabold tabular-nums">{total}</strong>{" "}
                <span className="text-muted">model listeleniyor</span>
                {pages > 1 && (
                  <span className="text-muted">
                    {" "}
                    · sayfa {page}/{pages}
                  </span>
                )}
              </p>
              {active.length > 0 && (
                <>
                  <ul className="flex flex-wrap gap-2" aria-label="Aktif filtreler">
                    {active.map((chip) => (
                      <li key={chip.key}>
                        <Link
                          href={`/motosikletler${catalogQueryString(chip.without)}`}
                          scroll={false}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-ink py-1 pl-3 pr-2 text-sm font-semibold text-white hover:bg-surface-2"
                          aria-label={`${chip.label} filtresini kaldır`}
                        >
                          {chip.label}
                          <Close size={14} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/motosikletler"
                    scroll={false}
                    className="text-sm font-bold text-accent underline decoration-2 underline-offset-4"
                  >
                    Filtreleri Temizle
                  </Link>
                </>
              )}
            </div>

            {results.length > 0 ? (
              <>
                <div className="mt-6 grid gap-5 sm:grid-cols-2 2xl:grid-cols-3 lg:gap-6">
                  {results.map((m, i) => (
                    <MotorcycleCard key={m.id} item={m} priority={i < 2} headingLevel="h2" />
                  ))}
                </div>
                {pages > 1 && <Pagination filters={filters} page={page} pages={pages} />}
              </>
            ) : (
              <EmptyState filtered={hasActiveFilters(filters)} />
            )}
          </CatalogFilters>
        </div>
      </section>
    </>
  );
}

function pageHref(filters: Filters, page: number) {
  const qs = catalogQueryString(filters);
  if (page <= 1) return `/motosikletler${qs}`;
  return `/motosikletler${qs ? `${qs}&` : "?"}sayfa=${page}`;
}

function Pagination({ filters, page, pages }: { filters: Filters; page: number; pages: number }) {
  // İlk, son ve geçerli sayfanın çevresi; aradaki boşluklar "…" ile gösterilir
  const shown = [...new Set([1, page - 1, page, page + 1, pages])].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const base = "inline-flex h-11 min-w-11 items-center justify-center rounded-lg px-3 text-[0.9375rem] font-bold tabular-nums";
  return (
    <nav aria-label="Sayfalar" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={pageHref(filters, page - 1)} className={`${base} border border-line bg-white hover:border-text`} aria-label="Önceki sayfa">
          <ChevronLeft size={18} />
        </Link>
      )}
      {shown.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && p - shown[i - 1] > 1 && (
            <span aria-hidden className="px-1 text-muted">
              …
            </span>
          )}
          {p === page ? (
            <span aria-current="page" className={`${base} bg-ink text-white`}>
              {p}
            </span>
          ) : (
            <Link href={pageHref(filters, p)} className={`${base} border border-line bg-white hover:border-text`} aria-label={`Sayfa ${p}`}>
              {p}
            </Link>
          )}
        </span>
      ))}
      {page < pages && (
        <Link href={pageHref(filters, page + 1)} className={`${base} border border-line bg-white hover:border-text`} aria-label="Sonraki sayfa">
          <ChevronRight size={18} />
        </Link>
      )}
    </nav>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="card mt-6 flex flex-col items-center px-6 py-14 text-center">
      <p className="font-display text-3xl font-bold uppercase">
        {filtered ? "Bu filtrelerle model bulunamadı" : "Henüz listelenen model yok"}
      </p>
      <p className="mt-3 max-w-md text-muted">
        {filtered
          ? "Filtrelerden bazılarını kaldırmayı deneyin. Aradığınız model listede yoksa bize sorun; sipariş üzerine temin edilebilir."
          : "Model listesi hazırlanıyor. Güncel modeller ve stok durumu için bize ulaşabilirsiniz."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {filtered && (
          <Link href="/motosikletler" className="btn btn-dark">
            Filtreleri Temizle
          </Link>
        )}
        <Link href="/iletisim" className="btn btn-outline">
          Bize Sorun
        </Link>
      </div>
    </div>
  );
}

function activeChips(
  f: Filters,
  brands: { slug: string; name: string }[],
  categories: { slug: string; name: string }[],
) {
  const chips: { key: string; label: string; without: Filters }[] = [];
  if (f.q) chips.push({ key: "q", label: `“${f.q}”`, without: { ...f, q: "" } });
  for (const v of f.categories)
    chips.push({
      key: `k-${v}`,
      label: categories.find((c) => c.slug === v)?.name ?? v,
      without: { ...f, categories: f.categories.filter((x) => x !== v) },
    });
  for (const v of f.brands)
    chips.push({
      key: `m-${v}`,
      label: brands.find((b) => b.slug === v)?.name ?? v,
      without: { ...f, brands: f.brands.filter((x) => x !== v) },
    });
  for (const v of f.powertrain)
    chips.push({
      key: `t-${v}`,
      label: POWERTRAIN_OPTIONS.find((o) => o.value === v)!.label,
      without: { ...f, powertrain: f.powertrain.filter((x) => x !== v) },
    });
  for (const v of f.cc)
    chips.push({
      key: `h-${v}`,
      label: CC_RANGES.find((o) => o.value === v)!.label,
      without: { ...f, cc: f.cc.filter((x) => x !== v) },
    });
  for (const v of f.stock)
    chips.push({
      key: `s-${v}`,
      label: STOCK_OPTIONS.find((o) => o.value === v)!.label,
      without: { ...f, stock: f.stock.filter((x) => x !== v) },
    });
  if (f.min != null || f.max != null) {
    const label =
      f.min != null && f.max != null
        ? `${formatPrice(f.min)} – ${formatPrice(f.max)}`
        : f.min != null
          ? `${formatPrice(f.min)} ve üzeri`
          : `${formatPrice(f.max)} ve altı`;
    chips.push({ key: "fiyat", label, without: { ...f, min: null, max: null } });
  }
  return chips;
}
