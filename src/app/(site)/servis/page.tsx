import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Battery, Bolt, Calendar, Chat, Disc, Drop, Gear, Phone, Wrench } from "@/components/icons";
import { ContactDetails } from "@/components/site/ContactDetails";
import { ModelMarquee } from "@/components/site/ModelMarquee";
import { ShowcaseHero } from "@/components/site/ShowcaseHero";
import { CtaBand, IconCards, ProcessTimeline, SectionIntro } from "@/components/site/showcase-sections";
import { MultilineTitle } from "@/components/ui/MultilineTitle";
import { buildMetadata } from "@/lib/seo";
import { getBrandLineup, getShowcase } from "@/server/catalog";
import { getAuthorizedBrands, getPublicHours, getPublishedServices, getSeo, getSiteSettings } from "@/server/site";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeo("service"), getSiteSettings()]);
  return buildMetadata({
    title: seo?.title || "Motosiklet Servisi Düzce",
    description:
      seo?.description ||
      "Düzce’de motosiklet servisi: Öztunc Motor’da bakım ve onarım hizmetleri için online randevu talebi oluşturun, işlemi ekibimizle netleştirin.",
    path: "/servis",
    image: settings.serviceImage,
  });
}

const STEPS = [
  { title: "Talebinizi iletin", text: "Motosikletinizi, istediğiniz işlemi ve size uygun saati online formdan seçin." },
  { title: "Birlikte netleştirelim", text: "Ekibimiz sizi arayarak işlemi ve kesin randevu saatini teyit eder." },
  { title: "Motosikletinizi getirin", text: "Kabulde yapılacak işlem ve varsa ek ihtiyaçlar size açıkça anlatılır." },
  { title: "Teslim", text: "İşlem tamamlandığında sizi bilgilendirir, yapılanları birlikte gözden geçiririz." },
];

const PROMISES = [
  { icon: Calendar, title: "Randevulu kabul", text: "Online talep bırakın; motosikletinizi kararlaştırdığımız saatte kabul edelim." },
  { icon: Chat, title: "Önce bilgi, sonra işlem", text: "Yapılacak işi ve ek ihtiyaçları başlamadan önce sizinle konuşuruz." },
  { icon: Gear, title: "Orijinal parça", text: "Yuki ve Motolux modelleri için orijinal yedek parça temin ederiz." },
  { icon: Battery, title: "Elektrikli araç desteği", text: "Elektrikli scooter ve üç tekerlekli araçların akü ve şarj kontrolleri." },
];

// Hizmet ikonları slug'a göre; panelden eklenen yeni hizmetler anahtar ikonunu kullanır
const SERVICE_ICONS: Record<string, typeof Wrench> = {
  "periyodik-bakim": Drop,
  "ariza-tespiti": Gear,
  lastik: Disc,
  fren: Disc,
  elektrik: Bolt,
};

export default async function ServicePage() {
  const [settings, services, hours, authorized, showcase, lineup] = await Promise.all([
    getSiteSettings(),
    getPublishedServices(),
    getPublicHours(),
    getAuthorizedBrands(),
    getShowcase(["yuki-taro-gp1", "yuki-victor", "yuki-hammer-50"]),
    getBrandLineup(["yuki", "motolux"]),
  ]);
  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent("Merhaba, servis randevusu hakkında bilgi almak istiyorum.")}`
    : null;

  return (
    <>
      <ShowcaseHero
        crumb="Servis"
        eyebrow="Bakım · Onarım · Parça"
        title={<MultilineTitle text={settings.serviceTitle} />}
        lead={
          settings.serviceText ||
          "Düzce’de motosiklet servisi arıyorsanız, Cedidiye’deki atölyemizde motosikletinizi randevuyla kabul ediyoruz. Yapılacak işlemi önceden konuşur, sürprizsiz bir servis deneyimi hedefleriz."
        }
        word="Servis"
        showcase={showcase}
        highlights={[
          { value: services.length || "—", label: "Servis işlemi" },
          { value: "Online", label: "Randevu talebi" },
          { value: "Orijinal", label: "Yedek parça" },
          { value: "Net", label: "İşlem öncesi bilgi" },
        ]}
      >
        <div className="mt-9 flex flex-col gap-3 xs:flex-row xs:flex-wrap">
          <Link href="/servis-randevusu" className="btn btn-primary px-7">
            Servis Randevusu Oluştur <ArrowRight size={18} />
          </Link>
          {settings.phoneHref && (
            <a href={settings.phoneHref} className="btn btn-outline-light backdrop-blur-sm">
              <Phone size={18} /> Servisi arayın
            </a>
          )}
        </div>
      </ShowcaseHero>

      <ModelMarquee brands={lineup.brands} models={lineup.models} />

      {settings.serviceImage && (
        <div className="bg-paper">
          <div className="container-x pt-20">
            <div className="reveal relative aspect-[16/9] overflow-hidden rounded-[14px] lg:aspect-[21/9]">
              <Image
                src={settings.serviceImage.url}
                alt={settings.serviceImage.alt || "Öztunc Motor servis atölyesi"}
                fill
                sizes="(min-width: 1408px) 1328px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      )}

      <section aria-labelledby="hizmetler" className="bg-paper">
        <div className="container-x py-20 lg:py-28">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <SectionIntro
              eyebrow="Hizmetler"
              id="hizmetler"
              title={
                <>
                  Servisimizde <span className="text-accent">yapılan işlemler</span>
                </>
              }
              text="Listede olmayan bir işlem için randevu formunda açıklama yazabilir veya bizi arayabilirsiniz."
            />
            {authorized.service.length > 0 && (
              <div className="reveal border-l-2 border-accent pl-4 lg:max-w-xs">
                <p className="text-sm font-extrabold uppercase tracking-[0.12em]">Yetkili servis olduğumuz markalar</p>
                <p className="mt-1.5 font-semibold">{authorized.service.join(", ")}</p>
              </div>
            )}
          </div>
          {services.length > 0 ? (
            <IconCards
              items={services.map((s) => ({
                icon: SERVICE_ICONS[s.slug] ?? Wrench,
                title: s.title,
                text: s.description || undefined,
                href: s.bookable ? `/servis-randevusu?islem=${s.id}` : undefined,
                cta: "Randevu al",
              }))}
            />
          ) : (
            <p className="card mt-12 p-6 text-muted">Hizmet listesi güncelleniyor. Servis talepleriniz için bize ulaşabilirsiniz.</p>
          )}
        </div>
      </section>

      <section aria-labelledby="neden" className="on-dark relative isolate overflow-hidden bg-ink text-white">
        <div aria-hidden className="accent-glow absolute -right-40 -top-40 -z-10 h-[32rem] w-[32rem] opacity-40" />
        <div className="container-x grid gap-14 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:py-28">
          <SectionIntro
            eyebrow="Neden Öztunc Motor"
            id="neden"
            title={
              <>
                Sürprizsiz
                <br />
                <span className="text-accent">servis</span>
              </>
            }
            text="Motosikletinizi teslim ettiğinizde ne yapılacağını, neden yapılacağını ve ne zaman hazır olacağını bilirsiniz."
            dark
          />
          <ul className="grid gap-px overflow-hidden rounded-[14px] bg-white/10 sm:grid-cols-2">
            {PROMISES.map((p) => (
              <li key={p.title} className="reveal group bg-ink p-7 transition-colors hover:bg-surface">
                <p.icon size={30} className="text-accent" />
                <h3 className="font-display mt-5 text-2xl font-bold uppercase leading-none">{p.title}</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-white/65">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="surec" className="bg-white">
        <div className="container-x py-20 lg:py-28">
          <SectionIntro eyebrow="Süreç" id="surec" title="Randevudan teslime" />
          <ProcessTimeline steps={STEPS} />
        </div>
      </section>

      <section aria-labelledby="servis-iletisim" className="border-t border-line bg-paper">
        <div className="container-x grid gap-12 py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div className="reveal">
            <p className="eyebrow">İletişim</p>
            <h2 id="servis-iletisim" className="font-display mt-3 text-[2.5rem] font-bold uppercase leading-[0.95] sm:text-5xl lg:text-[3.5rem]">
              Servise ulaşın
            </h2>
            <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-muted">
              Online randevu talebi bırakabilir ya da adresimize gelerek ekibimizle görüşebilirsiniz.
            </p>
          </div>
          <div className="reveal">
            <ContactDetails settings={settings} hours={hours} />
          </div>
        </div>
      </section>

      <CtaBand
        title="Motorun hazır mı?"
        text="Bakım zamanı geldiyse randevunuzu şimdi oluşturun; uygun saati birlikte netleştirelim."
        primary={{ href: "/servis-randevusu", label: "Randevu Oluştur" }}
        phoneHref={settings.phoneHref}
        whatsappHref={whatsappHref}
      />
    </>
  );
}
