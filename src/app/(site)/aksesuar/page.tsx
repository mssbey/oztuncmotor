import type { Metadata } from "next";
import { Bag, Device, Helmet, Jacket, Lock, Shield } from "@/components/icons";
import { EquipmentStage } from "@/components/site/EquipmentStage";
import { SupplyPage } from "@/components/site/SupplyPage";
import { buildMetadata } from "@/lib/seo";
import { getBrandLineup } from "@/server/catalog";
import { getPublicHours, getSeo, getSiteSettings } from "@/server/site";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo("accessories");
  return buildMetadata({
    title: seo?.title || "Motosiklet Aksesuar ve Ekipman Düzce",
    description:
      seo?.description ||
      "Öztunc Motor’da kask, sürüş ekipmanı, çanta ve bagaj, koruma ve güvenlik aksesuarları. Motosikletinize uygun aksesuarı birlikte seçelim.",
    path: "/aksesuar",
  });
}

const GROUPS = [
  { icon: Helmet, title: "Kask", items: ["Kapalı (full-face) kask", "Çeneden açılır (modüler) kask", "Açık (jet) kask", "Vizör ve kask aksesuarları"] },
  { icon: Jacket, title: "Sürüş ekipmanı", items: ["Korumalı mont ve pantolon", "Eldiven", "Bot ve ayakkabı", "Yağmurluk ve boyunluk"] },
  { icon: Bag, title: "Çanta ve bagaj", items: ["Arka çanta (top case)", "Yan çanta ve taşıyıcılar", "Depo üstü ve sele çantası", "Bagaj demiri ve sepet"] },
  { icon: Shield, title: "Koruma", items: ["Motor koruma demiri", "El koruma (elcik koruması)", "Ön cam / rüzgarlık", "Çamurluk ve tampon"] },
  { icon: Lock, title: "Güvenlik", items: ["Disk kilidi ve zincir kilit", "Alarm sistemleri", "Motosiklet brandası", "Reflektif yelek"] },
  { icon: Device, title: "Konfor ve elektronik", items: ["Telefon tutucu", "USB şarj soketi", "Kask içi interkom", "Elcik ısıtıcı ve sele minderi"] },
];

const STEPS = [
  { title: "İhtiyacı belirleyin", text: "Motosikletinizi ve aradığınız ürünü yazın; kask için baş ölçünüzü biliyorsanız ekleyin." },
  { title: "Uygun seçenekler", text: "Modelinize uygun ürünleri, stok durumunu ve fiyatları size iletiyoruz." },
  { title: "Deneyin", text: "Kask ve ekipmanları showroom’umuzda deneyerek doğru bedeni seçebilirsiniz." },
  { title: "Montaj", text: "Çanta, koruma demiri, cam gibi aksesuarların montajı servisimizde yapılır." },
];

export default async function AccessoriesPage() {
  const [settings, hours, lineup] = await Promise.all([
    getSiteSettings(),
    getPublicHours(),
    getBrandLineup(["yuki", "motolux"]),
  ]);
  return (
    <SupplyPage
      crumb="Aksesuar"
      word="Ekipman"
      title={
        <>
          Aksesuar
          <br />
          <span className="text-accent">ve ekipman</span>
        </>
      }
      lead="Güvenli ve konforlu sürüş için kask, sürüş ekipmanı, çanta ve bagaj, koruma ve güvenlik ürünleri. Motosikletinize uygun aksesuarı birlikte seçelim, montajını servisimizde yapalım."
      showcase={[]}
      stage={<EquipmentStage groupCount={GROUPS.length} />}
      highlights={[
        { value: GROUPS.length, label: "Ürün grubu" },
        { value: "Dene", label: "Showroom’da beden seçimi" },
        { value: "Uyumlu", label: "Modelinize göre seçim" },
        { value: "Montaj", label: "Servisimizde" },
      ]}
      lineup={lineup}
      groupsTitle={
        <>
          Yola <span className="text-accent">tam donanımlı</span> çıkın
        </>
      }
      groupsText="Aradığınız ürün listede yoksa formdan sorun; modelinize uygun seçenekleri araştırıp size bildirelim."
      groups={GROUPS}
      note="Ürün çeşitleri ve stok durumu dönemsel olarak değişir; güncel seçenekler için bize ulaşın."
      steps={STEPS}
      formTitle="Aksesuar talebi"
      formText="Hangi ürünü aradığınızı yazın, uygun seçenekler ve fiyat bilgisiyle size dönüş yapalım."
      formMessage={"Aksesuar talebi\nMotosiklet marka / model:\nAranan ürün:"}
      whatsappText="Merhaba, aksesuar hakkında bilgi almak istiyorum."
      cta={{ title: "Montajı bize bırakın", text: "Çanta, koruma demiri, cam ve elektronik aksesuarları servisimizde takalım." }}
      settings={settings}
      hours={hours}
    />
  );
}
