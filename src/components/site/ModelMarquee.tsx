import Link from "next/link";

/** Çalışılan markaların model adlarını yatayda sonsuz kaydıran koyu şerit. */
export function ModelMarquee({
  brands,
  models,
}: {
  brands: { name: string; slug: string; count: number }[];
  models: { model: string; slug: string }[];
}) {
  if (models.length === 0) return null;
  const total = brands.reduce((n, b) => n + b.count, 0);
  return (
    <section aria-label="Çalıştığımız markalar ve modeller" className="on-dark overflow-hidden border-y border-white/10 bg-surface text-white">
      <div className="container-x flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-white/70">
          <span className="font-display text-2xl font-bold text-white">{total}</span> model ·{" "}
          {brands.map((b, i) => (
            <span key={b.slug}>
              {i > 0 && " ve "}
              <Link href={`/motosikletler?marka=${b.slug}`} className="font-bold text-white underline decoration-accent decoration-2 underline-offset-4">
                {b.name}
              </Link>
            </span>
          ))}{" "}
          için satış, servis, parça ve aksesuar
        </p>
        <Link href="/motosikletler" className="link-arrow text-sm text-white">
          Tüm modeller →
        </Link>
      </div>
      <div className="marquee pb-6" aria-hidden>
        <div className="marquee-track gap-10">
          {[...models, ...models].map((m, i) => (
            <span key={`${m.slug}-${i}`} className="font-display flex items-center gap-10 whitespace-nowrap text-4xl font-bold uppercase text-white/20 sm:text-5xl">
              {m.model}
              <span className="h-2 w-2 rotate-45 bg-accent" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
