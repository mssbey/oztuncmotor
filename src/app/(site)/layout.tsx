import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MobileActionBar } from "@/components/site/MobileActionBar";
import { CompareTray } from "@/components/catalog/CompareTray";
import { formatPhone } from "@/lib/validation";
import { getSiteSettings } from "@/server/site";

// İçerik yönetim panelinden değiştiği için her istekte güncel veriyle oluşturulur.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings();
  return (
    <>
      <Header
        logo={settings.logo}
        phoneHref={settings.phoneHref}
        phoneLabel={settings.phone ? formatPhone(settings.phone) : null}
      />
      <main id="icerik">
        {children}
      </main>
      <div className="bg-ink pb-16 lg:pb-0">
        <Footer settings={settings} />
      </div>
      <CompareTray />
      <MobileActionBar phoneHref={settings.phoneHref} />
    </>
  );
}
