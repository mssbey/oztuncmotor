import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { PageHero } from "@/components/ui/PageHero";
import { buildMetadata } from "@/lib/seo";
import { getAuthorizedBrands, getSeo, getSiteSettings } from "@/server/site";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeo("about"), getSiteSettings()]);
  return buildMetadata({
    title: seo?.title || "Hakkımızda",
    description:
      seo?.description ||
      "Öztunç Motor, Düzce Cedidiye’de motosiklet satışı ve servis hizmeti veren bir işletmedir. Showroom ve servisimizi tanıyın.",
    path: "/hakkimizda",
    image: settings.about1,
  });
}

const PRINCIPLES = [
  {
    title: "Yerinde inceleme",
    text: "Modelleri showroom’da yakından görün, oturun, ölçülerini ve sürüş pozisyonunu kendiniz deneyimleyin.",
  },
  {
    title: "Açık bilgi",
    text: "Fiyat, stok ve teslim durumu konusunda net bilgi veririz; emin olmadığımız bir bilgiyi kesinmiş gibi sunmayız.",
  },
  {
    title: "Planlı servis",
    text: "Servis işlemlerini randevuyla kabul eder, yapılacak işi başlamadan önce sizinle konuşuruz.",
  },
];

export default async function AboutPage() {
  const [settings, authorized] = await Promise.all([getSiteSettings(), getAuthorizedBrands()]);
  const paragraphs = (
    settings.aboutText ||
    "Öztunç Motor, Düzce’nin Cedidiye Mahallesi’nde, Mimar Sinan Caddesi üzerinde motosiklet satışı ve servis hizmeti veren bir işletmedir.\n\nShowroom’umuzda şehir içi kullanıma uygun scooter’lardan uzun yol modellerine kadar farklı motosikletleri inceleyebilirsiniz. Hangi modelin size uygun olduğuna karar verirken kullanım amacınızı, ehliyet sınıfınızı ve bütçenizi birlikte değerlendiririz.\n\nServis tarafında motosikletinizi randevuyla kabul ediyoruz. Amacımız; ister ilk motosikletini alan biri olun ister her gün yolda olan bir sürücü, aynı özenle ve açıklıkla hizmet vermek."
  ).split(/\n{2,}/);

  return (
    <>
      <PageHero crumb="Hakkımızda" title={settings.aboutTitle || "Düzce’de motosiklet satış ve servis"} />

      <section className="bg-paper">
        <div className={`container-x grid gap-12 py-14 lg:py-20 ${settings.about1 ? "lg:grid-cols-2 lg:gap-16" : ""}`}>
          <div className={`space-y-5 text-[1.0625rem] leading-relaxed text-[#2b2e33] ${settings.about1 ? "" : "max-w-3xl"}`}>
            {paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "text-xl font-semibold leading-relaxed text-text" : ""}>
                {p}
              </p>
            ))}
            {(authorized.dealer.length > 0 || authorized.service.length > 0) && (
              <dl className="grid gap-4 border-t border-line pt-6 text-base sm:grid-cols-2">
                {authorized.dealer.length > 0 && (
                  <div>
                    <dt className="text-sm font-extrabold uppercase tracking-[0.12em] text-muted">Yetkili satıcı</dt>
                    <dd className="mt-1 font-semibold text-text">{authorized.dealer.join(", ")}</dd>
                  </div>
                )}
                {authorized.service.length > 0 && (
                  <div>
                    <dt className="text-sm font-extrabold uppercase tracking-[0.12em] text-muted">Yetkili servis</dt>
                    <dd className="mt-1 font-semibold text-text">{authorized.service.join(", ")}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
          {settings.about1 && (
            <div className="grid grid-cols-2 gap-4">
              <div className={`relative overflow-hidden rounded-[10px] ${settings.about2 ? "aspect-[3/4]" : "col-span-2 aspect-[4/3]"}`}>
                <Image src={settings.about1.url} alt={settings.about1.alt || "Öztunç Motor showroom"} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
              </div>
              {settings.about2 && (
                <div className="relative mt-12 aspect-[3/4] overflow-hidden rounded-[10px]">
                  <Image src={settings.about2.url} alt={settings.about2.alt || "Öztunç Motor servis"} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-line bg-white">
        <div className="container-x py-14 lg:py-20">
          <h2 className="font-display text-[2.5rem] font-bold uppercase leading-[0.95] sm:text-5xl">Nasıl çalışıyoruz</h2>
          <ul className="mt-10 grid gap-10 md:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="border-l-2 border-accent pl-5">
                <h3 className="text-lg font-bold">{p.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{p.text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-12 flex flex-col gap-3 xs:flex-row">
            <Link href="/motosikletler" className="btn btn-dark">
              Modelleri incele <ArrowRight size={18} />
            </Link>
            <Link href="/iletisim" className="btn btn-outline">
              İletişim ve konum
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
