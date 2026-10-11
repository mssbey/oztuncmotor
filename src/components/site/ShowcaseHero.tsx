import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ShowcaseItem } from "@/server/catalog";

/**
 * Tanıtım sayfalarının koyu, sinematik giriş bölümü:
 * teknik ızgara zemin, arkada dış hatlı dev kelime, sağda kırmızı ışıma üstünde süzülen ürün görselleri
 * ve altta kısa bilgi şeridi.
 */
export function ShowcaseHero({
  crumb,
  eyebrow,
  title,
  lead,
  word,
  showcase,
  highlights,
  stage,
  children,
}: {
  crumb: string;
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  word: string;
  showcase: ShowcaseItem[];
  highlights?: { value: ReactNode; label: string }[];
  /** Ürün vitrini yerine gösterilecek özel sahne (ör. aksesuar sayfasında ekipman görselleri) */
  stage?: ReactNode;
  children?: ReactNode;
}) {
  const [main, ...rest] = showcase;
  return (
    <section className="on-dark relative isolate overflow-hidden bg-ink text-white">
      <div aria-hidden className="grid-bg absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="outline-word pointer-events-none absolute -bottom-[0.12em] right-[-0.04em] -z-10 whitespace-nowrap text-[clamp(7rem,24vw,22rem)]"
      >
        {word}
      </div>

      <div className="container-x grid items-center gap-10 pb-12 pt-10 lg:min-h-[40rem] lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pb-16 lg:pt-14">
        <div className="animate-fade-up relative">
          <nav aria-label="Sayfa yolu" className="text-sm text-muted-dark">
            <ol className="flex gap-2">
              <li>
                <Link href="/" className="hover:text-white">
                  Ana Sayfa
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="font-semibold text-white">
                {crumb}
              </li>
            </ol>
          </nav>
          <p className="mt-8 flex items-center gap-3 text-[0.8125rem] font-bold uppercase tracking-[0.18em] text-white/70">
            <span aria-hidden className="h-[2px] w-8 bg-accent" />
            {eyebrow}
          </p>
          <h1 className="font-display mt-5 text-[3rem] font-bold uppercase leading-[0.9] xs:text-[3.75rem] sm:text-[4.75rem] xl:text-[5.75rem]">
            {title}
          </h1>
          <div className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">{lead}</div>
          {children}
        </div>

        {stage}
        {!stage && main && (
          <div aria-hidden className="relative mx-auto aspect-square w-full max-w-[34rem] lg:max-w-none">
            <div className="accent-glow absolute inset-[14%] rounded-full" />
            {/* Arka plandaki ikinci/üçüncü ürün: daha küçük ve soluk */}
            {rest[0] && (
              <Image
                src={rest[0].image.url}
                alt=""
                width={rest[0].image.width}
                height={rest[0].image.height}
                sizes="(min-width: 1024px) 22vw, 45vw"
                className="product-shadow absolute left-[-4%] top-[4%] w-[46%] opacity-55"
              />
            )}
            {rest[1] && (
              <Image
                src={rest[1].image.url}
                alt=""
                width={rest[1].image.width}
                height={rest[1].image.height}
                sizes="(min-width: 1024px) 22vw, 45vw"
                className="product-shadow absolute right-[-4%] top-[0%] w-[42%] opacity-40 blur-[0.5px]"
              />
            )}
            <div className="float-y absolute inset-x-[4%] bottom-[2%] top-[14%]">
              <Image
                src={main.image.url}
                alt=""
                fill
                preload
                sizes="(min-width: 1024px) 45vw, 92vw"
                className="product-shadow object-contain"
              />
            </div>
            <Link
              href={`/motosikletler/${main.slug}`}
              tabIndex={-1}
              className="absolute bottom-[4%] right-[2%] rounded-full border border-white/15 bg-ink/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/80 backdrop-blur-md hover:text-white"
            >
              {main.label}
            </Link>
          </div>
        )}
      </div>

      {highlights && highlights.length > 0 && (
        <div className="relative border-t border-white/10 bg-ink/60 backdrop-blur-md">
          <dl className="container-x grid grid-cols-2 lg:grid-cols-4">
            {highlights.map((h, i) => (
              <div
                key={h.label}
                className={`py-5 pr-4 sm:py-6 ${i % 2 ? "border-l border-white/10 pl-4 sm:pl-6" : ""} ${i >= 2 ? "border-t border-white/10 lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:pl-6" : ""}`}
              >
                <dt className="sr-only">{h.label}</dt>
                <dd>
                  <span className="font-display block text-3xl font-bold uppercase leading-none text-white sm:text-4xl">{h.value}</span>
                  <span aria-hidden className="mt-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-white/55 sm:text-sm">{h.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
