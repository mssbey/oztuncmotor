import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, Gear, Helmet, Pin, Wrench } from "@/components/icons";
import { MotorcycleCard } from "@/components/catalog/MotorcycleCard";
import { BrandMarquee } from "@/components/site/BrandMarquee";
import { HeroShowroom, type HeroSlide } from "@/components/site/HeroShowroom";
import { BUSINESS_LINES, type BusinessLineKey } from "@/components/site/business-lines";
import { ContactDetails } from "@/components/site/ContactDetails";
import { MapEmbed } from "@/components/site/MapEmbed";
import { BusinessJsonLd } from "@/components/site/JsonLd";
import { MultilineTitle } from "@/components/ui/MultilineTitle";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buildMetadata } from "@/lib/seo";
import { specSummary } from "@/lib/specs";
import {
  getBrandLineup,
  getCardsBySlugs,
  getCatalogStats,
  getFeaturedMotorcycles,
  getShowcase,
  getVisibleBrands,
  getVisibleCategories,
} from "@/server/catalog";
import { getPublicHours, getPublishedServices, getSeo, getSiteSettings } from "@/server/site";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeo("home"), getSiteSettings()]);
  return buildMetadata({
    title: seo?.title || "Öztunc Motor | Düzce Motosiklet Satış ve Servis",
    description:
      seo?.description ||
      "Düzce Cedidiye’deki Öztunc Motor’da motosiklet modellerini inceleyin, fiyat ve stok bilgisi alın, servis randevunuzu online oluşturun.",
    path: "/",
    image: settings.hero,
  });
}

const LINE_ICONS: Record<BusinessLineKey, typeof Bike> = { satis: Bike, servis: Wrench, "yedek-parca": Gear, aksesuar: Helmet };

// Çalışılan markalar: katalogda yayında ürünü varsa ana sayfada gösterilir
const PARTNER_BRANDS = ["yuki", "motolux"];

// Giriş sahnesinde sırayla dönen modeller (şeffaf zeminli ürün görselleri sahnede en iyi durur)
const HERO_MODELS = ["yuki-taro-gp1", "yuki-defender-maxi-adv", "yuki-victor", "yuki-yk-50-spark-new", "yuki-thor-utv-400", "yuki-hammer-50"];

// Marka şeridinde akan modeller (iki marka dönüşümlü; yayından kalkan model atlanır)
const MARQUEE_MODELS = [
  "yuki-taro-gp1", "motolux-ceo-125", "yuki-hammer-50", "motolux-rossi-rs-125", "yuki-victor", "motolux-macchiato-125",
  "yuki-defender-maxi-adv", "motolux-drift-200", "yuki-yk-50-spark-new", "motolux-cortado-200-off", "yuki-thor-utv-400",
  "motolux-vintage-s", "yuki-risotto-125", "motolux-americano-125", "yuki-taro-gp2", "motolux-mw-46", "yuki-cyber", "yuki-gusto",
];

const DEFAULT_ABOUT =
  "Öztunc Motor, Düzce Cedidiye’de motosiklet satışı ve servis hizmeti veren bir işletmedir. Showroom’da modelleri yakından inceleyebilir, teknik özellikleri, fiyat ve teslim seçeneklerini ekibimizle yüz yüze konuşabilirsiniz.\n\nServis tarafında motosikletinizi randevuyla kabul ediyor, yapılacak işlemi önceden sizinle netleştiriyoruz. Amacımız, ister ilk motosikletini alan biri olun ister her gün yolda olan bir sürücü, aynı açıklıkla ve özenle hizmet vermek.";

export default async function HomePage() {
  const [settings, categories, featured, services, hours, brands, lineup, marqueeItems, heroCards, stats] = await Promise.all([
    getSiteSettings(),
    getVisibleCategories(),
    getFeaturedMotorcycles(6),
    getPublishedServices(),
    getPublicHours(),
    getVisibleBrands(),
    getBrandLineup(PARTNER_BRANDS),
    getShowcase(MARQUEE_MODELS),
    getCardsBySlugs(HERO_MODELS),
    getCatalogStats(),
  ]);
  const partners = brands.filter((b) => PARTNER_BRANDS.includes(b.slug));
  const hero = settings.hero;
  const heroSlides: HeroSlide[] = heroCards.flatMap((c) =>
    c.image
      ? [{ slug: c.slug, brand: c.brand, model: c.model, category: c.category, image: c.image, specs: specSummary(c.specs) }]
      : [],
  );
  const aboutParagraphs = (settings.aboutText || DEFAULT_ABOUT).split(/\n{2,}/);

  return (
    <>
      <BusinessJsonLd settings={settings} hours={hours} />

      {/* ── Giriş: showroom sahnesi ──────────────────────── */}
      <HeroShowroom slides={heroSlides} background={hero?.url ?? null}>
        <div className="animate-fade-up">
          <p className="flex items-center gap-3 text-[0.8125rem] font-bold uppercase tracking-[0.18em] text-white/75">
            <span aria-hidden className="h-[2px] w-8 bg-accent" />
            Satış · Servis · Yedek Parça · Aksesuar
          </p>
          <h1
            id="hero-baslik"
            className="mt-5 font-display text-[3.25rem] font-bold uppercase leading-[0.88] tracking-[0.005em] xs:text-[4rem] sm:text-[5.25rem] xl:text-[6.5rem]"
          >
            <MultilineTitle text={settings.heroTitle} />
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/75 sm:text-xl">{settings.heroText}</p>
          <div className="mt-9 flex flex-col gap-3 xs:flex-row xs:flex-wrap">
            <Link href="/motosikletler" className="btn btn-primary px-7 shadow-[0_12px_30px_-10px_rgb(214_40_40/0.7)]">
              Motosikletleri İncele <ArrowRight size={18} />
            </Link>
            <Link href="/servis-randevusu" className="btn btn-outline-light px-7 backdrop-blur-sm">
              Servis Randevusu Al
            </Link>
          </div>
          <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-6">
            <div>
              <dt className="sr-only">Katalogdaki model</dt>
              <dd className="font-display text-4xl font-bold leading-none tabular-nums">{stats.models}</dd>
              <dd aria-hidden className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">Model</dd>
            </div>
            <div>
              <dt className="sr-only">Araç kategorisi</dt>
              <dd className="font-display text-4xl font-bold leading-none tabular-nums">{stats.categories}</dd>
              <dd aria-hidden className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">Kategori</dd>
            </div>
            {lineup.brands.length > 0 && (
              <div>
                <dt className="sr-only">Çalıştığımız markalar</dt>
                <dd className="font-display text-4xl font-bold uppercase leading-none">{lineup.brands.map((b) => b.name).join(" · ")}</dd>
                <dd aria-hidden className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">Markalar</dd>
              </div>
            )}
          </dl>
          <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-white/60">
            <Pin size={16} className="text-accent" />
            {settings.heroLocation}
          </p>
        </div>
      </HeroShowroom>

      {/* ── Hizmetler ─────────────────────────────────────── */}
      <section aria-labelledby="hizmet-baslik" className="border-b border-line bg-white">
        <div className="container-x py-16 lg:py-20">
          <SectionHeading
            eyebrow="Hizmetlerimiz"
            id="hizmet-baslik"
            title="Satıştan servise, tek adres"
            text={
              partners.length > 0 ? (
                <>
                  {partners.map((b) => b.name).join(" ve ")} modellerinin satışı, servisi, orijinal yedek parçası ve
                  aksesuarları Düzce Cedidiye’deki showroom’umuzda.
                </>
              ) : (
                "Motosiklet satışı, servisi, yedek parça ve aksesuar ihtiyaçlarınız Düzce Cedidiye’deki showroom’umuzda."
              )
            }
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BUSINESS_LINES.map((line) => {
              const Icon = LINE_ICONS[line.key];
              return (
                <li key={line.key}>
                  <Link
                    href={line.href}
                    className="group card flex h-full flex-col p-6 transition-shadow hover:shadow-[var(--shadow-card-hover)]"
                  >
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-ink text-accent">
                      <Icon size={26} />
                    </span>
                    <h3 className="font-display mt-5 text-3xl font-bold uppercase leading-none">{line.title}</h3>
                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{line.text}</p>
                    <span className="link-arrow mt-auto pt-5 text-sm">
                      {line.cta} <ArrowRight size={16} className="text-accent" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <BrandMarquee brands={lineup.brands} items={marqueeItems} />
        </div>
      </section>

      {/* ── Kategoriler ───────────────────────────────────── */}
      {categories.length > 0 && (
        <section aria-labelledby="kategori-baslik" className="border-b border-line bg-paper">
          <div className="container-x py-16 lg:py-20">
            <SectionHeading eyebrow="Kategoriler" id="kategori-baslik" title="Sana uygun olanı seç" />
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/motosikletler?kategori=${c.slug}`}
                    className="group card flex h-full flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-card-hover)]"
                  >
                    <div className="studio-floor relative aspect-[16/10]">
                      {c.image && (
                        <Image
                          src={c.image.url}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-display text-2xl font-bold uppercase leading-none">{c.name}</h3>
                        <span className="text-sm font-semibold tabular-nums text-muted">
                          {c._count.motorcycles} model
                        </span>
                      </div>
                      {c.description && <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{c.description}</p>}
                      <span className="link-arrow mt-auto pt-4 text-sm">
                        Modelleri gör <ArrowRight size={16} className="text-accent" />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Öne çıkanlar ──────────────────────────────────── */}
      <section aria-labelledby="one-cikan-baslik" className="bg-paper">
        <div className="container-x py-16 lg:py-24">
          <SectionHeading
            eyebrow="Showroom"
            id="one-cikan-baslik"
            title="Öne çıkan motosikletler"
            text="Showroom’daki modelleri inceleyin; fiyat, stok ve renk seçenekleri için bizimle iletişime geçin."
            action={
              <Link href="/motosikletler" className="link-arrow">
                Tüm modeller <ArrowRight size={18} className="text-accent" />
              </Link>
            }
          />
          {featured.length > 0 ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3 lg:gap-6">
              {featured.map((m, i) => (
                <MotorcycleCard key={m.id} item={m} priority={i === 0 && !hero} />
              ))}
            </div>
          ) : (
            <div className="card mt-10 p-8 text-center sm:p-12">
              <p className="font-display text-2xl font-bold uppercase">Model listesi hazırlanıyor</p>
              <p className="mx-auto mt-2 max-w-md text-muted">
                Güncel modeller ve stok durumu için bize ulaşabilir veya showroom’umuzu ziyaret edebilirsiniz.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Servis ────────────────────────────────────────── */}
      <section aria-labelledby="servis-baslik" className="on-dark bg-ink text-white">
        <div
          className={`container-x grid gap-12 py-16 lg:py-24 ${
            settings.serviceImage ? "lg:grid-cols-2 lg:items-center lg:gap-16" : ""
          }`}
        >
          {settings.serviceImage && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-surface lg:aspect-[5/6]">
              <Image
                src={settings.serviceImage.url}
                alt={settings.serviceImage.alt || "Öztunc Motor servis atölyesi"}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
          <div>
            <p className="eyebrow">Servis</p>
            <h2
              id="servis-baslik"
              className="font-display mt-4 text-[2.75rem] font-bold uppercase leading-[0.92] sm:text-6xl xl:text-7xl"
            >
              <MultilineTitle text={settings.serviceTitle} />
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/75">
              {settings.serviceText ||
                "Düzce’deki servisimizde motosikletinizi randevuyla kabul ediyoruz. Talebinizi online iletin; uygun zamanı birlikte netleştirelim."}
            </p>
            {services.length > 0 && (
              <ul className="mt-10 grid border-t border-line-dark sm:grid-cols-2 sm:gap-x-10">
                {services.map((s, i) => (
                  <li key={s.id} className="flex gap-4 border-b border-line-dark py-4">
                    <span className="font-display w-7 shrink-0 pt-0.5 text-lg font-semibold tabular-nums text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-bold">{s.title}</h3>
                      {s.description && <p className="mt-1 text-sm leading-relaxed text-muted-dark">{s.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-10 flex flex-col gap-3 xs:flex-row">
              <Link href="/servis-randevusu" className="btn btn-primary">
                Servis Randevusu Oluştur <ArrowRight size={18} />
              </Link>
              <Link href="/servis" className="btn btn-outline-light">
                Servis hakkında
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tanıtım ───────────────────────────────────────── */}
      <section aria-labelledby="hakkimizda-baslik" className="bg-paper">
        <div
          className={`container-x grid gap-12 py-16 lg:py-24 ${
            settings.about1 ? "lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-20" : ""
          }`}
        >
          {settings.about1 && (
            <div className="relative grid grid-cols-6 gap-4">
              <div
                className={`relative aspect-[4/5] overflow-hidden rounded-[10px] ${
                  settings.about2 ? "col-span-4" : "col-span-6 aspect-[4/3]"
                }`}
              >
                <Image
                  src={settings.about1.url}
                  alt={settings.about1.alt || "Öztunc Motor showroom"}
                  fill
                  sizes="(min-width: 1024px) 35vw, 66vw"
                  className="object-cover"
                />
              </div>
              {settings.about2 && (
                <div className="relative col-span-2 mt-16 aspect-[3/5] overflow-hidden rounded-[10px]">
                  <Image
                    src={settings.about2.url}
                    alt={settings.about2.alt || "Öztunc Motor servis"}
                    fill
                    sizes="(min-width: 1024px) 18vw, 33vw"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          )}
          <div className={settings.about1 ? "" : "max-w-3xl"}>
            <p className="eyebrow">Öztunc Motor</p>
            <h2
              id="hakkimizda-baslik"
              className="font-display mt-3 text-[2.5rem] font-bold uppercase leading-[0.95] sm:text-5xl lg:text-[3.5rem]"
            >
              {settings.aboutTitle || "Düzce’de satış ve servis, tek adreste"}
            </h2>
            <div className="mt-6 space-y-4 text-[1.0625rem] leading-relaxed text-[#2b2e33]">
              {aboutParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <Link href="/hakkimizda" className="link-arrow mt-8">
              Bizi tanıyın <ArrowRight size={18} className="text-accent" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Konum ve iletişim ─────────────────────────────── */}
      <section aria-labelledby="konum-baslik" className="border-t border-line bg-white">
        <div className="container-x grid gap-12 py-16 lg:grid-cols-[1fr_1.25fr] lg:gap-16 lg:py-24">
          <div>
            <p className="eyebrow">Konum</p>
            <h2 id="konum-baslik" className="font-display mt-3 text-[2.5rem] font-bold uppercase leading-[0.95] sm:text-5xl">
              Showroom ve servis
            </h2>
            <div className="mt-8">
              <ContactDetails settings={settings} hours={hours} />
            </div>
          </div>
          {settings.mapEmbedEnabled && (
            <MapEmbed query={settings.mapSearchQuery} directionsUrl={settings.directionsUrl} />
          )}
        </div>
      </section>
    </>
  );
}
