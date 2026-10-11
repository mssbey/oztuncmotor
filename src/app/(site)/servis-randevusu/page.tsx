import type { Metadata } from "next";
import { AppointmentWizard } from "@/components/forms/AppointmentWizard";
import { ContactDetails } from "@/components/site/ContactDetails";
import { PageHero } from "@/components/ui/PageHero";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { showDemo } from "@/server/catalog";
import { getAvailability } from "@/server/schedule";
import { issueFormToken } from "@/server/security";
import { getPublicHours, getSeo, getSiteSettings } from "@/server/site";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo("appointment");
  return buildMetadata({
    title: seo?.title || "Servis Randevusu",
    description:
      seo?.description ||
      "Öztunc Motor Düzce servisinden üç adımda online randevu talebi oluşturun: motosiklet ve işlem, tarih ve saat, iletişim bilgileri.",
    path: "/servis-randevusu",
  });
}

export default async function AppointmentPage({ searchParams }: PageProps<"/servis-randevusu">) {
  const sp = await searchParams;
  const initialServiceId = typeof sp.islem === "string" ? sp.islem : undefined;
  const [availability, brands, services, settings, hours] = await Promise.all([
    getAvailability(),
    db.brand.findMany({
      where: showDemo() ? {} : { isDemo: false },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    db.serviceItem.findMany({
      where: { published: true, bookable: true, ...(showDemo() ? {} : { isDemo: false }) },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: { id: true, title: true, description: true },
    }),
    getSiteSettings(),
    getPublicHours(),
  ]);

  const available = availability.enabled && services.length > 0;

  return (
    <>
      <PageHero
        crumb="Servis Randevusu"
        title="Servis randevusu"
        lead="Üç adımda talebinizi iletin. Gönderdiğiniz zaman bir taleptir; ekibimiz sizi arayarak kesin tarih ve saati teyit eder."
      />
      <section className="bg-paper">
        <div className="container-x py-10 lg:py-14">
          {available ? (
            <div className="mx-auto max-w-4xl">
              <AppointmentWizard
                formToken={issueFormToken()}
                brands={brands}
                services={services}
                initialDays={availability.days}
                initialServiceId={initialServiceId}
              />
            </div>
          ) : (
            <div className="card mx-auto grid max-w-4xl gap-8 p-6 sm:p-10 lg:grid-cols-2">
              <div>
                <h2 className="font-display text-4xl font-bold uppercase leading-none">Online randevu şu anda kapalı</h2>
                <p className="mt-4 text-muted">
                  Servis randevusu için bizi arayabilir veya adresimize gelebilirsiniz. Online randevu açıldığında bu sayfadan
                  talep oluşturabileceksiniz.
                </p>
              </div>
              <ContactDetails settings={settings} hours={hours} />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
