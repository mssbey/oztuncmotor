"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight } from "@/components/icons";

export type HeroSlide = {
  slug: string;
  brand: string;
  model: string;
  category: string | null;
  image: { url: string; width: number; height: number };
  specs: string[];
};

const INTERVAL_MS = 6000;

/**
 * Ana sayfa giriş sahnesi: solda başlık ve çağrılar, sağda spot ışığı altında sırayla dönen modeller,
 * altta ilerleme çubuklu model seçici. Fare üzerindeyken veya klavye odağı içerideyken durur;
 * "hareketi azalt" tercihinde otomatik geçiş yapılmaz.
 */
export function HeroShowroom({
  slides,
  background,
  children,
}: {
  slides: HeroSlide[];
  background: string | null;
  children: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [autoplay, setAutoplay] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAutoplay(!media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const current = slides[active];
  const next = () => setActive((i) => (i + 1) % slides.length);

  return (
    <section
      aria-labelledby="hero-baslik"
      aria-roledescription="carousel"
      className="on-dark relative isolate overflow-hidden bg-ink text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Arka plan katmanları: koyulaştırılmış fotoğraf, ızgara, kırmızı ışıma */}
      {background && (
        <div aria-hidden className="absolute inset-0 -z-20">
          <Image src={background} alt="" fill preload quality={70} sizes="100vw" className="hero-photo object-cover opacity-30" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-ink)_18%,rgb(17_19_21/0.75)_50%,rgb(17_19_21/0.55)_100%)]" />
        </div>
      )}
      <div aria-hidden className="grid-bg absolute inset-0 -z-10 opacity-70" />
      <div aria-hidden className="accent-glow absolute -right-[10%] top-[10%] -z-10 h-[46rem] w-[46rem] opacity-50" />

      <div className="container-x grid min-h-[min(50rem,calc(100dvh-8rem))] items-center gap-6 pb-6 pt-10 lg:min-h-[min(46rem,calc(100dvh-10rem))] lg:grid-cols-[1fr_1.15fr] lg:gap-4 lg:pt-6">
        <div className="relative z-10">{children}</div>

        {/* Sahne */}
        <div className="relative">
          {current && (
            <div
              key={`w-${active}`}
              aria-hidden
              className="outline-word hero-word-in pointer-events-none absolute inset-x-[-10%] top-[-2%] text-center text-[clamp(5rem,16vw,16rem)] [-webkit-text-stroke:1.5px_rgb(255_255_255/0.16)]"
            >
              {current.model.split(" ")[0]}
            </div>
          )}
          <div className="relative mx-auto aspect-[5/4] w-full max-w-[44rem] lg:-translate-x-[6%] lg:-translate-y-[4%]">
            <div aria-hidden className="stage-spot absolute inset-x-[10%] -top-[20%] bottom-[10%]" />
            <div aria-hidden className="stage-floor absolute inset-x-[8%] bottom-[2%] h-[16%]" />
            {slides.map((s, i) => (
              <div
                key={s.slug}
                aria-hidden={i !== active}
                className={`absolute inset-x-[2%] bottom-[5%] top-[2%] transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
                  i === active ? "translate-x-0 scale-100 opacity-100" : i < active ? "-translate-x-[12%] scale-95 opacity-0" : "translate-x-[12%] scale-95 opacity-0"
                }`}
              >
                <div className={`relative h-full w-full ${i === active ? "float-y" : ""}`}>
                  <Image
                    src={s.image.url}
                    alt={`${s.brand} ${s.model}`}
                    fill
                    preload={i === 0}
                    sizes="(min-width: 1024px) 50vw, 94vw"
                    className="product-shadow object-contain"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Model bilgi kartı */}
          {current && (
            <div
              key={`i-${active}`}
              className="hero-info-in relative z-10 -mt-6 ml-auto w-full max-w-sm rounded-2xl border border-white/10 bg-ink/70 p-5 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl sm:-mt-14 lg:absolute lg:-bottom-[4%] lg:right-[-1%] lg:mt-0 lg:max-w-[19rem]"
              aria-live={paused || !autoplay ? "polite" : "off"}
            >
              <div className="flex items-center gap-2 text-[0.6875rem] font-extrabold uppercase tracking-[0.16em]">
                <span className="text-accent">{current.brand}</span>
                {current.category && (
                  <>
                    <span aria-hidden className="text-white/30">/</span>
                    <span className="text-white/60">{current.category}</span>
                  </>
                )}
              </div>
              <p className="font-display mt-1.5 text-4xl font-bold uppercase leading-none">{current.model}</p>
              {current.specs.length > 0 && (
                <ul className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                  {current.specs.map((spec) => (
                    <li key={spec} className="text-sm font-bold tabular-nums text-white/85">
                      {spec}
                    </li>
                  ))}
                </ul>
              )}
              <Link href={`/motosikletler/${current.slug}`} className="link-arrow mt-4 text-sm text-white">
                Modeli incele <ArrowRight size={16} className="text-accent" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Model seçici */}
      {slides.length > 1 && (
        <div className="relative border-t border-white/10 bg-ink/60 backdrop-blur-md">
          <ul className="container-x flex snap-x gap-0 overflow-x-auto [scrollbar-width:none]" aria-label="Öne çıkan modeller">
            {slides.map((s, i) => (
              <li key={s.slug} className="min-w-[10.5rem] flex-1 snap-start">
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-current={i === active ? "true" : undefined}
                  aria-label={`${s.brand} ${s.model} modelini göster`}
                  className={`group relative flex w-full items-center gap-3 py-4 pr-4 text-left transition-colors ${i === active ? "text-white" : "text-white/45 hover:text-white/80"}`}
                >
                  <span className="absolute inset-x-0 top-0 h-[2px] bg-white/10">
                    {i === active && (
                      <span
                        className={`block h-full bg-accent ${autoplay ? "hero-progress" : ""}`}
                        style={{
                          ["--hero-interval" as string]: `${INTERVAL_MS}ms`,
                          animationPlayState: paused ? "paused" : "running",
                        }}
                        onAnimationEnd={autoplay ? next : undefined}
                      />
                    )}
                  </span>
                  <span className="font-display text-sm font-semibold tabular-nums text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <span className="relative h-10 w-14 shrink-0">
                    <Image src={s.image.url} alt="" fill sizes="56px" className={`object-contain transition-opacity ${i === active ? "opacity-100" : "opacity-50 group-hover:opacity-80"}`} />
                  </span>
                  <span className="font-display truncate text-lg font-bold uppercase leading-none">{s.model}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
