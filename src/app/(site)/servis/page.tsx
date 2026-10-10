import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { ContactDetails } from "@/components/site/ContactDetails";
import { MultilineTitle } from "@/components/ui/MultilineTitle";
import { PageHero } from "@/components/ui/PageHero";
import { buildMetadata } from "@/lib/seo";
import { getAuthorizedBrands, getPublicHours, getPublishedServices, getSeo, getSiteSettings } from "@/server/site";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeo("service"), getSiteSettings()]);
  return buildMetadata({
    title: seo?.title || "Motosiklet Servisi Düzce",
    description:
      seo?.description ||
      "Düzce’de motosiklet servisi: Öztunç Motor’da bakım ve onarım hizmetleri için online randevu talebi oluşturun, işlemi ekibimizle netleştirin.",
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

export default async function ServicePage() {
  const [settings, services, hours, authorized] = await Promise.all([
    getSiteSettings(),
    getPublishedServices(),
    getPublicHours(),
    getAuthorizedBrands(),
  ]);

  return (
    <>
      <PageHero
        dark
        crumb="Servis"
        title={<MultilineTitle text={settings.serviceTitle} />}
        lead={
          settings.serviceText ||
          "Düzce’de motosiklet servisi arıyorsanız, Cedidiye’deki atölyemizde motosikletinizi randevuyla kabul ediyoruz. Yapılacak işlemi önceden konuşur, sürprizsiz bir servis deneyimi hedefleriz."
        }
      >
        <div className="mt-8 flex flex-col gap-3 xs:flex-row">
          <Link href="/servis-randevusu" className="btn btn-primary">
            Servis Randevusu Oluştur <ArrowRight size={18} />
          </Link>
          {settings.phoneHref && (
            <a href={settings.phoneHref} className="btn btn-outline-light">
              Servisi arayın
            </a>
          )}
        </div>
      </PageHero>

      {settings.serviceImage && (
        <div className="on-dark bg-ink">
          <div className="container-x pb-14">
            <div className="relative aspect-[16/9] overflow-hidden rounded-[10px] lg:aspect-[21/9]">
              <Image
                src={settings.serviceImage.url}
                alt={settings.serviceImage.alt || "Öztunç Motor servis atölyesi"}
                fill
                priority
                sizes="(min-width: 1408px) 1328px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      )}

      <section aria-labelledby="hizmetler" className="bg-paper">
        <div className="container-x grid gap-12 py-16 lg:grid-cols-[1fr_1.6fr] lg:gap-16 lg:py-24">
          <div>
            <p className="eyebrow">Hizmetler</p>
            <h2 id="hizmetler" className="font-display mt-3 text-[2.5rem] font-bold uppercase leading-[0.95] sm:text-5xl">
              Servisimizde yapılan işlemler
            </h2>
            <p className="mt-4 text-muted">
              Listede olmayan bir işlem için randevu formunda açıklama yazabilir veya bizi arayabilirsiniz.
            </p>
            {authorized.service.length > 0 && (
              <div className="mt-8 border-l-2 border-accent pl-4">
                <h3 className="text-sm font-extrabold uppercase tracking-[0.12em]">Yetkili servis olduğumuz markalar</h3>
                <p className="mt-1.5 font-semibold">{authorized.service.join(", ")}</p>
              </div>
            )}
          </div>
          {services.length > 0 ? (
            <ul className="grid border-t border-line sm:grid-cols-2 sm:gap-x-10">
              {services.map((s, i) => (
                <li key={s.id} className="flex gap-4 border-b border-line py-5">
                  <span className="font-display w-8 shrink-0 text-xl font-semibold tabular-nums text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{s.title}</h3>
                    {s.description && <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">{s.description}</p>}
                    {s.bookable && (
                      <Link href={`/servis-randevusu?islem=${s.id}`} className="link-arrow mt-3 text-sm">
                        Randevu al <ArrowRight size={15} className="text-accent" />
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="card p-6 text-muted">Hizmet listesi güncelleniyor. Servis talepleriniz için bize ulaşabilirsiniz.</p>
          )}
        </div>
      </section>

      <section aria-labelledby="surec" className="border-t border-line bg-white">
        <div className="container-x py-16 lg:py-24">
          <p className="eyebrow">Süreç</p>
          <h2 id="surec" className="font-display mt-3 text-[2.5rem] font-bold uppercase leading-[0.95] sm:text-5xl">
            Randevudan teslime
          </h2>
          <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="border-t-2 border-text pt-5">
                <span className="font-display text-5xl font-bold leading-none text-accent">{i + 1}</span>
                <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="servis-iletisim" className="border-t border-line bg-paper">
        <div className="container-x grid gap-10 py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <h2 id="servis-iletisim" className="font-display text-[2.5rem] font-bold uppercase leading-[0.95] sm:text-5xl">
              Servise ulaşın
            </h2>
            <p className="mt-4 max-w-md text-muted">
              Online randevu talebi bırakabilir ya da adresimize gelerek ekibimizle görüşebilirsiniz.
            </p>
            <Link href="/servis-randevusu" className="btn btn-primary mt-6">
              Servis Randevusu Oluştur
            </Link>
          </div>
          <ContactDetails settings={settings} hours={hours} />
        </div>
      </section>
    </>
  );
}
