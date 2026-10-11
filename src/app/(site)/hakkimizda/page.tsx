import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, Calendar, Chat, Eye, Gear, Helmet, Wrench } from "@/components/icons";
import { BUSINESS_LINES, type BusinessLineKey } from "@/components/site/business-lines";
import { ContactDetails } from "@/components/site/ContactDetails";
import { MapEmbed } from "@/components/site/MapEmbed";
import { ShowcaseHero } from "@/components/site/ShowcaseHero";
import { CtaBand, IconCards, SectionIntro } from "@/components/site/showcase-sections";
import { buildMetadata } from "@/lib/seo";
import { getBrandLineup, getCatalogStats, getShowcase } from "@/server/catalog";
import { getAuthorizedBrands, getPublicHours, getSeo, getSiteSettings } from "@/server/site";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeo("about"), getSiteSettings()]);
  return buildMetadata({
    title: seo?.title || "Hakkımızda",
    description:
      seo?.description ||
      "Öztunc Motor, Düzce Cedidiye’de motosiklet satışı, servis, yedek parça ve aksesuar hizmeti veren bir işletmedir. Showroom ve servisimizi tanıyın.",
    path: "/hakkimizda",
    image: settings.about1,
  });
}

const PRINCIPLES = [
  {
    icon: Eye,
    title: "Yerinde inceleme",
    text: "Modelleri showroom’da yakından görün, oturun, ölçülerini ve sürüş pozisyonunu kendiniz deneyimleyin.",
  },
  {
    icon: Chat,
    title: "Açık bilgi",
    text: "Fiyat, stok ve teslim durumu konusunda net bilgi veririz; emin olmadığımız bir bilgiyi kesinmiş gibi sunmayız.",
  },
  {
    icon: Calendar,
    title: "Planlı servis",
    text: "Servis işlemlerini randevuyla kabul eder, yapılacak işi başlamadan önce sizinle konuşuruz.",
  },
];

const LINE_ICONS: Record<BusinessLineKey, typeof Bike> = { satis: Bike, servis: Wrench, "yedek-parca": Gear, aksesuar: Helmet };

const DEFAULT_TEXT =
  "Öztunc Motor, Düzce’nin Cedidiye Mahallesi’nde, Mimar Sinan Caddesi üzerinde motosiklet satışı, servis, yedek parça ve aksesuar hizmeti veren bir işletmedir.\n\nShowroom’umuzda Yuki ve Motolux’un şehir içi kullanıma uygun scooter’larından elektrikli modellere, enduro ve touring motosikletlerden ATV ve üç tekerlekli araçlara kadar geniş bir yelpazeyi inceleyebilirsiniz. Hangi modelin size uygun olduğuna karar verirken kullanım amacınızı, ehliyet sınıfınızı ve bütçenizi birlikte değerlendiririz.\n\nServis tarafında motosikletinizi randevuyla kabul ediyoruz. Amacımız; ister ilk motosikletini alan biri olun ister her gün yolda olan bir sürücü, aynı özenle ve açıklıkla hizmet vermek.";

export default async function AboutPage() {
  const [settings, authorized, stats, lineup, showcase, gallery, hours] = await Promise.all([
    getSiteSettings(),
    getAuthorizedBrands(),
    getCatalogStats(),
    getBrandLineup(["yuki", "motolux"]),
    getShowcase(["yuki-defender-maxi-adv", "yuki-taro-gp1", "yuki-risotto-125"]),
    getShowcase(["yuki-hammer-50", "yuki-victor", "yuki-thor-utv-400", "yuki-yk-50-spark-new"]),
    getPublicHours(),
  ]);
  const [lead, ...paragraphs] = (settings.aboutText || DEFAULT_TEXT).split(/\n{2,}/);

  return (
    <>
      <ShowcaseHero
        crumb="Hakkımızda"
        eyebrow="Öztunc Motor · Düzce"
        title={
          settings.aboutTitle || (
            <>
              Satış ve servis,
              <br />
              <span className="text-accent">tek adreste</span>
            </>
          )
        }
        lead={lead}
        word="Öztunc"
        showcase={showcase}
        highlights={[
          { value: stats.models, label: "Katalogdaki model" },
          { value: stats.categories, label: "Araç kategorisi" },
          { value: lineup.brands.length || stats.brands, label: "Çalıştığımız ana marka" },
          { value: BUSINESS_LINES.length, label: "Hizmet alanı" },
        ]}
      >
        <div className="mt-9 flex flex-col gap-3 xs:flex-row xs:flex-wrap">
          <Link href="/motosikletler" className="btn btn-primary px-7">
            Modelleri İncele <ArrowRight size={18} />
          </Link>
          <Link href="/iletisim" className="btn btn-outline-light backdrop-blur-sm">
            İletişim ve Konum
          </Link>
        </div>
      </ShowcaseHero>

      {/* ── Hikâye ───────────────────────────────────────── */}
      <section aria-labelledby="biz-kimiz" className="bg-paper">
        <div className="container-x grid gap-14 py-20 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-20 lg:py-28">
          <div className="reveal">
            <p className="eyebrow">Biz kimiz</p>
            <h2 id="biz-kimiz" className="font-display mt-3 text-[2.5rem] font-bold uppercase leading-[0.95] sm:text-5xl lg:text-[3.5rem]">
              Motosiklete <span className="text-accent">tutkuyla</span>, müşteriye <span className="text-accent">açıklıkla</span>
            </h2>
            <div className="mt-8 space-y-5 text-[1.0625rem] leading-relaxed text-[#2b2e33]">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {(authorized.dealer.length > 0 || authorized.service.length > 0) && (
              <dl className="mt-8 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
                {authorized.dealer.length > 0 && (
                  <div>
                    <dt className="text-sm font-extrabold uppercase tracking-[0.12em] text-muted">Yetkili satıcı</dt>
                    <dd className="mt-1 font-semibold">{authorized.dealer.join(", ")}</dd>
                  </div>
                )}
                {authorized.service.length > 0 && (
                  <div>
                    <dt className="text-sm font-extrabold uppercase tracking-[0.12em] text-muted">Yetkili servis</dt>
                    <dd className="mt-1 font-semibold">{authorized.service.join(", ")}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {settings.about1 ? (
            <div className="reveal grid grid-cols-2 gap-4">
              <div className={`relative overflow-hidden rounded-[14px] ${settings.about2 ? "aspect-[3/4]" : "col-span-2 aspect-[4/3]"}`}>
                <Image src={settings.about1.url} alt={settings.about1.alt || "Öztunc Motor showroom"} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
              </div>
              {settings.about2 && (
                <div className="relative mt-12 aspect-[3/4] overflow-hidden rounded-[14px]">
                  <Image src={settings.about2.url} alt={settings.about2.alt || "Öztunc Motor servis"} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
                </div>
              )}
            </div>
          ) : (
            // İşletme fotoğrafı yüklenene kadar: showroom'daki modellerden bir vitrin
            <ul className="grid grid-cols-2 gap-4">
              {gallery.map((g, i) => (
                <li key={g.slug} className={`reveal ${i % 2 ? "mt-10" : ""}`}>
                  <Link
                    href={`/motosikletler/${g.slug}`}
                    className="group on-dark relative block aspect-[4/5] overflow-hidden rounded-[14px] bg-ink"
                  >
                    <span aria-hidden className="grid-bg absolute inset-0" />
                    <span aria-hidden className="accent-glow absolute inset-[22%] opacity-60 transition-opacity group-hover:opacity-100" />
                    <Image
                      src={g.image.url}
                      alt={g.label}
                      fill
                      sizes="(min-width: 1024px) 24vw, 46vw"
                      className="product-shadow object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-ink to-transparent p-4 pt-10 text-sm font-bold text-white">
                      {g.label}
                      <ArrowRight size={16} className="text-accent transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Hizmet alanları ─────────────────────────────── */}
      <section aria-labelledby="ne-yapiyoruz" className="border-t border-line bg-white">
        <div className="container-x py-20 lg:py-28">
          <SectionIntro
            eyebrow="Ne yapıyoruz"
            id="ne-yapiyoruz"
            title={
              <>
                Dört hizmet, <span className="text-accent">tek çatı</span>
              </>
            }
            text="Motosikletinizi seçtiğiniz günden itibaren bakımı, parçası ve ekipmanıyla yanınızdayız."
          />
          <IconCards
            columns={4}
            items={BUSINESS_LINES.map((l) => ({ icon: LINE_ICONS[l.key], title: l.title, text: l.text, href: l.href, cta: l.cta }))}
          />
        </div>
      </section>

      {/* ── İlkeler ─────────────────────────────────────── */}
      <section aria-labelledby="ilkeler" className="on-dark relative isolate overflow-hidden bg-ink text-white">
        <div aria-hidden className="grid-bg absolute inset-0 -z-10 opacity-60" />
        <div aria-hidden className="accent-glow absolute -bottom-48 -left-40 -z-10 h-[30rem] w-[30rem] opacity-40" />
        <div className="container-x py-20 lg:py-28">
          <SectionIntro eyebrow="İlkelerimiz" id="ilkeler" title="Nasıl çalışıyoruz" dark />
          <ol className="mt-14 grid gap-px overflow-hidden rounded-[14px] bg-white/10 md:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <li key={p.title} className="reveal relative bg-ink p-8 transition-colors hover:bg-surface lg:p-10">
                <span aria-hidden className="font-display absolute right-6 top-4 text-7xl font-bold text-white/[0.06]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p.icon size={34} className="text-accent" />
                <h3 className="font-display mt-6 text-3xl font-bold uppercase leading-none">{p.title}</h3>
                <p className="mt-3 leading-relaxed text-white/65">{p.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Markalar ────────────────────────────────────── */}
      {lineup.brands.length > 0 && (
        <section aria-labelledby="markalar" className="bg-paper">
          <div className="container-x py-20 lg:py-28">
            <SectionIntro eyebrow="Markalar" id="markalar" title="Çalıştığımız markalar" />
            <ul className="mt-12 grid gap-5 md:grid-cols-2">
              {lineup.brands.map((b) => (
                <li key={b.slug} className="reveal">
                  <Link
                    href={`/motosikletler?marka=${b.slug}`}
                    className="lift-card group card flex items-center justify-between gap-4 p-6 sm:gap-6 sm:p-8 lg:p-10"
                  >
                    <span>
                      <span className="font-display block text-5xl font-bold uppercase leading-none tracking-wide sm:text-6xl lg:text-7xl">{b.name}</span>
                      <span className="mt-3 block text-[0.9375rem] font-semibold text-muted">
                        <span className="tabular-nums text-text">{b.count}</span> model · satış, servis, parça
                      </span>
                    </span>
                    <span className="inline-flex h-12 w-12 shrink-0 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-ink text-white transition-colors group-hover:bg-accent">
                      <ArrowRight size={22} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Konum ───────────────────────────────────────── */}
      <section aria-labelledby="konum" className="border-t border-line bg-white">
        <div className="container-x grid gap-12 py-20 lg:grid-cols-[1fr_1.25fr] lg:gap-16 lg:py-24">
          <div className="reveal">
            <p className="eyebrow">Konum</p>
            <h2 id="konum" className="font-display mt-3 text-[2.5rem] font-bold uppercase leading-[0.95] sm:text-5xl">
              Showroom ve servis
            </h2>
            <div className="mt-8">
              <ContactDetails settings={settings} hours={hours} />
            </div>
          </div>
          {settings.mapEmbedEnabled && (
            <div className="reveal">
              <MapEmbed query={settings.mapSearchQuery} directionsUrl={settings.directionsUrl} />
            </div>
          )}
        </div>
      </section>

      <CtaBand
        title="Showroom’a bekleriz"
        text="Modelleri yerinde inceleyin, oturun, deneyin; size en uygun motosikleti birlikte seçelim."
        primary={{ href: "/motosikletler", label: "Modelleri İncele" }}
        phoneHref={settings.phoneHref}
        whatsappHref={settings.whatsappNumber ? `https://wa.me/${settings.whatsappNumber}` : null}
      />
    </>
  );
}
