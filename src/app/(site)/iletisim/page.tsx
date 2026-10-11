import type { Metadata } from "next";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { BusinessJsonLd } from "@/components/site/JsonLd";
import { ContactDetails } from "@/components/site/ContactDetails";
import { MapEmbed } from "@/components/site/MapEmbed";
import { PageHero } from "@/components/ui/PageHero";
import { buildMetadata } from "@/lib/seo";
import { issueFormToken } from "@/server/security";
import { getPublicHours, getSeo, getSiteSettings } from "@/server/site";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo("contact");
  return buildMetadata({
    title: seo?.title || "İletişim ve Konum",
    description:
      seo?.description ||
      "Öztunc Motor iletişim ve konum bilgileri: Cedidiye Mahallesi, Mimar Sinan Caddesi No:75, Düzce. Yol tarifi alın veya mesaj bırakın.",
    path: "/iletisim",
  });
}

export default async function ContactPage() {
  const [settings, hours] = await Promise.all([getSiteSettings(), getPublicHours()]);
  return (
    <>
      <BusinessJsonLd settings={settings} hours={hours} />
      <PageHero crumb="İletişim" title="İletişim ve konum" lead="Showroom ve servisimiz Düzce Cedidiye’de. Sorularınız için mesaj bırakın; size dönüş yapalım." />
      <section className="bg-paper">
        <div className="container-x grid gap-12 py-14 lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:py-20">
          <div className="grid content-start gap-10">
            <ContactDetails settings={settings} hours={hours} />
            {settings.mapEmbedEnabled && <MapEmbed query={settings.mapSearchQuery} directionsUrl={settings.directionsUrl} />}
          </div>
          <div className="card h-fit p-6 sm:p-8">
            <h2 className="font-display text-4xl font-bold uppercase leading-none">Mesaj bırakın</h2>
            <p className="mt-3 text-[0.9375rem] text-muted">Model, fiyat veya servis hakkındaki sorularınızı yazın.</p>
            <div className="mt-6">
              <InquiryForm formToken={issueFormToken()} submitLabel="Mesajı Gönder" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
