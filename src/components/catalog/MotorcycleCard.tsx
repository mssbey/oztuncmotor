import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/catalog";
import { specSummary } from "@/lib/specs";
import type { MotorcycleCard as Card } from "@/server/catalog";
import { ArrowRight } from "@/components/icons";
import { DemoBadge, StockBadge } from "./StockBadge";
import { CompareToggle } from "./CompareToggle";
import { ProductImagePlaceholder } from "./ProductImagePlaceholder";

export function MotorcycleCard({
  item,
  priority = false,
  headingLevel = "h3",
}: {
  item: Card;
  priority?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const price = formatPrice(item.priceTL);
  const summary = specSummary(item.specs);
  const Heading = headingLevel;
  const title = `${item.brand} ${item.model}`;
  return (
    <article className="card group relative flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]">
      <div className="studio-floor relative aspect-[4/3] overflow-hidden">
        {item.image ? (
          <Image
            src={item.image.url}
            alt={item.image.alt || title}
            fill
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025]"
            priority={priority}
          />
        ) : (
          <ProductImagePlaceholder />
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {item.isDemo && <DemoBadge />}
          {item.category && (
            <span className="rounded-[4px] bg-white/90 px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider text-muted">
              {item.category}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div>
          <p className="text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-muted">{item.brand}</p>
          <Heading className="font-display mt-1 text-[1.75rem] font-bold uppercase leading-[1.02] text-text">
            <Link href={`/motosikletler/${item.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
              {item.model}
              {item.modelYear ? <span className="sr-only"> {item.modelYear}</span> : null}
            </Link>
          </Heading>
        </div>

        {summary.length > 0 && (
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted" aria-label="Teknik özet">
            {summary.map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden className="h-3 w-px bg-line" />}
                {s}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            {price ? (
              <p className="text-lg font-extrabold tracking-tight text-text">{price}</p>
            ) : (
              <p className="text-[0.9375rem] font-bold text-text">Fiyat bilgisi alın</p>
            )}
            <StockBadge status={item.stockStatus} className="mt-1" />
          </div>
          <span className="link-arrow shrink-0 text-sm" aria-hidden>
            Modeli İncele <ArrowRight size={16} className="text-accent" />
          </span>
        </div>
      </div>
      <div className="relative z-10 px-5 pb-5 sm:px-6">
        <CompareToggle slug={item.slug} label={title} />
      </div>
    </article>
  );
}
