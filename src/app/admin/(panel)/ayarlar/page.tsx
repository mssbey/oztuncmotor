import { ActionForm } from "@/components/admin/ActionForm";
import { Field, Toggle } from "@/components/admin/Field";
import { ImageField } from "@/components/admin/ImageField";
import { PageTitle, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatPhone } from "@/lib/validation";
import { requirePage } from "@/server/auth";
import { saveContactSettings, saveContentSettings, saveImageSettings } from "../../actions/settings";

export const metadata = { title: "İletişim ve görseller" };

async function media(id: string | null) {
  if (!id) return null;
  return db.media.findUnique({ where: { id }, select: { id: true, url: true, width: true, height: true } });
}

export default async function SettingsPage() {
  await requirePage("settings");
  const s = (await db.siteSettings.findUnique({ where: { id: 1 } })) ?? (await db.siteSettings.create({ data: { id: 1 } }));
  const [logo, hero, service, about1, about2] = await Promise.all([
    media(s.logoId),
    media(s.heroImageId),
    media(s.serviceImageId),
    media(s.aboutImage1Id),
    media(s.aboutImage2Id),
  ]);

  return (
    <>
      <PageTitle
        title="İletişim ve görseller"
        description="Boş bırakılan iletişim bilgileri sitede hiç gösterilmez; çalışmayan bağlantı oluşturulmaz."
      />
      <div className="grid gap-6">
        <Panel title="İletişim bilgileri">
          <ActionForm action={saveContactSettings} className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field name="addressLine" label="Adres" defaultValue={s.addressLine} />
              <div className="grid grid-cols-3 gap-3">
                <Field name="postalCode" label="Posta kodu" defaultValue={s.postalCode} />
                <Field name="district" label="İlçe" defaultValue={s.district} />
                <Field name="city" label="İl" defaultValue={s.city} />
              </div>
              <Field name="phone" label="Telefon" type="tel" defaultValue={s.phone ? formatPhone(s.phone) : ""} hint="Girilmezse “Ara” düğmeleri gösterilmez." />
              <Field name="whatsapp" label="WhatsApp numarası" type="tel" defaultValue={s.whatsapp ? formatPhone(s.whatsapp) : ""} hint="Girilmezse WhatsApp bağlantıları gösterilmez." />
              <Field name="email" label="E-posta (sitede görünür)" type="email" defaultValue={s.email ?? ""} />
              <Field name="notifyEmail" label="Bildirim e-postası (sitede görünmez)" type="email" defaultValue={s.notifyEmail ?? ""} hint="Yeni randevu ve talepler bu adrese bildirilir." />
              <Field name="instagramUrl" label="Instagram adresi" defaultValue={s.instagramUrl ?? ""} placeholder="https://instagram.com/…" />
              <Field name="facebookUrl" label="Facebook adresi" defaultValue={s.facebookUrl ?? ""} placeholder="https://facebook.com/…" />
              <Field name="latitude" label="Enlem (isteğe bağlı)" inputMode="decimal" defaultValue={s.latitude?.toString() ?? ""} hint="Yapılandırılmış veri için; yalnızca doğrulanmış koordinat girin." />
              <Field name="longitude" label="Boylam (isteğe bağlı)" inputMode="decimal" defaultValue={s.longitude?.toString() ?? ""} />
            </div>
            <Toggle name="mapEmbedEnabled" label="Sitede harita göster (konum bölümünde otomatik yüklenir)" defaultChecked={s.mapEmbedEnabled} />
          </ActionForm>
        </Panel>

        <Panel title="Görseller" description="Gerçek işletme fotoğraflarını kullanın. Görseller büyütülmez; geniş alanlar için en az 1600–2000 px genişlik önerilir.">
          <ActionForm action={saveImageSettings} className="grid gap-6 lg:grid-cols-2">
            <ImageField name="logoId" label="Logo" current={logo} folder="site" contain hint="Koyu zemin üzerinde görünecek, şeffaf arka planlı PNG/WebP önerilir. Yoksa yazı logosu kullanılır." />
            <ImageField name="heroImageId" label="Giriş (hero) fotoğrafı" current={hero} folder="site" minWidth={1600} contain hint="Motosikletin tamamı görünecek şekilde, kesilmeden gösterilir." />
            <ImageField name="serviceImageId" label="Servis fotoğrafı" current={service} folder="site" minWidth={1400} hint="Gerçek servis/atölye fotoğrafı." />
            <ImageField name="aboutImage1Id" label="İşletme fotoğrafı 1" current={about1} folder="site" minWidth={1000} />
            <ImageField name="aboutImage2Id" label="İşletme fotoğrafı 2" current={about2} folder="site" minWidth={800} />
          </ActionForm>
        </Panel>

        <Panel title="Sayfa metinleri" description="Başlıklarda satır sonu (Enter) satır kırılımı olarak kullanılır.">
          <ActionForm action={saveContentSettings} className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field as="textarea" rows={2} name="heroTitle" label="Giriş başlığı" defaultValue={s.heroTitle} />
              <Field as="textarea" rows={2} name="heroText" label="Giriş açıklaması" defaultValue={s.heroText} />
              <Field name="heroLocation" label="Konum satırı" defaultValue={s.heroLocation} />
              <Field as="textarea" rows={2} name="serviceTitle" label="Servis başlığı" defaultValue={s.serviceTitle} />
            </div>
            <Field as="textarea" rows={3} name="serviceText" label="Servis tanıtım metni" defaultValue={s.serviceText} hint="Boşsa varsayılan metin kullanılır." />
            <Field name="aboutTitle" label="Tanıtım başlığı" defaultValue={s.aboutTitle} />
            <Field
              as="textarea"
              rows={6}
              name="aboutText"
              label="Tanıtım metni"
              defaultValue={s.aboutText}
              hint="Paragrafları boş satırla ayırın. Doğrulanmamış kuruluş yılı, müşteri sayısı, ödül veya puan yazmayın."
            />
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
